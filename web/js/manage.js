
// 确保 App 全局命名空间存在
window.App = window.App || {};

// 链接管理模块
App.manage = (function() {

    // --- 状态变量 ---
    let currentLinks = [];
    let dom = {}; // 缓存 DOM 元素的引用
    let draggedInfo = null; // 用于跟踪被拖动元素的信息
    let placeholder = null; // 用于显示放置位置的占位符

    // --- 初始化 ---
    function init() {
        // 缓存 DOM 节点
        dom.modal = document.getElementById('management-modal');
        dom.openButton = document.getElementById('management-button');
        dom.saveButton = document.getElementById('management-save-button');
        dom.container = document.getElementById('link-management-container');
        
        // 确保关键元素存在
        if (!dom.modal || !dom.openButton || !dom.saveButton || !dom.container) {
            console.error('Management modal elements are missing from the DOM.');
            return;
        }
        
        const closeButton = dom.modal.querySelector('.close-button');
        if (closeButton) {
            closeButton.addEventListener('click', closeModal);
        }

        // 绑定核心事件
        dom.openButton.addEventListener('click', openModal);
        dom.saveButton.addEventListener('click', saveChanges);

        // 全局拖动结束事件，用于清理
        document.addEventListener('dragend', handleDragEnd);
    }

    // --- 模态框控制 ---
    function openModal() {
        document.body.classList.add('modal-open');
        dom.modal.style.display = 'block';
        // 使用专用的 body ID，让 CSS 可以精确定位
        dom.modal.querySelector('.modal-body').id = 'link-management-body';
        loadAndRender();
    }

    function closeModal() {
        document.body.classList.remove('modal-open');
        dom.modal.style.display = 'none';
        dom.modal.querySelector('.modal-body').id = ''; // 移除 ID
    }

    // --- 核心渲染逻辑 ---
    async function loadAndRender() {
        try {
            const response = await fetch('/api/links');
            if (!response.ok) throw new Error('Failed to fetch links.');
            const linksData = await response.json();
            // 确保数据不为 null 或 undefined
            currentLinks = linksData || [];
            renderPanels();
        } catch (error) {
            console.error('Error loading links:', error);
            App.toast.show('无法加载链接', 'error');
            dom.container.innerHTML = `<p style="color: red; text-align: center;">加载链接失败。</p>`;
        }
    }

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
    
    function createPanel(title, panelName, links) {
        const panel = document.createElement('div');
        panel.className = 'management-panel';
        panel.dataset.panelName = panelName;

        const panelTitle = document.createElement('h3');
        panelTitle.className = 'management-panel-title';
        panelTitle.textContent = title;
        
        // 创建滚动容器
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'management-panel-content-wrapper';

        panel.appendChild(panelTitle);
        panel.appendChild(contentWrapper);
        
        // 关键改动：保持数组顺序，而不是字母排序
        const categories = [];
        const categoryMap = new Map();

        links.forEach(link => {
            const categoryName = link.category || '未分类';
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

        // 为滚动容器（内容包装器）添加拖放事件
        contentWrapper.addEventListener('dragover', handleDragOver);
        contentWrapper.addEventListener('dragleave', handleDragLeave);
        contentWrapper.addEventListener('drop', handleDrop);

        return panel;
    }

    function createCategory(categoryName, links, panelName) {
        const group = document.createElement('div');
        group.className = 'management-category-group';
        group.dataset.categoryName = categoryName;

        const header = createCategoryHeader(categoryName, panelName);
        const linkList = createLinkList(links);
        
        group.appendChild(header);
        group.appendChild(linkList);

        // 为分类组本身也添加事件，以便可以将链接拖入空分类
        group.addEventListener('dragover', handleDragOver);
        group.addEventListener('dragleave', handleDragLeave);
        group.addEventListener('drop', handleDrop);

        return group;
    }

    function createCategoryHeader(categoryName, panelName) {
        const header = document.createElement('div');
        header.className = 'management-category-header';
        header.draggable = true;
        // 添加 data- 属性以在拖动时识别
        header.dataset.type = 'category';
        header.dataset.categoryName = categoryName;
        header.dataset.panelName = panelName;

        header.addEventListener('click', () => {
            const linkList = header.nextElementSibling;
            if (linkList) {
                header.classList.toggle('open');
                linkList.style.maxHeight = header.classList.contains('open') ? linkList.scrollHeight + "px" : null;
            }
        });
        header.addEventListener('dragstart', handleDragStart);

        const titleContainer = document.createElement('div');
        titleContainer.className = 'category-title-container';
        titleContainer.innerHTML = `<i data-feather="chevron-right" class="category-chevron"></i>`;
        
        const title = document.createElement('span');
        title.className = 'management-category-title';
        title.textContent = categoryName;
        titleContainer.appendChild(title);

        const actions = document.createElement('div');
        actions.className = 'management-category-actions';
        
        const editButton = document.createElement('button');
        editButton.title = '修改分类名';
        editButton.innerHTML = '<i data-feather="edit-2"></i>';
        editButton.addEventListener('click', (e) => {
            e.stopPropagation(); // 防止触发展开/折叠
            if(header.querySelector('.management-category-title')) {
                editCategoryName(header.querySelector('.management-category-title'), categoryName);
            }
        });

        const deleteButton = document.createElement('button');
        deleteButton.title = '删除分类';
        deleteButton.innerHTML = '<i data-feather="trash-2"></i>';
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteCategory(categoryName); // 移除了 confirm
        });
        
        actions.appendChild(editButton);
        actions.appendChild(deleteButton);

        header.appendChild(titleContainer);
        header.appendChild(actions);
        return header;
    }

    function createLinkList(links) {
        const list = document.createElement('ul');
        list.className = 'management-link-list';
        links.forEach(link => {
            list.appendChild(createLinkItem(link));
        });
        return list;
    }

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
        // 修复：使用 addEventListener
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteLink(link.url);
        });

        actions.appendChild(deleteButton);
        item.appendChild(title);
        item.appendChild(actions);
        return item;
    }

    // --- 拖放事件处理 ---
    
    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('[draggable="true"]:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
    
    function createPlaceholder(type) {
        if (placeholder) placeholder.remove();
        placeholder = document.createElement('div');
        placeholder.className = 'drop-placeholder';
        if (type === 'category') {
            placeholder.classList.add('category-placeholder');
        }
    }

    function handleDragStart(e) {
        e.stopPropagation();
        const target = e.target;
        draggedInfo = {
            type: target.dataset.type,
            element: target
        };
        // 统一从 data- 属性获取数据
        if (draggedInfo.type === 'link') {
            draggedInfo.url = target.dataset.linkUrl;
        } else if (draggedInfo.type === 'category') {
            draggedInfo.categoryName = target.dataset.categoryName;
            draggedInfo.panelName = target.dataset.panelName;
        }

        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', draggedInfo.type); // 必需项

        setTimeout(() => target.classList.add('dragging'), 0);
        createPlaceholder(draggedInfo.type);
    }
    
    function handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();

        const dropTarget = e.currentTarget;
        let container;

        if (draggedInfo.type === 'link') {
            // 链接可以拖入分类组或链接列表
            container = dropTarget.querySelector('.management-link-list') || dropTarget;
        } else { // category
            // 分类只能拖入面板的内容包装器
            container = dropTarget.closest('.management-panel-content-wrapper');
        }

        if (!container) return;
        
        const afterElement = getDragAfterElement(container, e.clientY);
        if (afterElement) {
            container.insertBefore(placeholder, afterElement);
        } else {
            container.appendChild(placeholder);
        }

        dropTarget.classList.add('drag-over');
    }

    function handleDragLeave(e) {
        e.currentTarget.classList.remove('drag-over');
    }

    function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        if (!draggedInfo) return;

        const dropTarget = e.currentTarget;
        dropTarget.classList.remove('drag-over');
        
        // 目标信息
        const targetPanelEl = dropTarget.closest('.management-panel');
        const targetCategoryGroupEl = dropTarget.closest('.management-category-group');
        
        const targetPanel = targetPanelEl ? targetPanelEl.dataset.panelName : null;
        let targetCategory = targetCategoryGroupEl ? targetCategoryGroupEl.dataset.categoryName : null;

        // --- 核心数据操作 ---
        
        // 1. 找到并移除被拖动的元素(们)
        let movedItems = [];
        let fromIndex = -1;
        if (draggedInfo.type === 'link') {
            fromIndex = currentLinks.findIndex(l => l.url === draggedInfo.url);
            if (fromIndex > -1) {
                movedItems = currentLinks.splice(fromIndex, 1);
            }
        } else { // category
            const categoryLinks = [];
            currentLinks = currentLinks.filter(l => {
                if (l.category === draggedInfo.categoryName) {
                    categoryLinks.push(l);
                    return false;
                }
                return true;
            });
            movedItems = categoryLinks;
        }

        if (movedItems.length === 0) {
            renderPanels(); // 出错则复原
            return;
        }
        
        // 2. 确定插入位置
        let toIndex = -1;
        if (placeholder && placeholder.parentNode) {
            const nextSibling = placeholder.nextElementSibling;
            if (nextSibling) {
                const nextSiblingUrl = nextSibling.dataset.linkUrl;
                const nextSiblingCategory = nextSibling.dataset.categoryName;
                if(nextSiblingUrl) { // 插入到链接前
                    toIndex = currentLinks.findIndex(l => l.url === nextSiblingUrl);
                } else if(nextSiblingCategory) { // 插入到分类前
                    toIndex = currentLinks.findIndex(l => l.category === nextSiblingCategory);
                }
            }
        }
        
        // 如果没有找到 `toIndex`，意味着要添加到列表末尾
        if (toIndex === -1) {
             if (targetCategory) { // 添加到分类的末尾
                 let lastLinkOfCategory = -1;
                 for(let i = currentLinks.length - 1; i >= 0; i--) {
                     if (currentLinks[i].category === targetCategory) {
                         lastLinkOfCategory = i;
                         break;
                     }
                 }
                 toIndex = lastLinkOfCategory > -1 ? lastLinkOfCategory + 1 : currentLinks.length;
             } else if (targetPanel) { // 添加到面板的末尾
                 let lastLinkOfPanel = -1;
                 for(let i = currentLinks.length - 1; i >= 0; i--) {
                     if (currentLinks[i].panel === targetPanel) {
                         lastLinkOfPanel = i;
                         break;
                     }
                 }
                 toIndex = lastLinkOfPanel > -1 ? lastLinkOfPanel + 1 : currentLinks.length;
             } else {
                 toIndex = currentLinks.length; // 默认添加到总列表末尾
             }
        }
        
        // 3. 更新被移动项的属性
        movedItems.forEach(item => {
            if (targetPanel) item.panel = targetPanel;
            // 如果目标是分类组，则使用该分类名；否则如果是拖动链接，保持其原分类名
            if (targetCategory) {
                item.category = targetCategory;
            } else if (draggedInfo.type === 'link') {
                 // 如果链接被拖到一个面板的根区域，但不是一个具体的分类里
                 // 保持其原有的分类名，只切换面板
            }
        });
        
        // 4. 将元素插入到新位置
        currentLinks.splice(toIndex, 0, ...movedItems);
        
        // 5. 重新渲染
        renderPanels();
    }
    
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
    }

    // --- 其他交互函数 ---
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
                currentLinks.forEach(link => {
                    if (link.category === oldCategoryName) {
                        link.category = newCategoryName;
                    }
                });
            }
            renderPanels(); // 重新渲染以反映更改
        };

        input.addEventListener('blur', save);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') input.blur();
            if (e.key === 'Escape') renderPanels(); // 按 Esc 撤销更改并重新渲染
        });
    }
    
    // 移除确认框
    function deleteCategory(categoryName) {
        currentLinks = currentLinks.filter(link => (link.category || '未分类') !== categoryName);
        renderPanels();
    }

    // 修复后的删除链接函数
    function deleteLink(url) {
        currentLinks = currentLinks.filter(link => link.url !== url);
        renderPanels();
    }
    
    // 移除自动刷新
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
            App.toast.show('链接已成功更新!', 'success');
            closeModal(); // 保存成功后关闭模态框
            // 可以在这里触发一个自定义事件，让其他模块响应更新
            // document.dispatchEvent(new CustomEvent('links-updated'));
        } catch (error) {
            console.error('Error saving changes:', error);
            App.toast.show(`保存失败: ${error.message}`, 'error');
        }
    }

    return {
        init,
        deleteLink // 暴露 deleteLink 以便修复后的按钮能够调用
    };
})();
