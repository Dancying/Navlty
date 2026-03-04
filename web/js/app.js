// 定义全局 App 命名空间
window.App = window.App || {};

// DOM 加载完成后执行
document.addEventListener('DOMContentLoaded', function () {

    // 初始化所有功能模块
    App.search.init();
    App.settings.init();
    App.auth.init();
    App.modal.init();
    App.links.init();
    App.toast.init();

    // 主副面板切换
    const togglePanelButton = document.getElementById('toggle-panel-button');
    if (togglePanelButton) {
        togglePanelButton.addEventListener('click', () => {
            document.getElementById('primary-panel')?.classList.toggle('active');
            document.getElementById('secondary-panel')?.classList.toggle('active');
        });
    }

    // 设置按钮点击后检查授权状态
    const settingsButton = document.getElementById('settings-button');
    if (settingsButton) {
        settingsButton.addEventListener('click', () => {
            App.settings.loadAndShow();
        });
    }

    // 全局键盘快捷键
    window.addEventListener('keydown', (event) => {
        // ESC 键关闭所有激活的模态框和搜索框
        if (event.key === 'Escape') {
            App.modal.remove();
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

    // 检查卡片描述是否溢出
    App.helpers.checkDescriptionOverflow();
});
