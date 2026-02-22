/**
 * @typedef {'480p'|'720p'|'1080p'|'4k'} CameraQuality
 */

/**
 * @typedef {{width:number, height:number}} Resolution
 */

/**
 * @typedef {{quality: CameraQuality, facingMode: 'user'|'environment'}} AppConfig
 */

/** @type {AppConfig} */
export const HARDCODED_CONFIG = {
	quality: '1080p',
	facingMode: 'environment'
};

/** @type {Record<CameraQuality, Resolution>} */
export const QUALITY_MAP = {
	'480p': { width: 640, height: 480 },
	'720p': { width: 1280, height: 720 },
	'1080p': { width: 1920, height: 1080 },
	'4k': { width: 3840, height: 2160 }
};
