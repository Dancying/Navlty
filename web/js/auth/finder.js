window.App = window.App || {};

App.finder = (function() {
    let linksForEditing = [];
    let currentEditingLinkId = null;

    // loadLinksForEditing 为编辑链接面板加载并扁平化链接列表
    async function loadLinksForEditing() {
        toggleEditForm(false);
        document.getElementById('edit-link-search-input').value = '';
        linksForEditing = [];

        try {
            const panelsToRender = await App.cache.fetchLinks();
            const flatLinks = [];

            if (panelsToRender && typeof panelsToRender === 'object') {
                for (const panelName in panelsToRender) {
                    const categories = panelsToRender[panelName];
                    if (Array.isArray(categories)) {
                        categories.forEach(category => {
                            if (category.links && Array.isArray(category.links)) {
                                category.links.forEach(link => {
                                    flatLinks.push({
                                        id: link.id,
                                        title: link.title || '',
                                        url: link.url || '',
                                        panel: panelName,
                                        category: category.name || '',
                                        icon: link.icon_url || '',
                                        description: link.desc || ''
                                    });
                                });
                            }
                        });
                    }
                }
            }
            
            flatLinks.sort((a, b) => a.title.localeCompare(b.title));
            linksForEditing = flatLinks;

        } catch (error) {
            if (error.message !== 'Unauthorized') {
                console.error('Error loading links for editing:', error);
                App.toast.show('链接加载失败', 'error');
            }
        }
    }

    // renderLinkItem 渲染单个链接项的 HTML
    function renderLinkItem(link) {
        const categoryText = link.category || '未分类';
        const panelKey = (link.panel || '').toLowerCase();
        let panelHTML = '';
    
        if (panelKey === 'primary') {
            panelHTML = `<span class="item-panel-badge primary">主面板</span>`;
        } else if (panelKey === 'secondary') {
            panelHTML = `<span class="item-panel-badge secondary">副面板</span>`;
        }
    
        return `
            <div class="search-result-item" data-id="${link.id}">
                <div class="top-row">
                    <span class="title" title="${App.helpers.escapeHTML(link.title)}">${App.helpers.escapeHTML(link.title)}</span>
                    <div class="badges-container">
                        <span class="item-category-badge">${App.helpers.escapeHTML(categoryText)}</span>
                        ${panelHTML}
                    </div>
                </div>
                <div class="bottom-row">
                    <span class="url" title="${App.helpers.escapeHTML(link.url)}">${App.helpers.escapeHTML(link.url)}</span>
                </div>
            </div>
        `;
    }

    // getLinksForEditing 返回已加载用于编辑的链接数组
    function getLinksForEditing() {
        return linksForEditing;
    }

    // handleLinkSelectionChange 在用户从搜索结果中选择链接后填充表单
    function handleLinkSelectionChange(selectedId) {
        currentEditingLinkId = null;
        const link = linksForEditing.find(l => l.id === selectedId);
        if (link) {
            currentEditingLinkId = selectedId;
            document.getElementById('edit-link-search-input').value = link.title;
    
            App.helpers.setFormValue('edit-link-title', link.title);
            App.helpers.setFormValue('edit-link-url', link.url);
            App.helpers.setFormValue('edit-link-category', link.category || '');
            App.helpers.setFormValue('edit-link-icon', link.icon);
            App.helpers.setFormValue('edit-link-description', link.description);
            App.helpers.setFormValue('edit-link-target-panel', link.panel);

            toggleEditForm(true);
        } else {
            toggleEditForm(false);
        }
    }

    // toggleEditForm 切换编辑表单的禁用状态
    function toggleEditForm(isEnabled) {
        const form = document.getElementById('edit-link-form');
        if (!form) return;

        const elements = form.querySelectorAll('input, textarea, button');
        elements.forEach(el => {
            if (el.id !== 'edit-link-search-input') {
                el.disabled = !isEnabled;
            }
        });

        if (!isEnabled) {
            currentEditingLinkId = null;
            const fieldsToReset = ['edit-link-title', 'edit-link-url', 'edit-link-category', 'edit-link-icon', 'edit-link-description', 'edit-link-target-panel'];
            fieldsToReset.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });
        }
    }

    // getLinkById 通过 ID 从缓存的链接列表中获取链接
    function getLinkById(id) {
        return linksForEditing.find(link => link.id === id) || null;
    }

    // getCurrentEditingLinkId 返回当前正在编辑的链接 ID
    function getCurrentEditingLinkId() {
        return currentEditingLinkId;
    }

    return {
        loadLinksForEditing,
        getLinksForEditing,
        renderLinkItem,
        handleLinkSelectionChange,
        getCurrentEditingLinkId,
        getLinkById
    };
})();
