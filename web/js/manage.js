// 确保 App 全局命名空间存在
window.App = window.App || {};

// 链接管理模块
App.manage = (function () {

    // 模块内状态变量
    let currentLinks = [];
    let dom = { container: null };
    let openCategories = new Set();

    // 响应拖放结束事件，处理数据模型的变更
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
            const linkUrl = item.dataset.linkUrl;
            const fromIndex = currentLinks.findIndex(l => l.url === linkUrl);
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
                const nextLinkUrl = nextElement.dataset.linkUrl;
                toIndex = currentLinks.findIndex(l => l.url === nextLinkUrl);
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

    // 在指定容器中加载并渲染链接管理界面
    async function loadAndRender(container) {
        dom.container = container;
        dom.container.innerHTML = '<div class="loading-spinner"></div>';
        dom.container.addEventListener('dnd:drop', handleDrop);

        try {
            const response = await fetch('/api/links');
            if (!response.ok) throw new Error('Failed to fetch links.');
            const linksData = await response.json();
            currentLinks = linksData || [];
            renderPanels();
        } catch (error) {
            console.error('Error loading links:', error);
            App.toast.show('链接加载失败', 'error');
            dom.container.innerHTML = '<p style="color: red; text-align: center;">加载链接失败。</p>';
        }
    }

    // 渲染主面板和副面板
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

    // 创建单个面板（主面板或副面板）
    function createPanel(title, panelName, links) {
        const panel = document.createElement('div');
        panel.className = 'management-panel';
        panel.dataset.panelName = panelName;
        const panelTitle = document.createElement('h3');
        panelTitle.className = 'management-panel-title';
        panelTitle.textContent = title;
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'management-panel-content-wrapper';
        contentWrapper.dataset.dndTarget = 'category-container'; // 修复：使用简单的标识符
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

    // 创建单个分类（包含标题和链接列表）
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

    // 创建分类的头部（包含标题、图标和操作按钮）
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
                App.toast.show('链接复制成功', 'success');
            }, () => {
                App.toast.show('链接复制失败', 'error');
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

    // 切换分类的展开/收起状态
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

    // 创建链接列表的 UL 元素
    function createLinkList(links) {
        const list = document.createElement('ul');
        list.className = 'management-link-list';
        list.style.overflow = 'hidden';
        list.style.maxHeight = '0px';
        list.dataset.dndTarget = 'link-container'; // 修复：使用简单的标识符

        links.forEach(link => {
            list.appendChild(createLinkItem(link));
        });
        return list;
    }

    // 创建单个链接项 LI 元素
    function createLinkItem(link) {
        const item = document.createElement('li');
        item.className = 'management-link-item';
        item.dataset.linkUrl = link.url;
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
                editLinkTitle(titleElement, link.url);
            }
        });

        const copyButton = document.createElement('button');
        copyButton.title = '复制链接数据';
        copyButton.innerHTML = '<i data-feather="copy"></i>';
        copyButton.addEventListener('click', (e) => {
            e.stopPropagation();
            const formattedLink = `${link.title}|${link.url}|${link.category || 'Uncategorized'}|${link.icon_url || 'globe'}|${l.desc || ''}`;
            navigator.clipboard.writeText(formattedLink).then(() => {
                App.toast.show('链接复制成功', 'success');
            }, () => {
                App.toast.show('链接复制失败', 'error');
            });
        });

        const deleteButton = document.createElement('button');
        deleteButton.title = '删除链接数据';
        deleteButton.innerHTML = '<i data-feather="x"></i>';
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteLink(link.url);
        });

        actions.appendChild(editButton);
        actions.appendChild(copyButton);
        actions.appendChild(deleteButton);
        item.appendChild(title);
        item.appendChild(actions);
        return item;
    }

    // 查找数组中最后一个满足条件的元素的索引
    function findLastIndex(arr, predicate) {
        for (let i = arr.length - 1; i >= 0; i--) {
            if (predicate(arr[i])) {
                return i;
            }
        }
        return -1;
    }
    
    // 处理链接标题的编辑操作
    function editLinkTitle(titleElement, linkUrl) {
        if (titleElement.querySelector('input')) return;
        const linkToEdit = currentLinks.find(l => l.url === linkUrl);
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
            if (e.key === 'Escape') renderPanels();
        });
    }

    // 处理分类名称的编辑操作
    function editCategoryName(titleElement, oldCategoryName) {
        if (titleElement.querySelector('input')) return;
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'management-category-input';
        input.value = oldCategoryName;
        titleElement.replaceWith(input);
        input.focus();
        const save = () => {
            const newCategoryName = input.value.trim();
            if (newCategoryName && newCategoryName !== oldCategoryName) {
                if (openCategories.has(oldCategoryName)) {
                    openCategories.delete(oldCategoryName);
                    openCategories.add(newCategoryName);
                }
                currentLinks.forEach(link => {
                    if ((link.category || 'Uncategorized') === oldCategoryName) {
                        link.category = newCategoryName;
                    }
                });
            }
            renderPanels();
        };
        input.addEventListener('blur', save);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') input.blur();
            if (e.key === 'Escape') renderPanels();
        });
    }

    // 删除整个分类
    function deleteCategory(categoryName) {
        openCategories.delete(categoryName);
        currentLinks = currentLinks.filter(link => (link.category || 'Uncategorized') !== categoryName);
        renderPanels();
    }

    // 删除单个链接
    function deleteLink(url) {
        currentLinks = currentLinks.filter(link => link.url !== url);
        renderPanels();
    }

    // 保存所有更改到后端
    async function saveChanges() {
        try {
            const response = await fetch('/api/links', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentLinks),
            });
            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(errorData || 'Failed to save changes.');
            }
            App.toast.show('链接保存成功', 'success');
            App.modal.close();
            document.dispatchEvent(new CustomEvent('links-updated'));
        } catch (error) {
            console.error('Error saving changes:', error);
            App.toast.show('链接保存失败', 'error');
        }
    }

    return {
        loadAndRender,
        saveChanges,
    };
})();
