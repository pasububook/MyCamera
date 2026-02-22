// DOM要素
const video = document.getElementById('video');
const overlay = document.getElementById('overlay');
const container = document.getElementById('video-container');
const ctx = overlay.getContext('2d');
const toast = document.getElementById('toast');
const settingsModal = document.getElementById('settings-modal');

// ==== ハードコーディングされた設定情報 (永続的変更は不可) ====
const HARDCODED_CONFIG = {
	quality: '1080p',       // デフォルト画質
	facingMode: 'environment' // デフォルトカメラ
};

// 一時的に適用される設定値（リロードで上記にリセットされる）
let activeConfig = { ...HARDCODED_CONFIG };

const QUALITY_MAP = {
	'480p': { width: 640, height: 480 },
	'720p': { width: 1280, height: 720 },
	'1080p': { width: 1920, height: 1080 },
	'4k': { width: 3840, height: 2160 }
};

// 状態変数
let stream = null;
let currentFacingMode = activeConfig.facingMode;

// 操作系変数
let isSelecting = false;
let startX = 0;
let startY = 0;

// ズーム・パン系変数
let zoomScale = 1;
let panX = 0;
let panY = 0;

function showToast(message, isError = false) {
	toast.textContent = message;
	toast.className = 'toast' + (isError ? ' error' : '') + ' show';
	setTimeout(() => {
		toast.classList.remove('show');
	}, 3000);
}

// カメラ起動
async function startCamera() {
	if (stream) {
		stream.getTracks().forEach(track => track.stop());
	}

	const res = QUALITY_MAP[activeConfig.quality];

	try {
		stream = await navigator.mediaDevices.getUserMedia({
			video: {
				facingMode: currentFacingMode,
				width: { ideal: res.width },
				height: { ideal: res.height }
			}
		});
		video.srcObject = stream;
	} catch (err) {
		console.error('Camera Access Error:', err);
		showToast('カメラへのアクセスに失敗しました', true);
	}
}

// 映像読み込み時・リサイズ時のコンテナ調整
function resizeContainer() {
	if (!video.videoWidth) return;
	const ratio = video.videoWidth / video.videoHeight;
	const availableWidth = window.innerWidth;
	const availableHeight = window.innerHeight;

	let w = availableWidth;
	let h = w / ratio;

	if (h > availableHeight) {
		h = availableHeight;
		w = h * ratio;
	}

	container.style.width = `${w}px`;
	container.style.height = `${h}px`;

	// Canvasはコンテナの表示ピクセル数に合わせる（これにより計算がシンプルに）
	overlay.width = w;
	overlay.height = h;

	// リサイズされたらズームをリセット
	resetZoom();
}

video.addEventListener('loadedmetadata', resizeContainer);
window.addEventListener('resize', resizeContainer);

// ===== ズームとパン (デジタルズーム) の実装 =====

function resetZoom() {
	zoomScale = 1;
	panX = 0;
	panY = 0;
	updateVideoTransform();
}

function updateVideoTransform() {
	video.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomScale})`;
}

function applyZoom(newScale, targetX, targetY) {
	// 現在のターゲット座標におけるローカルな位置
	const localX = (targetX - panX) / zoomScale;
	const localY = (targetY - panY) / zoomScale;

	// スケール変更後のパン位置を逆算
	panX = targetX - localX * newScale;
	panY = targetY - localY * newScale;
	zoomScale = newScale;

	// 画面外にパンしすぎないよう境界を制限
	const minPanX = overlay.width - overlay.width * zoomScale;
	const minPanY = overlay.height - overlay.height * zoomScale;

	panX = Math.min(0, Math.max(minPanX, panX));
	panY = Math.min(0, Math.max(minPanY, panY));

	updateVideoTransform();
}

// マウスホイールでのズーム
overlay.addEventListener(
	'wheel',
	e => {
		e.preventDefault();
		// 上スクロールで拡大、下スクロールで縮小
		const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
		const newScale = Math.max(1, Math.min(zoomScale * zoomFactor, 5)); // 1倍〜5倍

		if (newScale === zoomScale) return;

		const rect = overlay.getBoundingClientRect();
		const mouseX = e.clientX - rect.left;
		const mouseY = e.clientY - rect.top;

		applyZoom(newScale, mouseX, mouseY);
	},
	{ passive: false }
);

// ===== キャプチャとクリップボード =====

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

// ズーム状態を加味して指定領域をキャプチャする関数
function captureRegion(sx, sy, sw, sh) {
	if (!video.videoWidth) return;

	// 画面表示サイズと実映像サイズの比率
	const ratioX = video.videoWidth / overlay.width;
	const ratioY = video.videoHeight / overlay.height;

	// ズーム・パンを考慮して、実際のビデオのどの領域かを計算
	const actX = ((sx - panX) / zoomScale) * ratioX;
	const actY = ((sy - panY) / zoomScale) * ratioY;
	const actW = (sw / zoomScale) * ratioX;
	const actH = (sh / zoomScale) * ratioY;

	const tempCanvas = document.createElement('canvas');
	tempCanvas.width = actW;
	tempCanvas.height = actH;
	const tempCtx = tempCanvas.getContext('2d');

	// 画像を滑らかに描画
	tempCtx.imageSmoothingEnabled = true;
	tempCtx.imageSmoothingQuality = 'high';

	tempCtx.drawImage(video, actX, actY, actW, actH, 0, 0, actW, actH);
	copyCanvasToClipboard(tempCanvas);
}

function captureFullVisibleImage() {
	// 現在画面に見えている領域全体をキャプチャ
	captureRegion(0, 0, overlay.width, overlay.height);
}

document.getElementById('capture-btn').addEventListener('click', captureFullVisibleImage);
document.getElementById('switch-btn').addEventListener('click', () => {
	currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
	startCamera();
});

// ===== 矩形選択撮影 (マウス・タッチ) =====

function getPointerPos(e) {
	const rect = overlay.getBoundingClientRect();
	let clientX;
	let clientY;
	if (e.touches && e.touches.length > 0) {
		clientX = e.touches[0].clientX;
		clientY = e.touches[0].clientY;
	} else if (e.changedTouches && e.changedTouches.length > 0) {
		clientX = e.changedTouches[0].clientX;
		clientY = e.changedTouches[0].clientY;
	} else {
		clientX = e.clientX;
		clientY = e.clientY;
	}
	return { x: clientX - rect.left, y: clientY - rect.top };
}

function drawSelectionRect(x, y, w, h) {
	ctx.clearRect(0, 0, overlay.width, overlay.height);
	ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
	ctx.fillRect(0, 0, overlay.width, overlay.height);
	ctx.globalCompositeOperation = 'destination-out';
	ctx.fillRect(x, y, w, h);
	ctx.globalCompositeOperation = 'source-over';
	ctx.strokeStyle = '#10b981';
	ctx.lineWidth = 4;
	ctx.setLineDash([8, 8]);
	ctx.strokeRect(x, y, w, h);
	ctx.setLineDash([]);
}

let isPinching = false;
let initialPinchDist = 0;
let initialZoomAtPinch = 1;

function getPinchDistance(e) {
	const dx = e.touches[0].clientX - e.touches[1].clientX;
	const dy = e.touches[0].clientY - e.touches[1].clientY;
	return Math.sqrt(dx * dx + dy * dy);
}

function handleStart(e) {
	// 2本指タッチの場合はピンチズームへ
	if (e.touches && e.touches.length === 2) {
		isPinching = true;
		isSelecting = false;
		initialPinchDist = getPinchDistance(e);
		initialZoomAtPinch = zoomScale;
		if (e.cancelable) e.preventDefault();
		return;
	}

	isSelecting = true;
	isPinching = false;
	const pos = getPointerPos(e);
	startX = pos.x;
	startY = pos.y;
	if (e.cancelable) e.preventDefault();
}

function handleMove(e) {
	if (isPinching && e.touches && e.touches.length === 2) {
		const dist = getPinchDistance(e);
		const zoomFactor = dist / initialPinchDist;
		const newScale = Math.max(1, Math.min(initialZoomAtPinch * zoomFactor, 5));

		// ピンチ中心座標を簡易的に2本指の中間とする
		const rect = overlay.getBoundingClientRect();
		const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
		const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;

		applyZoom(newScale, centerX, centerY);
		if (e.cancelable) e.preventDefault();
		return;
	}

	if (!isSelecting) return;
	if (e.cancelable) e.preventDefault();

	const pos = getPointerPos(e);
	const cx = Math.max(0, Math.min(overlay.width, pos.x));
	const cy = Math.max(0, Math.min(overlay.height, pos.y));
	const sx = Math.max(0, Math.min(overlay.width, startX));
	const sy = Math.max(0, Math.min(overlay.height, startY));

	drawSelectionRect(Math.min(sx, cx), Math.min(sy, cy), Math.abs(cx - sx), Math.abs(cy - sy));
}

function handleEnd(e) {
	if (isPinching) {
		isPinching = false;
		return;
	}

	if (!isSelecting) return;
	isSelecting = false;
	ctx.clearRect(0, 0, overlay.width, overlay.height);

	const pos = getPointerPos(e);
	const ex = Math.max(0, Math.min(overlay.width, pos.x));
	const ey = Math.max(0, Math.min(overlay.height, pos.y));
	const sx = Math.max(0, Math.min(overlay.width, startX));
	const sy = Math.max(0, Math.min(overlay.height, startY));

	const rectX = Math.min(sx, ex);
	const rectY = Math.min(sy, ey);
	const rectW = Math.abs(ex - sx);
	const rectH = Math.abs(ey - sy);

	if (rectW < 10 || rectH < 10) {
		captureFullVisibleImage();
	} else {
		captureRegion(rectX, rectY, rectW, rectH);
	}
}

overlay.addEventListener('mousedown', handleStart);
overlay.addEventListener('touchstart', handleStart, { passive: false });
window.addEventListener('mousemove', handleMove);
window.addEventListener('touchmove', handleMove, { passive: false });
window.addEventListener('mouseup', handleEnd);
window.addEventListener('touchend', handleEnd);
window.addEventListener('touchcancel', handleEnd);

// ===== 設定画面の処理 =====

document.getElementById('settings-btn').addEventListener('click', () => {
	// モーダルを開く前に現在の値をセット
	document.getElementById('setting-quality').value = activeConfig.quality;
	document.getElementById('setting-camera').value = activeConfig.facingMode;
	settingsModal.classList.add('active');
});

document.getElementById('apply-settings-btn').addEventListener('click', () => {
	// 設定を適用してモーダルを閉じる
	activeConfig.quality = document.getElementById('setting-quality').value;
	activeConfig.facingMode = document.getElementById('setting-camera').value;

	currentFacingMode = activeConfig.facingMode;
	settingsModal.classList.remove('active');

	resetZoom();
	startCamera();
});

// アプリ起動
startCamera();
