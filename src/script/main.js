import { initCameraEvents, startCamera } from './camera.js';
import { initZoomControls } from './zoom.js';
import { initCaptureControls } from './capture.js';
import { initSelectionControls } from './selection.js';
import { initSettingsControls } from './settings.js';

/**
 * 各機能モジュールを初期化し、カメラを起動する。
 * @returns {void}
 */
function bootstrap() {
	initCameraEvents();
	initZoomControls();
	initCaptureControls();
	initSelectionControls();
	initSettingsControls();
	startCamera();
}

bootstrap();
