// 定义全局 App 命名空间
window.App = window.App || {};

// 链接处理模块
App.links = (function () {

    // 保存单个链接
    async function saveSingle() {
        const titleInput = document.getElementById('link-title');
        const urlInput = document.getElementById('link-url');
        
        // 重置错误状态
        titleInput.classList.remove('input-error');
        urlInput.classList.remove('input-error');

        // 校验
        if (!titleInput.value || !urlInput.value) {
            App.toast.show('标题和链接是必填项', 'error');
            if (!titleInput.value) titleInput.classList.add('input-error');
            if (!urlInput.value) urlInput.classList.add('input-error');
            return;
        }

        const newLink = {
            title: titleInput.value,
            url: urlInput.value,
            category: document.getElementById('link-category').value || '未分类',
            desc: document.getElementById('link-description').value,
            icon_url: document.getElementById('link-icon').value || 'globe',
        };

        await submitLinks([newLink]);
    }

    // 批量保存链接
    async function saveBulk() {
        const bulkLinksInput = document.getElementById('bulk-links');
        const lines = bulkLinksInput.value.split('\n').filter(line => line.trim() !== '');
        
        bulkLinksInput.classList.remove('input-error');
        if (lines.length === 0) {
            bulkLinksInput.classList.add('input-error');
            App.toast.show('请输入至少一个链接', 'error');
            return;
        }
        
        const newLinks = lines.map(line => {
            const [title, url, category, icon_url, desc] = line.split('|').map(part => part.trim());
            if (!title || !url) return null;
            return { 
                title, 
                url, 
                category: category || '未分类', 
                icon_url: icon_url || 'globe', 
                desc: desc || '' 
            };
        }).filter(link => link !== null);

        if (newLinks.length === 0) {
            App.toast.show('没有找到有效格式的链接', 'error');
            return;
        }

        await submitLinks(newLinks);
    }

    // 将链接数据提交到后端
    async function submitLinks(links) {
        try {
            await App.api.request('/api/links/bulk', {
                method: 'POST',
                body: JSON.stringify(links)
            });
            App.toast.show('链接保存成功', 'success');
            App.modal.close();
            // 触发事件，通知主页面链接已更新
            document.dispatchEvent(new CustomEvent('links-updated'));
        } catch (error) {
            App.toast.show(`链接保存失败: ${error.message}`, 'error');
            console.error('Error submitting links:', error);
        }
    }

    // 导出公共方法
    return { saveSingle, saveBulk };
})();
