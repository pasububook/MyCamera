/**
 * scriptエントリーポイント。
 * main モジュールを読み込んでアプリを起動する。
 */
import './main.js';

if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		navigator.serviceWorker.register('./script/sw.js').catch((error) => {
			console.error('Service Worker registration failed:', error);
		});
	});
}
