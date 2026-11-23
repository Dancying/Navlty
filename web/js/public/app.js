window.App = window.App || {};

document.addEventListener('DOMContentLoaded', () => {
    App.auth.init();
    App.search.init();
    App.toast.init();

    // 绑定面板切换按钮点击事件
    document.getElementById('toggle-panel-button')?.addEventListener('click', () => {
        document.getElementById('primary-panel')?.classList.toggle('active');
        document.getElementById('secondary-panel')?.classList.toggle('active');
    });

    // 绑定设置按钮点击事件
    document.getElementById('settings-button')?.addEventListener('click', () => {
        if (App.settings?.loadAndShow) {
            App.settings.loadAndShow();
        } else {
            App.auth.invalidateSession();
            App.auth.checkAuthStatus();
        }
    });

    // 注册全局键盘快捷键
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

    // 卡片文本溢出检测，防抖观察卡片尺寸变化，字体加载后重新检测
    const debouncedCardOverflow = App.helpers.debounce(App.helpers.updateCardOverflow, 150);
    const cardOverflowObserver = new ResizeObserver(debouncedCardOverflow);
    document.querySelectorAll('.card').forEach(card => cardOverflowObserver.observe(card));
    document.fonts?.ready.then(debouncedCardOverflow);
});