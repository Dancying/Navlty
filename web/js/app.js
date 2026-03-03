// 定义全局 App 命名空间
window.App = window.App || {};

// DOM 加载完成后执行
document.addEventListener('DOMContentLoaded', function() {

    // 初始化所有功能模块
    App.toast.init();
    App.modal.init();
    App.search.init();
    App.links.init();
    App.settings.init();
    App.manage.init();

    // --- 全局事件监听 ---

    // 主副面板切换
    const togglePanelButton = document.getElementById('toggle-panel-button');
    if (togglePanelButton) {
        togglePanelButton.addEventListener('click', () => {
            document.getElementById('primary-panel')?.classList.toggle('active');
            document.getElementById('secondary-panel')?.classList.toggle('active');
        });
    }

    // 全局键盘快捷键
    window.addEventListener('keydown', (event) => {
        // ESC 键关闭所有激活的模态框和搜索框
        if (event.key === 'Escape') {
            document.querySelectorAll('.modal.show').forEach(modal => App.modal.close(modal.id));
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

    // --- 应用初始化加载 ---
    App.settings.initialLoad()
        .then(() => {
            // 数据加载并应用设置后，检查卡片描述是否溢出
            App.helpers.checkDescriptionOverflow();
        })
        .catch(error => {
            console.error("Failed to initialize app settings:", error);
            App.toast.show('页面加载失败', 'error');
        });
});
