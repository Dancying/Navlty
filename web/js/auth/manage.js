// 定义全局 App 命名空间
window.App = window.App || {};

// 链接管理模块
App.manage = (function () {

    let initialLinks = [];
    let currentLinks = [];
    let dom = { container: null };
    let openCategories = new Set();
    let linkIdCounter = 0;
    let cachedPanels = null;

    function invalidateCache() {
        cachedPanels = null;
    }

    function handleDrop(event) {
        const { item, target, nextElement } = event.detail;
        const isCategory = item.dataset.dndType === 'category';
        const targetPanel = target.closest('.management-panel')?.dataset.panelName;
        const targetCategoryGroup = target.closest('.management-category-group');
        const targetCategoryName = targetCategoryGroup?.dataset.categoryName;

        let movedItems = [];

        if (isCategory) {
            const categoryName = item.dataset.categoryName;
            movedItems = currentLinks.filter(l => (l.category || 'Uncategorized') === categoryName);
            currentLinks = currentLinks.filter(l => (l.category || 'Uncategorized') !== categoryName);
        } else {
            const linkClientId = item.dataset.linkId;
            const fromIndex = currentLinks.findIndex(l => l.clientId === linkClientId);
            if (fromIndex > -1) {
                movedItems = currentLinks.splice(fromIndex, 1);
            }
        }

        if (movedItems.length === 0) return;

        let toIndex = -1;
        if (nextElement) {
            const nextIsCategory = nextElement.dataset.dndType === 'category';
            if (nextIsCategory) {
                const nextCategoryName = nextElement.dataset.categoryName;
                toIndex = currentLinks.findIndex(l => (l.category || 'Uncategorized') === nextCategoryName);
            } else {
                const nextLinkClientId = nextElement.dataset.linkId;
                toIndex = currentLinks.findIndex(l => l.clientId === nextLinkClientId);
            }
        } else {
            if (isCategory) {
                if (targetPanel) {
                     const lastLinkInPanelIndex = findLastIndex(currentLinks, l => l.panel === targetPanel);
                     toIndex = lastLinkInPanelIndex + 1;
                } else { toIndex = currentLinks.length; }
            } else {
                 if (targetCategoryName) {
                    const lastLinkInCategoryIndex = findLastIndex(currentLinks, l => (l.category || 'Uncategorized') === targetCategoryName);
                    toIndex = lastLinkInCategoryIndex + 1;
                 } else { toIndex = currentLinks.length; }
            }
        }
        
        if (toIndex === -1) toIndex = currentLinks.length;

        movedItems.forEach(movedItem => {
            if (targetPanel) movedItem.panel = targetPanel;
            if (!isCategory && targetCategoryName) {
                movedItem.category = targetCategoryName === 'Uncategorized' ? '' : targetCategoryName;
            }
        });

        currentLinks.splice(toIndex, 0, ...movedItems);
        renderPanels();
    }

    async function loadAndRender(container) {
        dom.container = container;
        if (!dom.container.dataset.dndListenerAttached) {
            dom.container.addEventListener('dnd:drop', handleDrop);
            dom.container.dataset.dndListenerAttached = 'true';
        }

        let panelsToRender = cachedPanels;

        if (!panelsToRender) {
            dom.container.innerHTML = '<div class="loading-spinner"></div>';
            try {
                panelsToRender = await App.api.request('/api/links');
                cachedPanels = JSON.parse(JSON.stringify(panelsToRender));
            } catch (error) {
                if (error.message !== 'Unauthorized') {
                    console.error('Error loading links:', error);
                    App.toast.show('加载链接列表失败，请刷新重试', 'error');
                    dom.container.innerHTML = '<p style="color: red; text-align: center;">加载链接失败。</p>';
                }
                return;
            }
        }

        const flatLinks = [];
        linkIdCounter = 0;
        if (panelsToRender && typeof panelsToRender === 'object') {
            for (const panelName in panelsToRender) {
                const categories = panelsToRender[panelName];
                if (Array.isArray(categories)) {
                    categories.forEach(category => {
                        if (category.links && Array.isArray(category.links)) {
                            category.links.forEach(link => {
                                flatLinks.push({
                                    ...link,
                                    clientId: `client-link-${linkIdCounter++}`,
                                    panel: panelName,
                                    category: category.name || ''
                                });
                            });
                        }
                    });
                }
            }
        }
        currentLinks = flatLinks;
        initialLinks = JSON.parse(JSON.stringify(flatLinks));
        renderPanels();
    }

    function renderPanels() {
        if (!dom.container) return;
        dom.container.innerHTML = '';
        
        const gridContainer = document.createElement('div');
        gridContainer.id = 'link-management-container';
        gridContainer.className = 'link-management-grid';
        dom.container.appendChild(gridContainer);

        const primaryLinks = currentLinks.filter(link => link.panel === 'primary');
        const secondaryLinks = currentLinks.filter(link => link.panel === 'secondary');
        const primaryPanel = createPanel('主面板', 'primary', primaryLinks);
        const secondaryPanel = createPanel('副面板', 'secondary', secondaryLinks);
        
        gridContainer.appendChild(primaryPanel);
        gridContainer.appendChild(secondaryPanel);
        
        feather.replace();
        App.dnd.init(gridContainer);
    }

    function createPanel(title, panelName, links) {
        const panel = document.createElement('div');
        panel.className = 'management-panel';
        panel.dataset.panelName = panelName;
        const panelTitle = document.createElement('h3');
        panelTitle.className = 'management-panel-title';
        panelTitle.textContent = title;
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'management-panel-content-wrapper';
        contentWrapper.dataset.dndTarget = 'category-container';
        panel.appendChild(panelTitle);
        panel.appendChild(contentWrapper);

        const categories = [];
        const categoryMap = new Map();

        links.forEach(link => {
            const categoryName = link.category || 'Uncategorized';
            if (!categoryMap.has(categoryName)) {
                categoryMap.set(categoryName, []);
                categories.push(categoryName);
            }
            categoryMap.get(categoryName).push(link);
        });
        
        categories.sort((a, b) => {
            if (a === 'Uncategorized') return 1;
            if (b === 'Uncategorized') return -1;
            return a.localeCompare(b);
        });

        categories.forEach(categoryName => {
            const categoryLinks = categoryMap.get(categoryName);
            const categoryGroup = createCategory(categoryName, categoryLinks, panelName);
            contentWrapper.appendChild(categoryGroup);
        });

        return panel;
    }

    function createCategory(categoryName, links, panelName) {
        const group = document.createElement('div');
        group.className = 'management-category-group';
        group.dataset.categoryName = categoryName;
        group.dataset.dndType = 'category';
        group.setAttribute('draggable', 'true');

        const header = createCategoryHeader(categoryName, panelName);
        const linkList = createLinkList(links);

        if (openCategories.has(categoryName)) {
            header.classList.add('open');
            setTimeout(() => {
                linkList.style.maxHeight = linkList.scrollHeight + 'px';
            }, 0);
        }

        group.appendChild(header);
        group.appendChild(linkList);
        return group;
    }

    function createCategoryHeader(categoryName, panelName) {
        const header = document.createElement('div');
        header.className = 'management-category-header';

        const titleContainer = document.createElement('div');
        titleContainer.className = 'category-title-container';
        titleContainer.innerHTML = '<i data-feather="chevron-right" class="category-chevron"></i>';

        const title = document.createElement('span');
        title.className = 'management-category-title';
        title.textContent = categoryName;
        titleContainer.appendChild(title);

        titleContainer.addEventListener('click', () => {
            toggleCategory(header, categoryName);
        });

        const actions = document.createElement('div');
        actions.className = 'management-category-actions';

        const editButton = document.createElement('button');
        editButton.title = '修改分类名称';
        editButton.innerHTML = '<i data-feather="edit"></i>';
        editButton.addEventListener('click', (e) => {
            e.stopPropagation();
            if (header.querySelector('.management-category-title')) {
                editCategoryName(header.querySelector('.management-category-title'), categoryName);
            }
        });

        const copyButton = document.createElement('button');
        copyButton.title = '复制分类链接';
        copyButton.innerHTML = '<i data-feather="copy"></i>';
        copyButton.addEventListener('click', (e) => {
            e.stopPropagation();
            const linksToCopy = currentLinks.filter(link => (link.category || 'Uncategorized') === categoryName);
            const formattedLinks = linksToCopy.map(l => {
                return `${l.title}|${l.url}|${l.category || 'Uncategorized'}|${l.icon_url || 'globe'}|${l.desc || ''}`;
            }).join('\n');

            navigator.clipboard.writeText(formattedLinks).then(() => {
                App.toast.show('分类链接已按格式复制', 'success');
            }, () => {
                App.toast.show('复制失败，浏览器可能不支持或未授权', 'error');
            });
        });

        const deleteButton = document.createElement('button');
        deleteButton.title = '删除分类数据';
        deleteButton.innerHTML = '<i data-feather="trash-2"></i>';
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteCategory(categoryName);
        });

        actions.appendChild(editButton);
        actions.appendChild(copyButton);
        actions.appendChild(deleteButton);
        header.appendChild(titleContainer);
        header.appendChild(actions);
        return header;
    }

    function toggleCategory(header, categoryName) {
        const linkList = header.nextElementSibling;
        if (!linkList || !linkList.classList.contains('management-link-list')) return;

        const isOpening = !header.classList.contains('open');
        header.classList.toggle('open', isOpening);

        if (isOpening) {
            openCategories.add(categoryName);
            setTimeout(() => {
                linkList.style.maxHeight = linkList.scrollHeight + 'px';
            }, 0);
        } else {
            openCategories.delete(categoryName);
            linkList.style.maxHeight = '0px';
        }
    }

    function createLinkList(links) {
        const list = document.createElement('ul');
        list.className = 'management-link-list';
        list.style.overflow = 'hidden';
        list.style.maxHeight = '0px';
        list.dataset.dndTarget = 'link-container';

        links.forEach(link => {
            list.appendChild(createLinkItem(link));
        });
        return list;
    }

    function createLinkItem(link) {
        const item = document.createElement('li');
        item.className = 'management-link-item';
        item.dataset.linkId = link.clientId;
        item.dataset.dndType = 'link';
        item.setAttribute('draggable', 'true');

        const title = document.createElement('span');
        title.className = 'management-link-title';
        title.textContent = link.title;

        const actions = document.createElement('div');
        actions.className = 'management-link-actions';

        const editButton = document.createElement('button');
        editButton.title = '编辑链接名称';
        editButton.innerHTML = '<i data-feather="edit"></i>';
        editButton.addEventListener('click', (e) => {
            e.stopPropagation();
            const titleElement = item.querySelector('.management-link-title');
            if (titleElement) {
                editLinkTitle(titleElement, link.clientId);
            }
        });

        const copyButton = document.createElement('button');
        copyButton.title = '复制链接数据';
        copyButton.innerHTML = '<i data-feather="copy"></i>';
        copyButton.addEventListener('click', (e) => {
            e.stopPropagation();
            const formattedLink = `${link.title}|${link.url}|${link.category || 'Uncategorized'}|${link.icon_url || 'globe'}|${link.desc || ''}`;
            navigator.clipboard.writeText(formattedLink).then(() => {
                App.toast.show('链接数据已复制到剪贴板', 'success');
            }, () => {
                App.toast.show('复制失败，浏览器可能不支持或未授权', 'error');
            });
        });

        const deleteButton = document.createElement('button');
        deleteButton.title = '删除链接数据';
        deleteButton.innerHTML = '<i data-feather="x"></i>';
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteLink(link.clientId);
        });

        actions.appendChild(editButton);
        actions.appendChild(copyButton);
        actions.appendChild(deleteButton);
        item.appendChild(title);
        item.appendChild(actions);
        return item;
    }

    function findLastIndex(arr, predicate) {
        for (let i = arr.length - 1; i >= 0; i--) {
            if (predicate(arr[i])) {
                return i;
            }
        }
        return -1;
    }
    
    function editLinkTitle(titleElement, clientId) {
        if (titleElement.querySelector('input')) return;
        const linkToEdit = currentLinks.find(l => l.clientId === clientId);
        if (!linkToEdit) return;
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'management-link-input';
        input.value = linkToEdit.title;
        titleElement.replaceWith(input);
        input.focus();
        const save = () => {
            const newTitle = input.value.trim();
            if (newTitle && newTitle !== linkToEdit.title) {
                linkToEdit.title = newTitle;
            }
            renderPanels();
        };
        input.addEventListener('blur', save);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') input.blur();
            if (e.key === 'Escape') {
                input.value = linkToEdit.title;
                input.blur();
            }
        });
    }

    function editCategoryName(titleElement, oldCategoryName) {
        if (titleElement.querySelector('input')) return;
        const originalName = oldCategoryName;
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'management-category-input';
        input.value = originalName;
        titleElement.replaceWith(input);
        input.focus();
        const save = () => {
            const newCategoryName = input.value.trim();
            if (newCategoryName && newCategoryName !== originalName) {
                if (openCategories.has(originalName)) {
                    openCategories.delete(originalName);
                    openCategories.add(newCategoryName);
                }
                currentLinks.forEach(link => {
                    if ((link.category || 'Uncategorized') === originalName) {
                        link.category = newCategoryName === 'Uncategorized' ? '' : newCategoryName;
                    }
                });
            }
            renderPanels();
        };
        input.addEventListener('blur', save);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') input.blur();
            if (e.key === 'Escape') {
                input.value = originalName;
                input.blur();
            }
        });
    }

    function deleteCategory(categoryName) {
        openCategories.delete(categoryName);
        currentLinks = currentLinks.filter(link => (link.category || 'Uncategorized') !== categoryName);
        renderPanels();
    }

    function deleteLink(clientId) {
        currentLinks = currentLinks.filter(link => link.clientId !== clientId);
        renderPanels();
    }

    async function saveChanges() {
        const actions = [];
        const initialLinksMap = new Map(initialLinks.map(link => [link.id, link]));
        const currentLinksMap = new Map(currentLinks.map(link => [link.id, link]));

        const deletedIds = [];
        for (const id of initialLinksMap.keys()) {
            if (!currentLinksMap.has(id)) {
                deletedIds.push(id);
            }
        }
        if (deletedIds.length > 0) {
            actions.push({
                action: 'DELETE_LINKS',
                payload: { ids: deletedIds }
            });
        }

        const updates = [];
        const moves = new Map();

        for (const link of currentLinks) {
            const initialLink = initialLinksMap.get(link.id);
            if (initialLink) {
                const titleChanged = link.title !== initialLink.title;
                const categoryChanged = (link.category || '') !== (initialLink.category || '');
                const panelChanged = link.panel !== initialLink.panel;

                if (titleChanged) {
                    updates.push({
                        id: link.id,
                        updates: { title: link.title }
                    });
                }
                if (categoryChanged || panelChanged) {
                    const targetKey = `${link.panel}:${link.category || ''}`;
                    if (!moves.has(targetKey)) {
                        moves.set(targetKey, {
                            target: { panel: link.panel, category: link.category || '' },
                            ids: []
                        });
                    }
                    moves.get(targetKey).ids.push(link.id);
                }
            }
        }

        if (updates.length > 0) {
            actions.push({
                action: 'UPDATE_LINKS',
                payload: updates
            });
        }

        for (const move of moves.values()) {
            actions.push({
                action: 'MOVE_LINKS',
                payload: move
            });
        }

        if (actions.length === 0) {
            App.modal.close();
            return;
        }

        try {
            await App.api.request('/api/links/actions', {
                method: 'POST',
                body: JSON.stringify(actions),
            });
            invalidateCache();
            App.toast.show('链接更改已成功保存', 'success');
            document.dispatchEvent(new CustomEvent('links-updated'));
            App.modal.close();
        } catch (error) {
            if (error.message !== 'Unauthorized') {
                console.error('Error saving changes:', error);
                App.toast.show('链接更改保存失败，请刷新后重试', 'error');
            }
        }
    }

    document.addEventListener('links-updated', invalidateCache);

    return {
        loadAndRender,
        saveChanges,
        invalidateCache
    };
})();
