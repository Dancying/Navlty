// 定义全局 App 命名空间
window.App = window.App || {};

// Toast 通知模块
App.toast = (function() {
    let toastContainer;

    // 创建并向 body 添加一个 toast 容器
    function init() {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    /**
     * 显示一个 Toast 通知
     * @param {string} message - 要显示的消息
     * @param {string} [type='success'] - Toast 类型 ('success' 或 'error')
     */
    function show(message, type = 'success') {
        if (!toastContainer) {
            console.error('Toast 模块未初始化. 请先调用 App.toast.init().');
            return;
        }

        // 创建 toast 元素
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        toastContainer.appendChild(toast);

        // 动画：淡入
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        // 动画：3秒后淡出并移除
        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => toast.remove());
        }, 3000);
    }

    // 暴露公共方法
    return {
        init,
        show
    };
})();
