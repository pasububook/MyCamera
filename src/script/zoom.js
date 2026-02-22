import { dom } from './dom.js';
import { state } from './state.js';

/**
 * ズーム倍率とパン位置を初期状態に戻す。
 * @returns {void}
 */
export function resetZoom() {
	state.zoomScale = 1;
	state.panX = 0;
	state.panY = 0;
	updateVideoTransform();
}

/**
 * video 要素へズーム/パンの transform を反映する。
 * @returns {void}
 */
function updateVideoTransform() {
	dom.video.style.transform = `translate(${state.panX}px, ${state.panY}px) scale(${state.zoomScale})`;
}

/**
 * 指定位置を基準にズーム倍率を適用する。
 * @param {number} newScale 新しい倍率
 * @param {number} targetX 基準X座標（overlay座標）
 * @param {number} targetY 基準Y座標（overlay座標）
 * @returns {void}
 */
export function applyZoom(newScale, targetX, targetY) {
	const localX = (targetX - state.panX) / state.zoomScale;
	const localY = (targetY - state.panY) / state.zoomScale;

	state.panX = targetX - localX * newScale;
	state.panY = targetY - localY * newScale;
	state.zoomScale = newScale;

	const minPanX = dom.overlay.width - dom.overlay.width * state.zoomScale;
	const minPanY = dom.overlay.height - dom.overlay.height * state.zoomScale;

	state.panX = Math.min(0, Math.max(minPanX, state.panX));
	state.panY = Math.min(0, Math.max(minPanY, state.panY));

	updateVideoTransform();
}

/**
 * マウスホイールによるズーム操作を初期化する。
 * @returns {void}
 */
export function initZoomControls() {
	dom.overlay.addEventListener(
		'wheel',
		e => {
			e.preventDefault();
			const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
			const newScale = Math.max(1, Math.min(state.zoomScale * zoomFactor, 5));
			if (newScale === state.zoomScale) return;

			const rect = dom.overlay.getBoundingClientRect();
			const mouseX = e.clientX - rect.left;
			const mouseY = e.clientY - rect.top;
			applyZoom(newScale, mouseX, mouseY);
		},
		{ passive: false }
	);
}
