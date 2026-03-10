window.App = window.App || {};

App.editor = (function() {
    let initialLinks = [];
    let currentLinks = [];
    let dom = { container: null };
    let openCategories = new Set();
    let linkIdCounter = 0;
    let cachedPanels = null;

    // invalidateCache 使缓存的面板数据失效
    function invalidateCache() {
        cachedPanels = null;
    }

    // getLinkData 返回初始和当前的链接数据
    function getLinkData() {
        return { initialLinks, currentLinks };
    }

    // handleDrop 处理拖放操作
    function handleDrop(event) {
        const { item, target, nextElement } = event.detail;
        const isCategory = item.dataset.dndType === 'category';
        const targetPanel = target.closest('.management-panel')?.dataset.panelName;
        const targetCategoryGroup = target.closest('.management-category-group');
        const targetCategoryName = targetCategoryGroup?.dataset.categoryName;

        let movedItems = [];

        if (isCategory) {
            const categoryName = item.dataset.categoryName;
            const sourcePanelName = item.closest('.management-panel').dataset.panelName;
            movedItems = currentLinks.filter(l => l.panel === sourcePanelName && (l.category || 'Uncategorized') === categoryName);
            currentLinks = currentLinks.filter(l => !(l.panel === sourcePanelName && (l.category || 'Uncategorized') === categoryName));
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
                const nextPanelName = nextElement.closest('.management-panel').dataset.panelName;
                toIndex = currentLinks.findIndex(l => l.panel === nextPanelName && (l.category || 'Uncategorized') === nextCategoryName);
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
                    const lastLinkInCategoryIndex = findLastIndex(currentLinks, l => (l.category || 'Uncategorized') === targetCategoryName && l.panel === targetPanel);
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

    // loadAndRender 加载链接数据并渲染管理界面
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

    // renderPanels 重新渲染所有面板
    function renderPanels() {
        if (!dom.container) return;
        dom.container.innerHTML = '';
        
        const gridContainer = document.createElement('div');
        gridContainer.id = 'category-management-container';
        gridContainer.className = 'category-management-grid';
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

    // createPanel 创建一个面板（主面板或副面板）
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

        categories.forEach(categoryName => {
            const categoryLinks = categoryMap.get(categoryName);
            const categoryGroup = createCategory(categoryName, categoryLinks, panelName);
            contentWrapper.appendChild(categoryGroup);
        });

        return panel;
    }

    // createCategory 创建一个分类组
    function createCategory(categoryName, links, panelName) {
        const group = document.createElement('div');
        group.className = 'management-category-group';
        group.dataset.categoryName = categoryName;
        group.dataset.dndType = 'category';
        group.setAttribute('draggable', 'true');

        const header = createCategoryHeader(categoryName, panelName);
        const linkList = createLinkList(links);

        const categoryKey = `${panelName}-${categoryName}`;
        if (openCategories.has(categoryKey)) {
            header.classList.add('open');
            setTimeout(() => {
                linkList.style.maxHeight = linkList.scrollHeight + 'px';
            }, 0);
        }

        group.appendChild(header);
        group.appendChild(linkList);
        return group;
    }

    // createCategoryHeader 创建分类的头部，包含标题和操作按钮
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

        const categoryKey = `${panelName}-${categoryName}`;
        titleContainer.addEventListener('click', () => {
            toggleCategory(header, categoryKey);
        });

        const actions = document.createElement('div');
        actions.className = 'management-category-actions';

        const editButton = document.createElement('button');
        editButton.title = '修改分类名称';
        editButton.innerHTML = '<i data-feather="edit"></i>';
        editButton.addEventListener('click', (e) => {
            e.stopPropagation();
            if (header.querySelector('.management-category-title')) {
                editCategoryName(header.querySelector('.management-category-title'), categoryName, panelName);
            }
        });

        const copyButton = document.createElement('button');
        copyButton.title = '复制分类链接';
        copyButton.innerHTML = '<i data-feather="copy"></i>';
        copyButton.addEventListener('click', (e) => {
            e.stopPropagation();
            const linksToCopy = currentLinks.filter(link => link.panel === panelName && (link.category || 'Uncategorized') === categoryName);
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
            deleteCategory(categoryName, panelName);
        });

        actions.appendChild(editButton);
        actions.appendChild(copyButton);
        actions.appendChild(deleteButton);
        header.appendChild(titleContainer);
        header.appendChild(actions);
        return header;
    }

    // toggleCategory 切换分类的展开/折叠状态
    function toggleCategory(header, categoryKey) {
        const linkList = header.nextElementSibling;
        if (!linkList || !linkList.classList.contains('management-link-list')) return;

        const isOpening = !header.classList.contains('open');
        header.classList.toggle('open', isOpening);

        if (isOpening) {
            openCategories.add(categoryKey);
            setTimeout(() => {
                linkList.style.maxHeight = linkList.scrollHeight + 'px';
            }, 0);
        } else {
            openCategories.delete(categoryKey);
            linkList.style.maxHeight = '0px';
        }
    }

    // createLinkList 创建包含链接项的列表
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

    // createLinkItem 创建单个链接项
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

        const editTitleButton = document.createElement('button');
        editTitleButton.title = '编辑链接名称';
        editTitleButton.innerHTML = '<i data-feather="edit"></i>';
        editTitleButton.addEventListener('click', (e) => {
            e.stopPropagation();
            const titleElement = item.querySelector('.management-link-title');
            if (titleElement) {
                editLinkTitle(titleElement, link.clientId);
            }
        });

        const fullEditButton = document.createElement('button');
        fullEditButton.title = '完整编辑链接';
        fullEditButton.innerHTML = '<i data-feather="edit-2"></i>';
        fullEditButton.addEventListener('click', (e) => {
            e.stopPropagation();
            showFullEditForm(item);
        });

        const copyButton = document.createElement('button');
        copyButton.title = '复制链接数据';
        copyButton.innerHTML = '<i data-feather="copy"></i>';
        copyButton.addEventListener('click', (e) => {
            e.stopPropagation();
            const formattedLink = `${link.title}|${link.url}|${link.category || 'Uncategorized'}|${link.icon_url || 'globe'}|${l.desc || ''}`;
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

        actions.appendChild(editTitleButton);
        actions.appendChild(fullEditButton);
        actions.appendChild(copyButton);
        actions.appendChild(deleteButton);
        item.appendChild(title);
        item.appendChild(actions);
        return item;
    }

    // showFullEditForm 显示完整的编辑表单
    function showFullEditForm(originalItem) {
        const clientId = originalItem.dataset.linkId;
        const link = currentLinks.find(l => l.clientId === clientId);
        if (!link) return;

        const editForm = createFullEditForm(link);
        originalItem.replaceWith(editForm);
        feather.replace();
        editForm.querySelector('input[name="title"]').focus();
    }

    // createFullEditForm 创建完整的编辑表单元素
    function createFullEditForm(link) {
        const item = document.createElement('li');
        item.className = 'management-link-item is-editing';
        item.dataset.linkId = link.clientId;

        item.innerHTML = `
            <div class="edit-form-grid">
                <input type="text" name="title" class="form-control" value="${App.helpers.escapeHTML(link.title)}" placeholder="标题">
                <input type="url" name="url" class="form-control" value="${App.helpers.escapeHTML(link.url)}" placeholder="URL">
                <input type="text" name="category" class="form-control" value="${App.helpers.escapeHTML(link.category || '')}" placeholder="分类 (选填)">
            </div>
            <div class="management-link-actions">
                <button title="保存" class="btn-save-full-edit"><i data-feather="check"></i></button>
                <button title="取消" class="btn-cancel-full-edit"><i data-feather="x"></i></button>
            </div>
        `;

        item.querySelector('.btn-save-full-edit').addEventListener('click', (e) => {
            e.stopPropagation();
            saveFullEdit(item);
        });

        item.querySelector('.btn-cancel-full-edit').addEventListener('click', (e) => {
            e.stopPropagation();
            renderPanels();
        });

        return item;
    }

    // saveFullEdit 保存完整编辑的更改
    function saveFullEdit(editItem) {
        const clientId = editItem.dataset.linkId;
        const link = currentLinks.find(l => l.clientId === clientId);
        if (!link) return;

        const title = editItem.querySelector('input[name="title"]').value.trim();
        const url = editItem.querySelector('input[name="url"]').value.trim();
        const category = editItem.querySelector('input[name="category"]').value.trim();

        if (!title || !url) {
            App.toast.show('标题和 URL 不能为空。', 'error');
            return;
        }

        link.title = title;
        link.url = url;
        link.category = category;

        renderPanels();
    }

    // findLastIndex 从数组中查找最后一个符合条件的元素的索引
    function findLastIndex(arr, predicate) {
        for (let i = arr.length - 1; i >= 0; i--) {
            if (predicate(arr[i])) {
                return i;
            }
        }
        return -1;
    }
    
    // editLinkTitle 编辑链接标题
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

    // editCategoryName 编辑分类名称
    function editCategoryName(titleElement, oldCategoryName, panelName) {
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
                const oldKey = `${panelName}-${originalName}`;
                const newKey = `${panelName}-${newCategoryName}`;
                if (openCategories.has(oldKey)) {
                    openCategories.delete(oldKey);
                    openCategories.add(newKey);
                }
                currentLinks.forEach(link => {
                    if (link.panel === panelName && (link.category || 'Uncategorized') === originalName) {
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

    // deleteCategory 删除一个分类及其所有链接
    function deleteCategory(categoryName, panelName) {
        const categoryKey = `${panelName}-${categoryName}`;
        openCategories.delete(categoryKey);
        currentLinks = currentLinks.filter(link => {
            return !((link.category || 'Uncategorized') === categoryName && link.panel === panelName);
        });
        renderPanels();
    }

    // deleteLink 删除单个链接
    function deleteLink(clientId) {
        const itemToRemove = dom.container.querySelector(`li[data-link-id="${clientId}"]`);
        
        currentLinks = currentLinks.filter(link => link.clientId !== clientId);

        if (itemToRemove) {
            const linkList = itemToRemove.parentElement;
            const categoryGroup = linkList.closest('.management-category-group');
            const header = categoryGroup?.querySelector('.management-category-header');

            itemToRemove.remove();

            if (linkList.children.length === 0) {
                categoryGroup?.remove();
            } else {
                if (header?.classList.contains('open')) {
                    linkList.style.maxHeight = linkList.scrollHeight + 'px';
                }
            }
        } else {
            renderPanels();
        }
    }

    document.addEventListener('links-updated', invalidateCache);

    return {
        getLinkData,
        loadAndRender,
        invalidateCache
    };

})();
