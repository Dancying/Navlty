window.App = window.App || {};

App.toast = (function () {
    let toastContainer;
    const VISIBLE_DURATION = 3000, ANIMATION_DURATION = 400;

    // init 初始化 Toast 通知模块的容器
    function init() {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    // show 创建并显示一个 Toast 通知
    function show(message, type = 'success') {
        if (!toastContainer) return;
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        const iconSVG = feather.icons[type === 'success' ? 'check-circle' : 'alert-circle']?.toSvg({ width: '22px', height: '22px' }) ?? '';
        toast.innerHTML = `<div class="toast-icon">${iconSVG}</div><span>${message}</span>`;
        toastContainer.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('show'));
        setTimeout(() => toast.classList.remove('show'), VISIBLE_DURATION);
        setTimeout(() => toast.remove(), VISIBLE_DURATION + ANIMATION_DURATION);
    }

    return { init, show };
})();