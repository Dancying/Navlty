// 定义全局 App 命名空间
window.App = window.App || {};

// 链接处理模块
App.links = (function () {

    // 获取当前激活的面板的名称
    function getActivePanel() {
        const primaryPanel = document.getElementById('primary-panel');
        if (primaryPanel && primaryPanel.classList.contains('active')) {
            return 'primary';
        }
        return 'secondary';
    }

    // 保存单个链接。若表单为空则关闭面板；若校验失败则显示错误且不关闭；若成功则关闭。
    async function saveSingle() {
        const titleInput = document.getElementById('link-title');
        const urlInput = document.getElementById('link-url');
        const categoryInput = document.getElementById('link-category');
        const descInput = document.getElementById('link-description');
        const iconInput = document.getElementById('link-icon');

        if (!titleInput.value && !urlInput.value && !categoryInput.value && !descInput.value && !iconInput.value) {
            App.modal.close();
            return;
        }

        titleInput.classList.remove('input-error');
        urlInput.classList.remove('input-error');

        if (!titleInput.value || !urlInput.value) {
            App.toast.show('标题和链接是必填项', 'error');
            if (!titleInput.value) titleInput.classList.add('input-error');
            if (!urlInput.value) urlInput.classList.add('input-error');
            return;
        }

        const newLink = {
            title: titleInput.value,
            url: urlInput.value,
            category: categoryInput.value || 'Uncategorized',
            desc: descInput.value,
            icon_url: iconInput.value || 'globe',
        };

        if (await submitLinks([newLink])) {
            App.modal.close();
        }
    }

    // 批量保存链接。若表单为空则关闭面板；若格式无效则显示错误且不关闭；若成功则关闭。
    async function saveBulk() {
        const bulkLinksInput = document.getElementById('bulk-links');
        const bulkContent = bulkLinksInput.value.trim();

        if (!bulkContent) {
            App.modal.close();
            return;
        }
        
        const lines = bulkContent.split('\n').filter(line => line.trim() !== '');
        bulkLinksInput.classList.remove('input-error');

        if (lines.length === 0) {
            App.modal.close();
            return;
        }
        
        const newLinks = lines.map(line => {
            const [title, url, category, icon_url, desc] = line.split('|').map(part => part.trim());
            if (!title || !url) return null;
            return { 
                title, 
                url, 
                category: category || 'Uncategorized', 
                icon_url: icon_url || 'globe', 
                desc: desc || '' 
            };
        }).filter(link => link !== null);

        if (newLinks.length === 0) {
            App.toast.show('没有找到有效格式的链接', 'error');
            return;
        }

        if (await submitLinks(newLinks)) {
            App.modal.close();
        }
    }

    // 将链接数据提交到后端 API，成功时返回 true，失败时返回 false。
    async function submitLinks(links) {
        const linksByCategory = links.reduce((acc, link) => {
            const category = link.category || 'Uncategorized';
            if (!acc[category]) {
                acc[category] = [];
            }
            const { category: _, ...linkData } = link;
            acc[category].push(linkData);
            return acc;
        }, {});

        const panel = getActivePanel();
        const actions = Object.entries(linksByCategory).map(([category, categoryLinks]) => {
            return {
                action: 'CREATE_LINKS',
                payload: {
                    panel: panel,
                    category: category,
                    links: categoryLinks
                }
            };
        });

        try {
            await App.api.request('/api/links/batch', {
                method: 'POST',
                body: JSON.stringify(actions)
            });
            App.toast.show('链接保存成功', 'success');
            document.dispatchEvent(new CustomEvent('links-updated'));
            return true;
        } catch (error) {
            App.toast.show(`链接保存失败: ${error.message}`, 'error');
            console.error('Error submitting links:', error);
            return false;
        }
    }
    
    // 导出公共方法
    return { saveSingle, saveBulk };
})();
