import { HARDCODED_CONFIG } from './config.js';

/**
 * アプリ全体で共有する可変状態。
 * @typedef {Object} AppState
 * @property {{quality:'480p'|'720p'|'1080p'|'4k', facingMode:'user'|'environment'}} activeConfig
 * @property {MediaStream | null} stream
 * @property {'user'|'environment'} currentFacingMode
 * @property {boolean} isSelecting
 * @property {number} startX
 * @property {number} startY
 * @property {number} zoomScale
 * @property {number} panX
 * @property {number} panY
 * @property {boolean} isPinching
 * @property {number} initialPinchDist
 * @property {number} initialZoomAtPinch
 */

/** @type {AppState} */
export const state = {
	activeConfig: { ...HARDCODED_CONFIG },
	stream: null,
	currentFacingMode: HARDCODED_CONFIG.facingMode,
	isSelecting: false,
	startX: 0,
	startY: 0,
	zoomScale: 1,
	panX: 0,
	panY: 0,
	isPinching: false,
	initialPinchDist: 0,
	initialZoomAtPinch: 1
};
