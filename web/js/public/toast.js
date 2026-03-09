// 定义全局 App 命名空间
window.App = window.App || {};

// Toast 通知模块
App.toast = (function () {
    let toastContainer;

    // 创建并向 body 添加一个 toast 容器
    function init() {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    // 显示一个 Toast 通知
    function show(message, type = 'success') {
        if (!toastContainer) {
            console.error('Toast 模块未初始化. 请先调用 App.toast.init().');
            return;
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icon = type === 'success' ? 'check-circle' : 'alert-circle';

        toast.innerHTML = `
            <i class="toast-icon" data-feather="${icon}"></i>
            <span>${message}</span>
        `;

        toastContainer.appendChild(toast);

        feather.replace({
            width: '22px',
            height: '22px'
        });

        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => toast.remove());
        }, 3000);
    }

    return {
        init,
        show
    };
})();
