window.App = window.App || {};

App.dnd = (function () {
    const state = {
        draggedItem: null,
        ghost: null,
        placeholder: null,
        isDragging: false,
        startX: 0,
        startY: 0,
        offsetX: 0,
        offsetY: 0,
        DRAG_THRESHOLD: 10
    };

    // init 初始化并为指定容器启动拖放功能
    function init(container) {
        container.removeEventListener('mousedown', onPointerDown);
        container.removeEventListener('touchstart', onPointerDown);
        container.addEventListener('mousedown', onPointerDown);
        container.addEventListener('touchstart', onPointerDown, { passive: false });
    }

    // onPointerDown 处理拖动开始事件
    function onPointerDown(e) {
        if (e.type === 'mousedown' && e.button !== 0) return;
        const target = e.target.closest('[draggable="true"]');
        if (!target) return;

        e.preventDefault();

        const pointer = e.type === 'touchstart' ? e.touches[0] : e;
        const rect = target.getBoundingClientRect();

        state.draggedItem = target;
        state.startX = pointer.clientX;
        state.startY = pointer.clientY;
        state.offsetX = pointer.clientX - rect.left;
        state.offsetY = pointer.clientY - rect.top;

        document.addEventListener('mousemove', onPointerMove);
        document.addEventListener('touchmove', onPointerMove, { passive: false });
        document.addEventListener('mouseup', onPointerUp);
        document.addEventListener('touchend', onPointerUp);
    }

    // onPointerMove 处理拖动过程中的移动
    function onPointerMove(e) {
        if (!state.draggedItem) return;

        e.preventDefault();

        const pointer = e.type === 'touchmove' ? e.touches[0] : e;

        if (!state.isDragging) {
            const dx = Math.abs(pointer.clientX - state.startX);
            const dy = Math.abs(pointer.clientY - state.startY);
            if (dx > state.DRAG_THRESHOLD || dy > state.DRAG_THRESHOLD) {
                state.isDragging = true;
                createGhost();
                createPlaceholder();
                state.draggedItem.classList.add('dragging');
            }
        }

        if (state.isDragging) {
            moveGhost(pointer);
            updatePlaceholder(pointer);
        }
    }

    // onPointerUp 处理拖动结束事件
    function onPointerUp(e) {
        document.removeEventListener('mousemove', onPointerMove);
        document.removeEventListener('touchmove', onPointerMove);
        document.removeEventListener('mouseup', onPointerUp);
        document.removeEventListener('touchend', onPointerUp);

        if (state.isDragging) {
            if (state.placeholder && state.placeholder.parentNode) {
                const dropEvent = new CustomEvent('dnd:drop', {
                    bubbles: true,
                    detail: {
                        item: state.draggedItem,
                        target: state.placeholder.parentNode,
                        nextElement: state.placeholder.nextElementSibling
                    }
                });
                state.placeholder.parentNode.dispatchEvent(dropEvent);
            }
        }

        cleanup();
    }

    // createGhost 创建一个跟随指针的视觉副本
    function createGhost() {
        if (!state.draggedItem) return;
        state.ghost = state.draggedItem.cloneNode(true);
        state.ghost.classList.add('ghost');
        const rect = state.draggedItem.getBoundingClientRect();
        state.ghost.style.width = `${rect.width}px`;
        state.ghost.style.height = `${rect.height}px`;
        document.body.appendChild(state.ghost);
    }

    // moveGhost 移动幽灵元素以匹配指针位置
    function moveGhost(pointer) {
        if (!state.ghost) return;
        state.ghost.style.transform = `translate(${pointer.clientX - state.offsetX}px, ${pointer.clientY - state.offsetY}px)`;
    }

    // createPlaceholder 创建一个占位符以显示可放置的位置
    function createPlaceholder() {
        if (!state.draggedItem) return;
        state.placeholder = document.createElement('div');
        state.placeholder.className = 'drop-placeholder';
        const itemType = state.draggedItem.dataset.dndType;
        if (itemType === 'category') {
            state.placeholder.classList.add('category-placeholder');
        }
        const rect = state.draggedItem.getBoundingClientRect();
        state.placeholder.style.height = `${rect.height}px`;
    }

    // updatePlaceholder 更新占位符的位置
    function updatePlaceholder(pointer) {
        if (!state.placeholder || !state.draggedItem) return;

        state.ghost.style.display = 'none';
        const elementBelow = document.elementFromPoint(pointer.clientX, pointer.clientY);
        state.ghost.style.display = '';

        if (!elementBelow) return;

        const draggedType = state.draggedItem.dataset.dndType;
        const targetSelector = `[data-dnd-target="${draggedType === 'category' ? 'category-container' : 'link-container'}"]`;
        const dropTarget = elementBelow.closest(targetSelector);

        if (!isValidDrop(dropTarget)) {
            if (state.placeholder.parentNode) {
                state.placeholder.remove();
            }
            return;
        }

        const afterElement = getDragAfterElement(dropTarget, pointer.clientY, draggedType);
        if (afterElement) {
            dropTarget.insertBefore(state.placeholder, afterElement);
        } else {
            dropTarget.appendChild(state.placeholder);
        }
    }

    // isValidDrop 检查当前拖动项是否可以放置在目标上
    function isValidDrop(dropTarget) {
        if (!dropTarget || !state.draggedItem) return false;

        const draggedType = state.draggedItem.dataset.dndType;
        const targetType = dropTarget.dataset.dndTarget;

        if (draggedType === 'category') {
            return targetType === 'category-container';
        }

        if (draggedType === 'link') {
            return targetType === 'link-container';
        }

        return false;
    }

    // getDragAfterElement 计算占位符应插入到哪个元素之前
    function getDragAfterElement(container, y, draggedType) {
        const selector = `[draggable="true"][data-dnd-type="${draggedType}"]:not(.dragging)`;
        const draggableElements = [...container.querySelectorAll(selector)];

        return draggableElements.find(child => {
            const box = child.getBoundingClientRect();
            return y < box.top + box.height / 2;
        });
    }

    // cleanup 清理所有拖放相关的元素和状态
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

        state.isDragging = false;
        state.draggedItem = null;
        state.ghost = null;
        state.placeholder = null;
    }

    return { init };
})();
