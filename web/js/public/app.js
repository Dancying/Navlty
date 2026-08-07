window.App = window.App || {};

// init 页面加载完成后执行初始化
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

    // 全局键盘快捷键处理
    const keyActions = {
        'Escape': () => {
            const activeModal = document.querySelector('.modal.show');
            activeModal && App.modal.close(activeModal.id);
            document.getElementById('search-wrapper')?.classList.contains('active') && App.search.hideSearch();
        },
        '/': () => App.search.showSearch(),
        't': () => document.getElementById('toggle-panel-button')?.click(),
        's': () => document.getElementById('settings-button')?.click()
    };

    window.addEventListener('keydown', (event) => {
        const action = keyActions[event.key];
        if (!action) return;
        if (event.key !== 'Escape') {
            const tag = document.activeElement.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA') return;
            event.preventDefault();
        }
        action();
    });

    // 更新卡片内容的溢出状态
    App.helpers.updateCardOverflow();
});