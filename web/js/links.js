// 定义全局 App 命名空间
window.App = window.App || {};

// 链接处理模块
App.links = (function () {

    // 初始化链接相关的事件绑定
    function init() {
        const addLinkModal = document.getElementById('addLinkModal');
        if (addLinkModal) {
            document.getElementById('save-link-button')?.addEventListener('click', handleSave);
            const uploadIconButton = document.getElementById('upload-icon-button');
            const iconFileInput = document.getElementById('icon-file-input');
            if (uploadIconButton && iconFileInput) {
                uploadIconButton.addEventListener('click', () => iconFileInput.click());
                iconFileInput.addEventListener('change', () => App.helpers.fileToBase64(iconFileInput, 'link-icon'));
            }
        }
    }

    // 根据当前激活的选项卡，调用不同的处理函数
    function handleSave() {
        const activeTab = document.querySelector('#addLinkModal .tab-button.active')?.getAttribute('data-tab');
        if (activeTab === 'single-link-tab') {
            handleSingleLink();
        } else {
            handleBulkLinks();
        }
    }

    // 处理单个链接的添加
    function handleSingleLink() {
        const titleInput = document.getElementById('link-title');
        const urlInput = document.getElementById('link-url');
        let isValid = true;

        // 简单的输入验证
        titleInput.classList.remove('input-error');
        if (!titleInput.value) {
            titleInput.classList.add('input-error');
            isValid = false;
        }
        urlInput.classList.remove('input-error');
        if (!urlInput.value) {
            urlInput.classList.add('input-error');
            isValid = false;
        }
        if (!isValid) return;

        // 确定链接要添加到的面板
        const panel = document.getElementById('primary-panel').classList.contains('active') ? 'primary' : 'secondary';

        // 构建链接对象
        const newLink = {
            title: titleInput.value,
            url: urlInput.value,
            panel: panel,
            category: document.getElementById('link-category').value || 'Uncategorized',
            desc: document.getElementById('link-description').value,
            icon_url: document.getElementById('link-icon').value || 'globe',
        };

        submitLinks([newLink]);
    }

    // 处理批量链接的添加
    function handleBulkLinks() {
        const bulkLinksInput = document.getElementById('bulk-links');
        const lines = bulkLinksInput.value.split('\n').filter(line => line.trim() !== '');
        if (lines.length === 0) {
            bulkLinksInput.classList.add('input-error');
            return;
        }

        const panel = document.getElementById('primary-panel').classList.contains('active') ? 'primary' : 'secondary';

        // 解析每一行文本为链接对象
        const newLinks = lines.map(line => {
            // 格式: 标题|链接|分类|图标|描述
            const [title, url, category, icon, description] = line.split('|').map(part => part.trim());
            if (!title || !url) return null;
            return { title, url, panel, category: category || 'Uncategorized', icon_url: icon || 'globe', desc: description };
        }).filter(link => link !== null);

        if (newLinks.length === 0) {
            App.toast.show('链接格式无效', 'error');
            return;
        }

        submitLinks(newLinks);
    }

    // 将链接数据提交到后端
    function submitLinks(links) {
        App.modal.close('addLinkModal');
        fetch('/api/links/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(links)
        })
            .then(response => {
                if (!response.ok) throw new Error('服务器响应错误');
                App.toast.show('链接保存成功', 'success');
            })
            .catch(error => {
                App.toast.show('链接保存失败', 'error');
                console.error('Error:', error);
            });
    }

    return { init };
})();
