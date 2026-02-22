import { QUALITY_MAP } from './config.js';
import { dom } from './dom.js';
import { state } from './state.js';
import { showToast } from './toast.js';
import { resetZoom } from './zoom.js';

/**
 * 現在の設定に基づいてカメラストリームを開始/再開始する。
 * @returns {Promise<void>}
 */
export async function startCamera() {
	if (state.stream) {
		state.stream.getTracks().forEach(track => track.stop());
	}

	const res = QUALITY_MAP[state.activeConfig.quality];

	try {
		state.stream = await navigator.mediaDevices.getUserMedia({
			video: {
				facingMode: state.currentFacingMode,
				width: { ideal: res.width },
				height: { ideal: res.height }
			}
		});
		dom.video.srcObject = state.stream;
	} catch (err) {
		console.error('Camera Access Error:', err);
		showToast('カメラへのアクセスに失敗しました', true);
	}
}

/**
 * 動画アスペクト比に合わせて表示コンテナと overlay をリサイズする。
 * @returns {void}
 */
function resizeContainer() {
	if (!dom.video.videoWidth) return;

	const ratio = dom.video.videoWidth / dom.video.videoHeight;
	const availableWidth = window.innerWidth;
	const availableHeight = window.innerHeight;

	let w = availableWidth;
	let h = w / ratio;

	if (h > availableHeight) {
		h = availableHeight;
		w = h * ratio;
	}

	dom.container.style.width = `${w}px`;
	dom.container.style.height = `${h}px`;
	dom.overlay.width = w;
	dom.overlay.height = h;

	resetZoom();
}

/**
 * カメラ関連イベントを登録する。
 * @returns {void}
 */
export function initCameraEvents() {
	dom.video.addEventListener('loadedmetadata', resizeContainer);
	window.addEventListener('resize', resizeContainer);
}
