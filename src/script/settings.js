import { dom } from './dom.js';
import { state } from './state.js';
import { resetZoom } from './zoom.js';
import { startCamera } from './camera.js';

/**
 * 設定モーダル関連のイベントを登録する。
 * @returns {void}
 */
export function initSettingsControls() {
	dom.settingsBtn.addEventListener('click', () => {
		dom.settingQuality.value = state.activeConfig.quality;
		dom.settingCamera.value = state.activeConfig.facingMode;
		dom.settingsModal.classList.add('active');
	});

	dom.applySettingsBtn.addEventListener('click', () => {
		state.activeConfig.quality = dom.settingQuality.value;
		state.activeConfig.facingMode = dom.settingCamera.value;
		state.currentFacingMode = state.activeConfig.facingMode;
		dom.settingsModal.classList.remove('active');
		resetZoom();
		startCamera();
	});
}
