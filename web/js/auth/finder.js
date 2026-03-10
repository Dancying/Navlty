window.App = window.App || {};

App.finder = (function() {
    let linksForEditing = [];

    // invalidateLinksCache 使编辑链接的缓存失效
    function invalidateLinksCache() {
        linksForEditing = [];
    }

    // loadLinksForEditing 为编辑链接面板加载并扁平化链接列表
    async function loadLinksForEditing() {
        const searchInput = document.getElementById('edit-link-search-input');
        const resultsContainer = document.getElementById('edit-link-search-results');
        if (!searchInput || !resultsContainer) return;

        toggleEditForm(false);
        searchInput.value = '';

        if (linksForEditing.length > 0) {
            filterAndPopulateResults();
            return;
        }

        resultsContainer.innerHTML = '<div class="search-result-item">正在加载...</div>';

        try {
            const panelsToRender = await App.api.request('/api/links');
            const flatLinks = [];

            if (panelsToRender && typeof panelsToRender === 'object' && !Array.isArray(panelsToRender)) {
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
            filterAndPopulateResults();

        } catch (error) {
            if (error.message !== 'Unauthorized') {
                console.error('Error loading links for editing:', error);
                resultsContainer.innerHTML = '<div class="search-result-item">加载失败</div>';
                App.toast.show('加载链接列表失败', 'error');
            }
        }
    }
    
    // filterAndPopulateResults 筛选并填充链接搜索结果
    function filterAndPopulateResults() {
        const searchTerm = document.getElementById('edit-link-search-input').value.toLowerCase();
        const resultsContainer = document.getElementById('edit-link-search-results');
        
        const filteredLinks = linksForEditing.filter(link => {
            return (link.title.toLowerCase().includes(searchTerm) ||
                    link.url.toLowerCase().includes(searchTerm) ||
                    link.category.toLowerCase().includes(searchTerm));
        });

        resultsContainer.innerHTML = '';
        if (filteredLinks.length > 0) {
            filteredLinks.forEach(link => {
                const item = document.createElement('div');
                item.className = 'search-result-item';
                item.dataset.id = link.id;

                const panelKey = (link.panel || '').toLowerCase();
                const categoryText = link.category || '未分类';
                let panelHTML = '';

                if (panelKey === 'primary') {
                    panelHTML = `<span class="panel primary">主面板</span>`;
                } else if (panelKey === 'secondary') {
                    panelHTML = `<span class="panel secondary">副面板</span>`;
                }

                item.innerHTML = `
                    <div class="top-row">
                        <span class="title" title="${App.helpers.escapeHTML(link.title)}">${App.helpers.escapeHTML(link.title)}</span>
                        <span class="url" title="${App.helpers.escapeHTML(link.url)}">${App.helpers.escapeHTML(link.url)}</span>
                    </div>
                    <div class="bottom-row">
                        ${panelHTML}
                        ${panelHTML ? '<span class="separator">-</span>' : ''}
                        <span class="category">${App.helpers.escapeHTML(categoryText)}</span>
                    </div>
                `;
                resultsContainer.appendChild(item);
            });
        } else {
            resultsContainer.innerHTML = '<div class="search-result-item">无匹配结果</div>';
        }
    }

    // handleLinkSelectionChange 在用户从搜索结果中选择链接后填充表单
    function handleLinkSelectionChange(selectedId) {
        const link = linksForEditing.find(l => l.id === selectedId);
        if (link) {
            document.getElementById('edit-link-search-input').value = link.title;

            App.helpers.setFormValue('edit-link-title', link.title);
            App.helpers.setFormValue('edit-link-url', link.url);
            App.helpers.setFormValue('edit-link-category', link.category);
            App.helpers.setFormValue('edit-link-icon', link.icon);
            App.helpers.setFormValue('edit-link-description', link.description);
            
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
            const fieldsToReset = ['edit-link-title', 'edit-link-url', 'edit-link-category', 'edit-link-icon', 'edit-link-description'];
            fieldsToReset.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });
        }
    }

    document.addEventListener('links-updated', invalidateLinksCache);

    return {
        loadLinksForEditing,
        filterAndPopulateResults,
        handleLinkSelectionChange
    };
})();
