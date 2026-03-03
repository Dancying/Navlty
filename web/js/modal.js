// 定义全局 App 命名空间
window.App = window.App || {};

// 模态框管理模块
App.modal = (function() {

    // 初始化所有模态框相关的触发器
    function init() {
        // 绑定所有带 `data-modal-target` 属性的按钮
        document.querySelectorAll('[data-modal-target]').forEach(button => {
            button.addEventListener('click', function() {
                const modalId = this.getAttribute('data-modal-target');
                // 特殊处理：打开设置模态框前需要先加载数据
                if (modalId === 'settings-modal') {
                    App.settings.loadAndShow();
                } else {
                    open(modalId);
                }
            });
        });

        // 遍历每个模态框，绑定关闭事件和内部组件
        document.querySelectorAll('.modal').forEach(modal => {
            // 绑定模态框内的关闭按钮和取消按钮
            modal.querySelectorAll('.close-button, .cancel-button').forEach(button => {
                button.addEventListener('click', () => close(modal.id));
            });

            // 点击模态框背景遮罩层时关闭
            modal.addEventListener('click', (event) => {
                if (event.target === modal) {
                    close(modal.id);
                }
            });

            // 初始化模态框内部的选项卡和滑块
            initTabs(modal);
            initSliders(modal);
        });

         // 监听窗口大小变化，以保持模态框居中
        window.addEventListener('resize', () => {
            document.querySelectorAll('.modal.show').forEach(center);
        });
    }

    // 打开指定的模态框
    function open(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        // 处理滚动条，防止页面在模态框打开时跳动
        const bodyHasScrollbar = document.body.scrollHeight > window.innerHeight;
        if (bodyHasScrollbar) {
            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
            document.body.style.paddingRight = `${scrollbarWidth}px`;
            const header = document.querySelector('.header-background');
            if(header) header.style.paddingRight = `${scrollbarWidth}px`;
        }

        modal.style.display = 'block';
        center(modal);
        setTimeout(() => modal.classList.add('show'), 10);
        document.body.classList.add('modal-open');
    }

    // 关闭指定的模态框
    function close(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        modal.classList.remove('show');

        // 在 CSS 过渡动画结束后再隐藏元素并恢复滚动条
        modal.addEventListener('transitionend', () => {
            modal.style.display = 'none';
            document.body.classList.remove('modal-open');
            document.body.style.paddingRight = '';
            const header = document.querySelector('.header-background');
            if(header) header.style.paddingRight = '';
        }, { once: true });
    }

    // 将模态框在视口中居中
    function center(modal) {
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            const top = (window.innerHeight - modalContent.offsetHeight) / 2;
            const left = (window.innerWidth - modalContent.offsetWidth) / 2;
            modalContent.style.top = `${Math.max(0, top)}px`;
            modalContent.style.left = `${Math.max(0, left)}px`;
        }
    }

    // 初始化模态框内部的选项卡功能
    function initTabs(modal) {
        const tabButtons = modal.querySelectorAll('.tab-button');
        const tabContents = modal.querySelectorAll('.tab-content');
        if (tabButtons.length === 0) return;

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.getAttribute('data-tab');

                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                tabContents.forEach(content => {
                    content.classList.toggle('active', content.id === tabId);
                });
            });
        });
    }

    // 初始化模态框内部的滑块功能
    function initSliders(modal) {
        const sliders = modal.querySelectorAll('.slider');
        sliders.forEach(slider => {
            const valueSpan = document.getElementById(`${slider.id}-value`);
            if (valueSpan) {
                 // 初始化显示滑块的当前值
                valueSpan.textContent = slider.value;
                // 监听输入事件，实时更新数值显示
                slider.addEventListener('input', () => {
                    valueSpan.textContent = slider.value;
                });
            }
        });
    }

    return { init, open, close };
})();
