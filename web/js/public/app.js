// 定义全局 App 命名空间
window.App = window.App || {};

// DOM 加载完成后执行
document.addEventListener('DOMContentLoaded', function () {

    App.auth.init();
    App.search.init();
    App.toast.init();

    // 主副面板切换
    const togglePanelButton = document.getElementById('toggle-panel-button');
    if (togglePanelButton) {
        togglePanelButton.addEventListener('click', () => {
            document.getElementById('primary-panel')?.classList.toggle('active');
            document.getElementById('secondary-panel')?.classList.toggle('active');
            App.helpers.updateCardOverflow();
        });
    }

    // 设置按钮点击事件
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

    // 全局键盘快捷键
    window.addEventListener('keydown', (event) => {
        // ESC 键关闭所有激活的模态框和搜索框
        if (event.key === 'Escape') {
            if (document.querySelector('.modal.show')) {
                App.modal.close();
            }
            if (document.getElementById('search-wrapper')?.classList.contains('active')) {
                App.search.hideSearch();
            }
        }

        // '/' 键激活搜索框 (当焦点不在输入框时)
        if (event.key === '/') {
            const activeElement = document.activeElement.tagName.toLowerCase();
            if (activeElement !== 'input' && activeElement !== 'textarea') {
                event.preventDefault();
                App.search.showSearch();
            }
        }
    });

    // 检查卡片标题、描述是否溢出
    App.helpers.updateCardOverflow();
});
