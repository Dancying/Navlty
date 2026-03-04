// 确保 App 全局命名空间存在
window.App = window.App || {};

// 链接管理模块
App.manage = (function () {

    // 模块内状态变量
    let currentLinks = [];
    let dom = {};
    let openCategories = new Set();
    let dragEndTime = 0;
    let isDragging = false;
    let draggedInfo = null;
    let placeholder = null;
    let ghost = null;
    let offsetX = 0, offsetY = 0;

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
        return group;
    }

    // 创建分类的头部（包含标题、图标和操作按钮）
    function createCategoryHeader(categoryName, panelName) {
        const header = document.createElement('div');
        header.className = 'management-category-header';

        header.addEventListener('mousedown', (e) => onPointerDown(e, header, 'category'));
        header.addEventListener('touchstart', (e) => onPointerDown(e, header, 'category'), { passive: false });

        header.dataset.type = 'category';
        header.dataset.categoryName = categoryName;
        header.dataset.panelName = panelName;

        const titleContainer = document.createElement('div');
        titleContainer.className = 'category-title-container';
        titleContainer.innerHTML = `<i data-feather="chevron-right" class="category-chevron"></i>`;

        const title = document.createElement('span');
        title.className = 'management-category-title';
        title.textContent = categoryName;
        titleContainer.appendChild(title);

        titleContainer.addEventListener('click', () => {
            if (isDragging || (Date.now() - dragEndTime < 150)) return;

            const linkList = header.nextElementSibling;
            if (!linkList || !linkList.classList.contains('management-link-list')) return;

            const isOpening = !header.classList.contains('open');
            header.classList.toggle('open', isOpening);

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

        item.addEventListener('mousedown', (e) => onPointerDown(e, item, 'link'));
        item.addEventListener('touchstart', (e) => onPointerDown(e, item, 'link'), { passive: false });

        item.dataset.type = 'link';
        item.dataset.linkUrl = link.url;

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
            const formattedLink = `${link.title}|${link.url}|${link.category || 'Uncategorized'}|${link.icon_url || 'globe'}|${link.desc || ''}`;
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

    // 步骤 1: 拖动开始 (鼠标按下或触摸开始)
    function onPointerDown(e, element, type) {
        if (e.type === 'mousedown' && e.button !== 0) return;
        e.stopPropagation();

        const target = element;
        const rect = target.getBoundingClientRect();
        const pointer = e.type === 'touchstart' ? e.touches[0] : e;
        
        offsetX = pointer.clientX - rect.left;
        offsetY = pointer.clientY - rect.top;

        draggedInfo = {
            element: target,
            type: type,
            isCategory: type === 'category',
            originalElement: type === 'category' ? target.closest('.management-category-group') : target,
        };
        draggedInfo.sourceList = draggedInfo.originalElement.parentNode;

        if (draggedInfo.isCategory) {
            draggedInfo.categoryName = target.dataset.categoryName;
            draggedInfo.panelName = target.dataset.panelName;
        } else {
            draggedInfo.url = target.dataset.linkUrl;
        }

        document.addEventListener('mousemove', onPointerMove);
        document.addEventListener('touchmove', onPointerMove, { passive: false });
        document.addEventListener('mouseup', onPointerUp);
        document.addEventListener('touchend', onPointerUp);
    }
    
    // 步骤 2: 拖动过程 (鼠标或手指移动)
    function onPointerMove(e) {
        if (!draggedInfo) return;
        e.preventDefault();

        if (!isDragging) {
            isDragging = true;
            draggedInfo.originalElement.classList.add('dragging');
            createPlaceholder(draggedInfo.type);
            createGhost();
        }
        
        const pointer = e.type === 'touchmove' ? e.touches[0] : e;
        
        if (ghost) {
            ghost.style.transform = `translate(${pointer.clientX - offsetX}px, ${pointer.clientY - offsetY}px)`;
        }
        
        updatePlaceholderPosition(pointer);
    }

    // 步骤 2.1: 更新占位符位置
    function updatePlaceholderPosition(pointer) {
        if (!placeholder) return;
        
        const elementBelow = document.elementFromPoint(pointer.clientX, pointer.clientY);
        if (!elementBelow) return;

        const dropTarget = elementBelow.closest('.management-panel-content-wrapper, .management-link-list, .management-category-header');
        if (!dropTarget) {
            if (placeholder.parentNode) placeholder.parentNode.removeChild(placeholder);
            return;
        }

        let container, scrollContainer;

        if (draggedInfo.isCategory) {
            container = dropTarget.closest('.management-panel-content-wrapper');
        } else {
             const categoryGroup = dropTarget.closest('.management-category-group');
             if (categoryGroup && categoryGroup.querySelector('.management-category-header').classList.contains('open')) {
                 container = categoryGroup.querySelector('.management-link-list');
             } else {
                 container = null;
             }
        }
        
        if (container) {
            scrollContainer = findScrollableParent(container);
            const afterElement = getDragAfterElement(container, pointer.clientY, scrollContainer);
            if (afterElement) {
                container.insertBefore(placeholder, afterElement);
            } else {
                container.appendChild(placeholder);
            }
        } else {
            if (placeholder.parentNode) placeholder.parentNode.removeChild(placeholder);
        }
    }

    // 步骤 3: 拖动结束 (鼠标抬起或触摸结束)
    function onPointerUp() {
        document.removeEventListener('mousemove', onPointerMove);
        document.removeEventListener('touchmove', onPointerMove);
        document.removeEventListener('mouseup', onPointerUp);
        document.removeEventListener('touchend', onPointerUp);

        if (!isDragging) {
            draggedInfo = null;
            return;
        }

        if (placeholder && placeholder.parentNode) {
            dropAndReposition();
        }
        
        if (draggedInfo && draggedInfo.originalElement) {
            draggedInfo.originalElement.classList.remove('dragging');
        }
        if (ghost) {
            ghost.remove();
            ghost = null;
        }
        if (placeholder) {
            placeholder.remove();
            placeholder = null;
        }

        draggedInfo = null;
        isDragging = false;
        dragEndTime = Date.now();
    }

    // 核心放置逻辑
    function dropAndReposition() {
        const targetContainer = placeholder.parentNode;
        const finalTargetCategoryGroup = targetContainer.closest('.management-category-group');
        const targetPanelEl = targetContainer.closest('.management-panel');
        const targetPanel = targetPanelEl ? targetPanelEl.dataset.panelName : null;

        let movedItems = [];
        if (!draggedInfo.isCategory) {
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
        if (nextSibling && !nextSibling.classList.contains('dragging')) {
            const nextSiblingUrl = nextSibling.dataset.linkUrl;
            const nextSiblingCategoryName = nextSibling.dataset.categoryName;
            
            if (draggedInfo.isCategory && nextSiblingCategoryName) {
                 toIndex = currentLinks.findIndex(l => (l.category || 'Uncategorized') === nextSiblingCategoryName);
            } else if (!draggedInfo.isCategory && nextSiblingUrl) {
                toIndex = currentLinks.findIndex(l => l.url === nextSiblingUrl);
            }
        }

        if (toIndex === -1) {
            if (draggedInfo.isCategory) {
                 const lastCategoryInPanel = Array.from(targetContainer.children).filter(el => el.matches('.management-category-group:not(.dragging)')).pop();
                 if (lastCategoryInPanel) {
                     const lastCategoryName = lastCategoryInPanel.dataset.categoryName;
                     let lastLinkIndex = -1;
                     for(let i = currentLinks.length - 1; i >= 0; i--) {
                         if ((currentLinks[i].category || 'Uncategorized') === lastCategoryName) {
                             lastLinkIndex = i;
                             break;
                         }
                     }
                     toIndex = lastLinkIndex + 1;
                 } else {
                     toIndex = currentLinks.length;
                 }
            } else { 
                const categoryName = finalTargetCategoryGroup ? finalTargetCategoryGroup.dataset.categoryName : null;
                if(categoryName) {
                    let lastLinkIndex = -1;
                     for(let i = currentLinks.length - 1; i >= 0; i--) {
                         if ((currentLinks[i].category || 'Uncategorized') === categoryName) {
                             lastLinkIndex = i;
                             break;
                         }
                     }
                     toIndex = lastLinkIndex + 1;
                } else {
                    toIndex = currentLinks.length;
                }
            }
        }
        if (toIndex === -1) toIndex = currentLinks.length;

        const finalTargetCategoryName = finalTargetCategoryGroup ? finalTargetCategoryGroup.dataset.categoryName : (draggedInfo.isCategory ? draggedInfo.categoryName : '未分类');

        movedItems.forEach(item => {
            if (targetPanel) item.panel = targetPanel;
            if (!draggedInfo.isCategory) {
                 item.category = finalTargetCategoryName;
            } else {
                 item.category = item.category || 'Uncategorized';
            }
        });

        currentLinks.splice(toIndex, 0, ...movedItems);
        renderPanels(); 
    }

    // 动态查找第一个可滚动的父元素
    function findScrollableParent(element) {
        if (!element) return document.getElementById('link-management-body') || document.body;
        let parent = element;
        while (parent && parent.tagName !== 'BODY') {
            const style = window.getComputedStyle(parent);
            if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
                return parent;
            }
            parent = parent.parentElement;
        }
        return document.getElementById('link-management-body') || document.body;
    }
    
    // 计算拖动时元素应插入的位置
    function getDragAfterElement(container, y, scrollContainer) {
        const children = [...container.children];
        const scrollContainerRect = scrollContainer.getBoundingClientRect();
        const relativeY = y - scrollContainerRect.top + scrollContainer.scrollTop;

        return children.reduce((closest, child) => {
            if (child.classList.contains('dragging') || child.classList.contains('drop-placeholder') || child.classList.contains('ghost')) {
                return closest;
            }
            const box = child.getBoundingClientRect();
            const childTopInScrolledContent = box.top - scrollContainerRect.top + scrollContainer.scrollTop;
            const offset = relativeY - childTopInScrolledContent - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    // 创建占位符
    function createPlaceholder(type) {
        if (placeholder) placeholder.remove();
        placeholder = document.createElement('div');
        placeholder.className = 'drop-placeholder';
        if (type === 'category') {
            placeholder.classList.add('category-placeholder');
        }
    }
    
    // 创建“幽灵”元素
    function createGhost() {
        if (ghost) ghost.remove();
        const original = draggedInfo.element;
        ghost = original.cloneNode(true);
        ghost.classList.add('ghost');
        const rect = original.getBoundingClientRect();
        ghost.style.width = `${rect.width}px`;
        ghost.style.height = `${rect.height}px`;
        document.body.appendChild(ghost);
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
            closeModal();
            document.dispatchEvent(new CustomEvent('links-updated'));
        } catch (error) {
            console.error('Error saving changes:', error);
            App.toast.show('链接保存失败', 'error');
        }
    }

    return {
        init,
    };
})();
