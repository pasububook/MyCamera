import { dom } from './dom.js';
import { state } from './state.js';
import { showToast } from './toast.js';
import { startCamera } from './camera.js';

/**
 * Canvas画像をPNGとしてクリップボードへコピーする。
 * @param {HTMLCanvasElement} targetCanvas コピー対象Canvas
 * @returns {void}
 */
function copyCanvasToClipboard(targetCanvas) {
	targetCanvas.toBlob(blob => {
		if (!blob) {
			showToast('画像生成に失敗しました', true);
			return;
		}

		try {
			const item = new ClipboardItem({ 'image/png': blob });
			navigator.clipboard
				.write([item])
				.then(() => {
					showToast('✅ 画像をクリップボードにコピーしました！');
				})
				.catch(() => {
					showToast('クリップボードへの書き込みに失敗しました', true);
				});
		} catch (err) {
			showToast('クリップボードAPIに未対応です', true);
		}
	}, 'image/png');
}

/**
 * 表示領域座標を元に、実映像から該当範囲を切り出してコピーする。
 * @param {number} sx 開始X
 * @param {number} sy 開始Y
 * @param {number} sw 幅
 * @param {number} sh 高さ
 * @returns {void}
 */
export function captureRegion(sx, sy, sw, sh) {
	if (!dom.video.videoWidth) return;

	const ratioX = dom.video.videoWidth / dom.overlay.width;
	const ratioY = dom.video.videoHeight / dom.overlay.height;

	const actX = ((sx - state.panX) / state.zoomScale) * ratioX;
	const actY = ((sy - state.panY) / state.zoomScale) * ratioY;
	const actW = (sw / state.zoomScale) * ratioX;
	const actH = (sh / state.zoomScale) * ratioY;

	const tempCanvas = document.createElement('canvas');
	tempCanvas.width = actW;
	tempCanvas.height = actH;
	const tempCtx = tempCanvas.getContext('2d');

	tempCtx.imageSmoothingEnabled = true;
	tempCtx.imageSmoothingQuality = 'high';

	tempCtx.drawImage(dom.video, actX, actY, actW, actH, 0, 0, actW, actH);
	copyCanvasToClipboard(tempCanvas);
}

/**
 * 現在表示されている領域全体をコピーする。
 * @returns {void}
 */
export function captureFullVisibleImage() {
	captureRegion(0, 0, dom.overlay.width, dom.overlay.height);
}

/**
 * 撮影ボタンとカメラ切替ボタンのイベントを登録する。
 * @returns {void}
 */
export function initCaptureControls() {
	dom.captureBtn.addEventListener('click', captureFullVisibleImage);
	dom.switchBtn.addEventListener('click', () => {
		state.currentFacingMode = state.currentFacingMode === 'user' ? 'environment' : 'user';
		startCamera();
	});
}
