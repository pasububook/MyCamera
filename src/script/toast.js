import { dom } from './dom.js';

/**
 * 下部にトースト通知を表示する。
 * @param {string} message 表示メッセージ
 * @param {boolean} [isError=false] true の場合はエラー表示
 * @returns {void}
 */
export function showToast(message, isError = false) {
	dom.toast.textContent = message;
	dom.toast.className = `toast${isError ? ' error' : ''} show`;
	setTimeout(() => {
		dom.toast.classList.remove('show');
	}, 3000);
}
