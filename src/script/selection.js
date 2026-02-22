import { dom } from './dom.js';
import { state } from './state.js';
import { applyZoom } from './zoom.js';
import { captureFullVisibleImage, captureRegion } from './capture.js';

/**
 * マウス/タッチイベントから overlay 上の座標を取得する。
 * @param {MouseEvent | TouchEvent} e ポインタイベント
 * @returns {{x:number, y:number}}
 */
function getPointerPos(e) {
	const rect = dom.overlay.getBoundingClientRect();
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

/**
 * 選択矩形のガイド描画を行う。
 * @param {number} x 左上X
 * @param {number} y 左上Y
 * @param {number} w 幅
 * @param {number} h 高さ
 * @returns {void}
 */
function drawSelectionRect(x, y, w, h) {
	dom.ctx.clearRect(0, 0, dom.overlay.width, dom.overlay.height);
	dom.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
	dom.ctx.fillRect(0, 0, dom.overlay.width, dom.overlay.height);
	dom.ctx.globalCompositeOperation = 'destination-out';
	dom.ctx.fillRect(x, y, w, h);
	dom.ctx.globalCompositeOperation = 'source-over';
	dom.ctx.strokeStyle = '#10b981';
	dom.ctx.lineWidth = 4;
	dom.ctx.setLineDash([8, 8]);
	dom.ctx.strokeRect(x, y, w, h);
	dom.ctx.setLineDash([]);
}

/**
 * 2本指タッチ間の距離を返す。
 * @param {TouchEvent} e タッチイベント
 * @returns {number}
 */
function getPinchDistance(e) {
	const dx = e.touches[0].clientX - e.touches[1].clientX;
	const dy = e.touches[0].clientY - e.touches[1].clientY;
	return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 選択/ピンチ開始を処理する。
 * @param {MouseEvent | TouchEvent} e ポインタイベント
 * @returns {void}
 */
function handleStart(e) {
	if (e.touches && e.touches.length === 2) {
		state.isPinching = true;
		state.isSelecting = false;
		state.initialPinchDist = getPinchDistance(e);
		state.initialZoomAtPinch = state.zoomScale;
		if (e.cancelable) e.preventDefault();
		return;
	}

	state.isSelecting = true;
	state.isPinching = false;
	const pos = getPointerPos(e);
	state.startX = pos.x;
	state.startY = pos.y;
	if (e.cancelable) e.preventDefault();
}

/**
 * 選択中の矩形更新、またはピンチズーム更新を処理する。
 * @param {MouseEvent | TouchEvent} e ポインタイベント
 * @returns {void}
 */
function handleMove(e) {
	if (state.isPinching && e.touches && e.touches.length === 2) {
		const dist = getPinchDistance(e);
		const zoomFactor = dist / state.initialPinchDist;
		const newScale = Math.max(1, Math.min(state.initialZoomAtPinch * zoomFactor, 5));

		const rect = dom.overlay.getBoundingClientRect();
		const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
		const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;

		applyZoom(newScale, centerX, centerY);
		if (e.cancelable) e.preventDefault();
		return;
	}

	if (!state.isSelecting) return;
	if (e.cancelable) e.preventDefault();

	const pos = getPointerPos(e);
	const cx = Math.max(0, Math.min(dom.overlay.width, pos.x));
	const cy = Math.max(0, Math.min(dom.overlay.height, pos.y));
	const sx = Math.max(0, Math.min(dom.overlay.width, state.startX));
	const sy = Math.max(0, Math.min(dom.overlay.height, state.startY));

	drawSelectionRect(Math.min(sx, cx), Math.min(sy, cy), Math.abs(cx - sx), Math.abs(cy - sy));
}

/**
 * 選択終了時に全体/部分撮影を実行する。
 * @param {MouseEvent | TouchEvent} e ポインタイベント
 * @returns {void}
 */
function handleEnd(e) {
	if (state.isPinching) {
		state.isPinching = false;
		return;
	}

	if (!state.isSelecting) return;
	state.isSelecting = false;
	dom.ctx.clearRect(0, 0, dom.overlay.width, dom.overlay.height);

	const pos = getPointerPos(e);
	const ex = Math.max(0, Math.min(dom.overlay.width, pos.x));
	const ey = Math.max(0, Math.min(dom.overlay.height, pos.y));
	const sx = Math.max(0, Math.min(dom.overlay.width, state.startX));
	const sy = Math.max(0, Math.min(dom.overlay.height, state.startY));

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

/**
 * 矩形選択とピンチ操作に関するイベントを登録する。
 * @returns {void}
 */
export function initSelectionControls() {
	dom.overlay.addEventListener('mousedown', handleStart);
	dom.overlay.addEventListener('touchstart', handleStart, { passive: false });
	window.addEventListener('mousemove', handleMove);
	window.addEventListener('touchmove', handleMove, { passive: false });
	window.addEventListener('mouseup', handleEnd);
	window.addEventListener('touchend', handleEnd);
	window.addEventListener('touchcancel', handleEnd);
}
