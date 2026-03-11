window.App = window.App || {};

// 页面加载完成后执行初始化
document.addEventListener('DOMContentLoaded', () => {
    App.auth.init();
    App.search.init();
    App.toast.init();

    // 为面板切换按钮绑定点击事件
    document.getElementById('toggle-panel-button')?.addEventListener('click', () => {
        document.getElementById('primary-panel')?.classList.toggle('active');
        document.getElementById('secondary-panel')?.classList.toggle('active');
        App.helpers.updateCardOverflow();
    });

    // 为设置按钮绑定点击事件
    document.getElementById('settings-button')?.addEventListener('click', () => {
        (App.settings?.loadAndShow || App.auth.checkAuthStatus)();
    });

    // 定义键盘快捷键操作
    const keydownActions = {
        'Escape': () => {
            const activeModal = document.querySelector('.modal.show');
            activeModal && App.modal.close(activeModal.id);
            document.getElementById('search-wrapper')?.classList.contains('active') && App.search.hideSearch();
        },
        '/': (event) => {
            const tag = document.activeElement.tagName;
            if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
                event.preventDefault();
                App.search.showSearch();
            }
        }
    };

    // 绑定全局键盘快捷键
    window.addEventListener('keydown', (event) => {
        keydownActions[event.key]?.(event);
    });

    // 更新卡片内容的溢出状态
    App.helpers.updateCardOverflow();
});
