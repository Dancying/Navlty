
// 确保 App 全局命名空间存在
window.App = window.App || {};

// 链接管理模块
App.manage = (function() {

    // 模块内状态变量
    let currentLinks = [];
    let dom = {};
    let draggedInfo = null;
    let placeholder = null;
    let dragEndTime = 0;
    let openCategories = new Set();

    // 初始化模块，缓存DOM并绑定事件
    function init() {
        dom.modal = document.getElementById('management-modal');
        dom.openButton = document.getElementById('management-button');
        dom.saveButton = document.getElementById('management-save-button');
        dom.container = document.getElementById('link-management-container');
        
        if (!dom.modal || !dom.openButton || !dom.saveButton || !dom.container) {
            console.error('Management modal elements are missing from the DOM.');
            return;
        }
        
        const closeButton = dom.modal.querySelector('.close-button');
        if (closeButton) {
            closeButton.addEventListener('click', closeModal);
        }

        dom.openButton.addEventListener('click', openModal);
        dom.saveButton.addEventListener('click', saveChanges);
        document.addEventListener('dragend', handleDragEnd);
    }

    // 打开管理模态框
    function openModal() {
        document.body.classList.add('modal-open');
        dom.modal.style.display = 'block';
        dom.modal.querySelector('.modal-body').id = 'link-management-body';
        loadAndRender();
    }

    // 关闭管理模态框
    function closeModal() {
        document.body.classList.remove('modal-open');
        dom.modal.style.display = 'none';
        dom.modal.querySelector('.modal-body').id = '';
        openCategories.clear();
    }

    // 从后端加载链接数据并渲染整个面板
    async function loadAndRender() {
        try {
            const response = await fetch('/api/links');
            if (!response.ok) throw new Error('Failed to fetch links.');
            const linksData = await response.json();
            currentLinks = linksData || [];
            renderPanels();
        } catch (error) {
            console.error('Error loading links:', error);
            App.toast.show('链接加载失败', 'error');
            dom.container.innerHTML = `<p style="color: red; text-align: center;">加载链接失败。</p>`;
        }
    }

    // 渲染主面板和副面板
    function renderPanels() {
        dom.container.innerHTML = '';
        const primaryLinks = currentLinks.filter(link => link.panel === 'primary');
        const secondaryLinks = currentLinks.filter(link => link.panel === 'secondary');
        const primaryPanel = createPanel('主面板', 'primary', primaryLinks);
        const secondaryPanel = createPanel('副面板', 'secondary', secondaryLinks);
        dom.container.appendChild(primaryPanel);
        dom.container.appendChild(secondaryPanel);
        feather.replace();
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

        contentWrapper.addEventListener('dragover', handleDragOver);
        contentWrapper.addEventListener('dragleave', handleDragLeave);
        contentWrapper.addEventListener('drop', handleDrop);
        return panel;
    }

    // 创建单个分类（包含标题和链接列表）
    function createCategory(categoryName, links, panelName) {
        const group = document.createElement('div');
        group.className = 'management-category-group';
        group.dataset.categoryName = categoryName;

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
        group.addEventListener('dragover', handleDragOver);
        group.addEventListener('dragleave', handleDragLeave);
        group.addEventListener('drop', handleDrop);
        return group;
    }

    // 创建分类的头部（包含标题、图标和操作按钮）
    function createCategoryHeader(categoryName, panelName) {
        const header = document.createElement('div');
        header.className = 'management-category-header';
        header.draggable = true;
        header.dataset.type = 'category';
        header.dataset.categoryName = categoryName;
        header.dataset.panelName = panelName;
        header.addEventListener('dragstart', handleDragStart);

        const titleContainer = document.createElement('div');
        titleContainer.className = 'category-title-container';
        titleContainer.innerHTML = `<i data-feather="chevron-right" class="category-chevron"></i>`;
        
        const title = document.createElement('span');
        title.className = 'management-category-title';
        title.textContent = categoryName;
        titleContainer.appendChild(title);

        titleContainer.addEventListener('click', () => {
            if (Date.now() - dragEndTime < 100) return;

            const linkList = header.nextElementSibling;
            if (!linkList || !linkList.classList.contains('management-link-list')) return;
            
            const isOpening = !header.classList.contains('open');
            header.classList.toggle('open', isOpening);
            
            // 根据状态即时展开或收起列表
            if (isOpening) {
                openCategories.add(categoryName);
                linkList.style.maxHeight = linkList.scrollHeight + 'px';
            } else {
                openCategories.delete(categoryName);
                linkList.style.maxHeight = '0px';
            }
        });

        const actions = document.createElement('div');
        actions.className = 'management-category-actions';
        
        const editButton = document.createElement('button');
        editButton.title = '修改分类名';
        editButton.innerHTML = '<i data-feather="edit-2"></i>';
        editButton.addEventListener('click', (e) => {
            e.stopPropagation();
            if(header.querySelector('.management-category-title')) {
                editCategoryName(header.querySelector('.management-category-title'), categoryName);
            }
        });

        const deleteButton = document.createElement('button');
        deleteButton.title = '删除分类';
        deleteButton.innerHTML = '<i data-feather="trash-2"></i>';
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteCategory(categoryName);
        });
        
        actions.appendChild(editButton);
        actions.appendChild(deleteButton);
        header.appendChild(titleContainer);
        header.appendChild(actions);
        return header;
    }

    // 创建链接列表的 UL 元素
    function createLinkList(links) {
        const list = document.createElement('ul');
        list.className = 'management-link-list';
        list.style.overflow = 'hidden';
        list.style.maxHeight = '0px';

        links.forEach(link => {
            list.appendChild(createLinkItem(link));
        });
        return list;
    }

    // 创建单个链接项 LI 元素
    function createLinkItem(link) {
        const item = document.createElement('li');
        item.className = 'management-link-item';
        item.draggable = true;
        item.dataset.type = 'link';
        item.dataset.linkUrl = link.url;
        item.addEventListener('dragstart', handleDragStart);

        const title = document.createElement('span');
        title.className = 'management-link-title';
        title.textContent = link.title;

        const actions = document.createElement('div');
        actions.className = 'management-link-actions';

        const deleteButton = document.createElement('button');
        deleteButton.title = '删除链接';
        deleteButton.innerHTML = '<i data-feather="x"></i>';
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteLink(link.url);
        });

        actions.appendChild(deleteButton);
        item.appendChild(title);
        item.appendChild(actions);
        return item;
    }

    // 计算拖动时元素应插入的位置
    function getDragAfterElement(container, y) {
        const children = [...container.children];

        return children.reduce((closest, child) => {
            if (child.classList.contains('drop-placeholder') || child.classList.contains('dragging')) {
                return closest;
            }

            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;

            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
    
    // 创建用于拖放的占位符元素
    function createPlaceholder(type) {
        if (placeholder) placeholder.remove();
        placeholder = document.createElement('div');
        placeholder.className = 'drop-placeholder';
        if (type === 'category') {
            placeholder.classList.add('category-placeholder');
        }
    }

    // 处理拖动开始事件
    function handleDragStart(e) {
        e.stopPropagation();
        const target = e.target;
        draggedInfo = {
            type: target.dataset.type,
            element: target,
            sourceList: target.parentNode
        };
        if (draggedInfo.type === 'link') {
            draggedInfo.url = target.dataset.linkUrl;
        } else if (draggedInfo.type === 'category') {
            draggedInfo.categoryName = target.dataset.categoryName;
            draggedInfo.panelName = target.dataset.panelName;
        }

        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', draggedInfo.type);
        setTimeout(() => target.classList.add('dragging'), 0);
        createPlaceholder(draggedInfo.type);
    }
    
    // 处理拖动经过事件
    function handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        const dropTarget = e.currentTarget;
        dropTarget.classList.add('drag-over');
        let container = null;

        if (draggedInfo.type === 'link') {
            const group = dropTarget.closest('.management-category-group');
            if (group) {
                const header = group.querySelector('.management-category-header');
                if (header.classList.contains('open') || e.target.closest('.management-category-header')) {
                    container = group.querySelector('.management-link-list');
                }
            }
        } else {
            container = dropTarget.closest('.management-panel-content-wrapper');
        }

        if (container && placeholder) {
            const afterElement = getDragAfterElement(container, e.clientY);
            if (afterElement) {
                container.insertBefore(placeholder, afterElement);
            } else {
                container.appendChild(placeholder);
            }
        } else if (placeholder) {
            placeholder.remove();
        }
    }

    // 处理拖动离开事件
    function handleDragLeave(e) {
        e.currentTarget.classList.remove('drag-over');
    }

    // 处理拖放事件，这是核心拖放逻辑
    function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        if (!draggedInfo) return;

        e.currentTarget.classList.remove('drag-over');
        const finalTargetCategoryGroup = placeholder ? placeholder.closest('.management-category-group') : null;

        // 验证拖放目标是否有效
        if (draggedInfo.type === 'link') {
            let isValidDrop = false;
            if (finalTargetCategoryGroup) {
                const header = finalTargetCategoryGroup.querySelector('.management-category-header');
                if (header.classList.contains('open') || e.target.closest('.management-category-header')) {
                    isValidDrop = true;
                }
            }
            if (!isValidDrop) return;
        }

        if (!placeholder || !placeholder.parentNode) return;
        
        const targetPanelEl = e.currentTarget.closest('.management-panel');
        const targetPanel = targetPanelEl ? targetPanelEl.dataset.panelName : null;

        // 更新数据
        let movedItems = [];
        if (draggedInfo.type === 'link') {
            const fromIndex = currentLinks.findIndex(l => l.url === draggedInfo.url);
            if (fromIndex > -1) movedItems = currentLinks.splice(fromIndex, 1);
        } else { 
            const categoryLinks = [];
            currentLinks = currentLinks.filter(l => {
                if ((l.category || 'Uncategorized') === draggedInfo.categoryName) {
                    categoryLinks.push(l);
                    return false;
                }
                return true;
            });
            movedItems = categoryLinks;
        }

        if (movedItems.length === 0) return;
        
        let toIndex = -1;
        const nextSibling = placeholder.nextElementSibling;
        if (nextSibling) {
            const nextSiblingUrl = nextSibling.dataset.linkUrl;
            const nextSiblingCategory = nextSibling.dataset.categoryName;
            if(nextSiblingUrl) {
                toIndex = currentLinks.findIndex(l => l.url === nextSiblingUrl);
            } else if(nextSiblingCategory) {
                toIndex = currentLinks.findIndex(l => (l.category || 'Uncategorized') === nextSiblingCategory);
            }
        }
        
        if (toIndex === -1) {
            const newCategoryName = finalTargetCategoryGroup ? finalTargetCategoryGroup.dataset.categoryName : null;
             if (newCategoryName) { 
                 let lastLinkOfCategory = -1;
                 for(let i = currentLinks.length - 1; i >= 0; i--) {
                     if ((currentLinks[i].category || 'Uncategorized') === newCategoryName) {
                         lastLinkOfCategory = i;
                         break;
                     }
                 }
                 toIndex = lastLinkOfCategory > -1 ? lastLinkOfCategory + 1 : currentLinks.length;
             } else if (targetPanel) {
                 let lastLinkOfPanel = -1;
                 for(let i = currentLinks.length - 1; i >= 0; i--) {
                     if (currentLinks[i].panel === targetPanel) {
                         lastLinkOfPanel = i;
                         break;
                     }
                 }
                 toIndex = lastLinkOfPanel > -1 ? lastLinkOfPanel + 1 : currentLinks.length;
             } else {
                 toIndex = currentLinks.length;
             }
        }
        
        const finalTargetCategoryName = finalTargetCategoryGroup ? finalTargetCategoryGroup.dataset.categoryName : '未分类';

        movedItems.forEach(item => {
            if (targetPanel) item.panel = targetPanel;
            if (draggedInfo.type === 'link') item.category = finalTargetCategoryName;
        });
        
        currentLinks.splice(toIndex, 0, ...movedItems);
        
        // 直接移动 DOM 节点以避免重新渲染
        const elementToMove = draggedInfo.type === 'category' ? draggedInfo.element.closest('.management-category-group') : draggedInfo.element;

        if (elementToMove) {
            const destinationList = placeholder.parentNode;
            destinationList.replaceChild(elementToMove, placeholder);
            
            updateListHeight(draggedInfo.sourceList);
            if (draggedInfo.sourceList !== destinationList) {
                updateListHeight(destinationList);
            }
        }
        placeholder = null;
    }
    
    // 处理拖动结束事件，用于清理
    function handleDragEnd() {
        if (draggedInfo && draggedInfo.element) {
            draggedInfo.element.classList.remove('dragging');
        }
        if (placeholder) {
            placeholder.remove();
            placeholder = null;
        }
        document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
        draggedInfo = null;
        dragEndTime = Date.now();
    }

    // 同步更新列表高度
    function updateListHeight(list) {
        if (!list || !list.classList.contains('management-link-list')) return;

        const header = list.previousElementSibling;
        if (header && header.classList.contains('open')) {
            list.style.maxHeight = list.scrollHeight + 'px';
        }
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
                    if ((link.category || '未分类') === oldCategoryName) {
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
        const linkItem = dom.container.querySelector(`.management-link-item[data-link-url='${url}']`);
        if (linkItem) {
            const list = linkItem.parentNode;
            linkItem.remove();
            updateListHeight(list);
        }
        currentLinks = currentLinks.filter(link => link.url !== url);
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
            closeModal();
            document.dispatchEvent(new CustomEvent('links-updated'));
        } catch (error) {
            console.error('Error saving changes:', error);
            App.toast.show(`链接保存失败: ${error.message}`, 'error');
        }
    }

    // 暴露 init 方法
    return {
        init,
    };
})();
