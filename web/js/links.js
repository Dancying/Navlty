// 定义全局 App 命名空间
window.App = window.App || {};

// 链接处理模块
App.links = (function () {

    // 初始化“添加链接”面板中的事件
    function init(panelElement) {
        if (!panelElement) return;
        
        const uploadButton = panelElement.querySelector('#upload-icon-button');
        const fileInput = panelElement.querySelector('#icon-file-input');
        const targetInput = panelElement.querySelector('#link-icon');

        if (uploadButton && fileInput && targetInput) {
            uploadButton.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', () => App.helpers.fileToBase64(fileInput, targetInput.id));
        }
    }

    // 保存新链接
    function save() {
        const activeTab = document.querySelector('#content-add-link .tab-button.active')?.getAttribute('data-tab');
        if (activeTab === 'single-link-tab') {
            const titleInput = document.getElementById('link-title');
            const urlInput = document.getElementById('link-url');
            let isValid = true;

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

            const panel = document.getElementById('primary-panel').classList.contains('active') ? 'primary' : 'secondary';

            const newLink = {
                title: titleInput.value,
                url: urlInput.value,
                panel: panel,
                category: document.getElementById('link-category').value || 'Uncategorized',
                desc: document.getElementById('link-description').value,
                icon_url: document.getElementById('link-icon').value || 'globe',
            };

            submitLinks([newLink]);
        } else {
             const bulkLinksInput = document.getElementById('bulk-links');
            const lines = bulkLinksInput.value.split('\n').filter(line => line.trim() !== '');
            if (lines.length === 0) {
                bulkLinksInput.classList.add('input-error');
                return;
            }

            const panel = document.getElementById('primary-panel').classList.contains('active') ? 'primary' : 'secondary';
            
            const newLinks = lines.map(line => {
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
    }

    // 将链接数据提交到后端
    function submitLinks(links) {
        App.modal.close();
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

    return { init, save };
})();
