// 定义全局 App 命名空间
window.App = window.App || {};

// 搜索功能模块
App.search = (function () {
    let searchWrapper, searchInput, searchButton;

    // 初始化搜索相关的元素和事件
    function init() {
        searchWrapper = document.getElementById('search-wrapper');
        searchInput = document.getElementById('search-input');
        searchButton = document.getElementById('search-button');

        if (searchButton) {
            searchButton.addEventListener('click', toggleSearch);
        }
        if (searchInput) {
            searchInput.addEventListener('input', performSearch);
        }
    }

    // 显示搜索框
    function showSearch() {
        if (searchWrapper) {
            searchWrapper.classList.add('active');
            searchInput.focus();
        }
    }

    // 隐藏搜索框并清空内容
    function hideSearch() {
        if (searchWrapper) {
            searchWrapper.classList.remove('active');
            searchInput.value = '';
            searchInput.blur();
            clearSearch();
        }
    }

    // 切换搜索框的显示和隐藏状态
    function toggleSearch() {
        if (searchWrapper.classList.contains('active')) {
            hideSearch();
        } else {
            showSearch();
        }
    }

    // 执行搜索操作，过滤卡片
    function performSearch() {
        const searchTerm = searchInput.value.toLowerCase();
        if (searchTerm.trim() === '') {
            clearSearch();
            return;
        }

        const activePanel = document.querySelector('.panel.active');
        if (!activePanel) return;

        const isPrimary = activePanel.id === 'primary-panel';

        // 遍历所有分类容器
        activePanel.querySelectorAll('.card-container').forEach(container => {
            let categoryHasVisibleCards = false;
            container.querySelectorAll('.card').forEach(card => {
                const title = card.querySelector('.title')?.textContent.toLowerCase() || '';
                const url = card.href?.toLowerCase() || '';
                const desc = isPrimary ? (card.querySelector('.desc span')?.textContent.toLowerCase() || '') : '';

                const isMatch = title.includes(searchTerm) || url.includes(searchTerm) || (isPrimary && desc.includes(searchTerm));

                card.style.display = isMatch ? '' : 'none';
                if (isMatch) {
                    categoryHasVisibleCards = true;
                }
            });

            const categoryTitle = container.previousElementSibling;
            if (categoryTitle && categoryTitle.classList.contains('category-title')) {
                categoryTitle.style.display = categoryHasVisibleCards ? '' : 'none';
            }
        });
    }

    // 清除搜索结果，恢复所有卡片和分类标题的显示
    function clearSearch() {
        document.querySelectorAll('.panel.active .card').forEach(card => {
            card.style.display = '';
        });
        document.querySelectorAll('.panel.active .category-title').forEach(title => {
            title.style.display = '';
        });
    }

    return { init, showSearch, hideSearch, toggleSearch };
})();
