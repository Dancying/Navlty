window.App = window.App || {};

// 页面加载完成后执行初始化
document.addEventListener('DOMContentLoaded', function () {

    // 初始化认证、搜索和消息提示模块
    App.auth.init();
    App.search.init();
    App.toast.init();

    // 为面板切换按钮绑定点击事件
    const togglePanelButton = document.getElementById('toggle-panel-button');
    if (togglePanelButton) {
        togglePanelButton.addEventListener('click', () => {
            document.getElementById('primary-panel')?.classList.toggle('active');
            document.getElementById('secondary-panel')?.classList.toggle('active');
            App.helpers.updateCardOverflow();
        });
    }

    // 为设置按钮绑定点击事件
    const settingsButton = document.getElementById('settings-button');
    if (settingsButton) {
        settingsButton.addEventListener('click', () => {
            if (App.settings && typeof App.settings.loadAndShow === 'function') {
                App.settings.loadAndShow();
            } else {
                App.auth.checkAuthStatus();
            }
        });
    }

    // 绑定全局键盘快捷键
    window.addEventListener('keydown', (event) => {
        // 当按下 ESC 键时，关闭所有激活的模态框和搜索框
        if (event.key === 'Escape') {
            const activeModal = document.querySelector('.modal.show');
            if (activeModal) {
                App.modal.close(activeModal.id);
            }
            if (document.getElementById('search-wrapper')?.classList.contains('active')) {
                App.search.hideSearch();
            }
        }

        // 当焦点不在输入框时，按下 '/' 键以激活搜索框
        if (event.key === '/') {
            const activeElement = document.activeElement.tagName.toLowerCase();
            if (activeElement !== 'input' && activeElement !== 'textarea') {
                event.preventDefault();
                App.search.showSearch();
            }
        }
    });

    // 更新卡片内容的溢出状态
    App.helpers.updateCardOverflow();
});
