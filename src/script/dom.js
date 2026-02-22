/**
 * アプリで利用するDOM参照の集合。
 * @typedef {Object} DomRefs
 * @property {HTMLVideoElement} video
 * @property {HTMLCanvasElement} overlay
 * @property {HTMLElement} container
 * @property {HTMLElement} toast
 * @property {HTMLElement} settingsModal
 * @property {HTMLButtonElement} captureBtn
 * @property {HTMLButtonElement} switchBtn
 * @property {HTMLElement} settingsBtn
 * @property {HTMLButtonElement} applySettingsBtn
 * @property {HTMLSelectElement} settingQuality
 * @property {HTMLSelectElement} settingCamera
 * @property {CanvasRenderingContext2D} ctx
 */

/** @type {DomRefs} */
export const dom = {
	video: /** @type {HTMLVideoElement} */ (document.getElementById('video')),
	overlay: /** @type {HTMLCanvasElement} */ (document.getElementById('overlay')),
	container: /** @type {HTMLElement} */ (document.getElementById('video-container')),
	toast: /** @type {HTMLElement} */ (document.getElementById('toast')),
	settingsModal: /** @type {HTMLElement} */ (document.getElementById('settings-modal')),
	captureBtn: /** @type {HTMLButtonElement} */ (document.getElementById('capture-btn')),
	switchBtn: /** @type {HTMLButtonElement} */ (document.getElementById('switch-btn')),
	settingsBtn: /** @type {HTMLElement} */ (document.getElementById('settings-btn')),
	applySettingsBtn: /** @type {HTMLButtonElement} */ (document.getElementById('apply-settings-btn')),
	settingQuality: /** @type {HTMLSelectElement} */ (document.getElementById('setting-quality')),
	settingCamera: /** @type {HTMLSelectElement} */ (document.getElementById('setting-camera')),
	ctx: /** @type {CanvasRenderingContext2D} */ (null)
};

dom.ctx = dom.overlay.getContext('2d');
