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
    });

    // 为设置按钮绑定点击事件
    document.getElementById('settings-button')?.addEventListener('click', () => {
        if (App.settings?.loadAndShow) {
            App.settings.loadAndShow();
        } else {
            App.auth.invalidateSession();
            App.auth.checkAuthStatus();
        }
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

    // 观察卡片尺寸变化并防抖重新检测溢出状态
    const overflowObserver = new ResizeObserver(App.helpers.scheduleUpdateCardOverflow);
    document.querySelectorAll('.card').forEach(card => overflowObserver.observe(card));

    // 字体加载完成后重新检测卡片溢出状态
    document.fonts?.ready.then(App.helpers.scheduleUpdateCardOverflow);
});