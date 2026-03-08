// 定义全局 App 命名空间
window.App = window.App || {};

// 通用拖放模块 (Drag and Drop)
App.dnd = (function () {
    // 模块内状态变量
    const state = {
        draggedItem: null,      // 被拖动的实际元素
        ghost: null,            // 跟随指针的视觉克隆
        placeholder: null,      // 显示放置位置的占位符
        isDragging: false,
        
        // 与指针相关的状态
        startX: 0,
        startY: 0,
        offsetX: 0,
        offsetY: 0,
        DRAG_THRESHOLD: 10 // 降低阈值以提高响应性
    };

    // 初始化模块，为指定的容器启动拖放功能
    function init(container) {
        // 清理旧的监听器以防止重复绑定
        container.removeEventListener('mousedown', onPointerDown);
        container.removeEventListener('touchstart', onPointerDown);

        container.addEventListener('mousedown', onPointerDown);
        container.addEventListener('touchstart', onPointerDown, { passive: false });
    }

    // 拖动开始 (鼠标按下或触摸开始)
    function onPointerDown(e) {
        // 仅处理鼠标左键
        if (e.type === 'mousedown' && e.button !== 0) return;

        const target = e.target.closest('[draggable="true"]');
        if (!target) return;

        // 阻止默认行为，如文本选择
        e.preventDefault();

        const pointer = e.type === 'touchstart' ? e.touches[0] : e;
        const rect = target.getBoundingClientRect();

        state.draggedItem = target;
        state.startX = pointer.clientX;
        state.startY = pointer.clientY;
        state.offsetX = pointer.clientX - rect.left;
        state.offsetY = pointer.clientY - rect.top;

        // 在整个文档上添加监听器，以跟踪页面上任何地方的移动
        document.addEventListener('mousemove', onPointerMove);
        document.addEventListener('touchmove', onPointerMove, { passive: false });
        document.addEventListener('mouseup', onPointerUp);
        document.addEventListener('touchend', onPointerUp);
    }

    // 拖动过程 (鼠标或手指移动)
    function onPointerMove(e) {
        if (!state.draggedItem) return;

        // 在触摸设备上拖动时阻止页面滚动
        e.preventDefault(); 
        
        const pointer = e.type === 'touchmove' ? e.touches[0] : e;

        // 如果尚未处于拖动模式，检查是否已达到阈值
        if (!state.isDragging) {
            const dx = Math.abs(pointer.clientX - state.startX);
            const dy = Math.abs(pointer.clientY - state.startY);
            if (dx > state.DRAG_THRESHOLD || dy > state.DRAG_THRESHOLD) {
                // 正式开始拖动
                state.isDragging = true;
                createGhost();
                createPlaceholder();
                state.draggedItem.classList.add('dragging');
            }
        }

        // 如果正在拖动，则移动幽灵元素并更新占位符
        if (state.isDragging) {
            moveGhost(pointer);
            updatePlaceholder(pointer);
        }
    }

    // 拖动结束 (鼠标抬起或触摸结束)
    function onPointerUp(e) {
        // 清理文档级的事件监听器
        document.removeEventListener('mousemove', onPointerMove);
        document.removeEventListener('touchmove', onPointerMove);
        document.removeEventListener('mouseup', onPointerUp);
        document.removeEventListener('touchend', onPointerUp);

        if (state.isDragging) {
            // 如果占位符在有效的放置区域，则派发 drop 事件
            if (state.placeholder && state.placeholder.parentNode) {
                const dropEvent = new CustomEvent('dnd:drop', {
                    bubbles: true, // 允许事件冒泡
                    detail: {
                        item: state.draggedItem,
                        target: state.placeholder.parentNode,
                        nextElement: state.placeholder.nextElementSibling
                    }
                });
                state.placeholder.parentNode.dispatchEvent(dropEvent);
            }
        }
        
        // 清理UI和状态
        cleanup();
    }
    
    // --- 辅助函数 ---

    // 创建“幽灵”元素 (跟随鼠标的视觉副本)
    function createGhost() {
        if (!state.draggedItem) return;
        state.ghost = state.draggedItem.cloneNode(true);
        state.ghost.classList.add('ghost');
        const rect = state.draggedItem.getBoundingClientRect();
        state.ghost.style.width = `${rect.width}px`;
        state.ghost.style.height = `${rect.height}px`;
        document.body.appendChild(state.ghost);
    }

    // 移动“幽灵”元素以匹配指针位置
    function moveGhost(pointer) {
        if (!state.ghost) return;
        state.ghost.style.transform = `translate(${pointer.clientX - state.offsetX}px, ${pointer.clientY - state.offsetY}px)`;
    }

    // 创建占位符以显示可放置的位置
    function createPlaceholder() {
        if (!state.draggedItem) return;
        state.placeholder = document.createElement('div');
        state.placeholder.className = 'drop-placeholder';
        // 根据项目类型添加特定的占位符样式
        const itemType = state.draggedItem.dataset.dndType;
        if (itemType === 'category') {
            state.placeholder.classList.add('category-placeholder');
        }
        const rect = state.draggedItem.getBoundingClientRect();
        state.placeholder.style.height = `${rect.height}px`;
    }
    
    // 更新占位符的位置
    function updatePlaceholder(pointer) {
        if (!state.placeholder || !state.draggedItem) return;

        // 隐藏“幽灵”以查找其下方的元素
        state.ghost.style.display = 'none';
        const elementBelow = document.elementFromPoint(pointer.clientX, pointer.clientY);
        state.ghost.style.display = '';

        if (!elementBelow) return;

        // 根据拖动项的类型，精确查找对应的放置目标
        const draggedType = state.draggedItem.dataset.dndType;
        const targetSelector = `[data-dnd-target="${draggedType === 'category' ? 'category-container' : 'link-container'}"]`;
        const dropTarget = elementBelow.closest(targetSelector);

        // 验证放置是否有效
        if (!isValidDrop(dropTarget)) {
            if (state.placeholder.parentNode) {
                state.placeholder.remove();
            }
            return;
        }
        
        // 寻找插入占位符的位置
        const afterElement = getDragAfterElement(dropTarget, pointer.clientY, draggedType);
        if (afterElement) {
            dropTarget.insertBefore(state.placeholder, afterElement);
        } else {
            dropTarget.appendChild(state.placeholder);
        }
    }

    // 检查是否是有效的放置目标
    function isValidDrop(dropTarget) {
        if (!dropTarget || !state.draggedItem) return false;

        const draggedType = state.draggedItem.dataset.dndType; // 'link' 或 'category'
        const targetType = dropTarget.dataset.dndTarget;     // 'category-container' 或 'link-container'

        if (draggedType === 'category') {
            return targetType === 'category-container';
        }

        if (draggedType === 'link') {
            return targetType === 'link-container';
        }

        return false;
    }

    // 计算占位符应该被插入到哪个元素的前面
    function getDragAfterElement(container, y, draggedType) {
        // 获取容器内所有与拖动项类型相同的、可拖动的元素（不包括自身）
        const selector = `[draggable="true"][data-dnd-type="${draggedType}"]:not(.dragging)`;
        const draggableElements = [...container.querySelectorAll(selector)];

        // 找到第一个垂直中心点在指针下方的元素
        return draggableElements.find(child => {
            const box = child.getBoundingClientRect();
            return y < box.top + box.height / 2;
        });
    }

    // 清理所有拖放相关的元素和状态
    function cleanup() {
        if (state.draggedItem) {
            state.draggedItem.classList.remove('dragging');
        }
        if (state.ghost) {
            state.ghost.remove();
        }
        if (state.placeholder) {
            state.placeholder.remove();
        }
        
        // 重置状态对象
        state.isDragging = false;
        state.draggedItem = null;
        state.ghost = null;
        state.placeholder = null;
    }

    return { init };
})();
