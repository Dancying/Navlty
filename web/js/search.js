// 定义全局 App 命名空间
window.App = window.App || {};

// 搜索功能模块
App.search = (function() {
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
            // 实时根据输入内容进行搜索
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
        // 如果搜索词为空，则清除搜索结果
        if (searchTerm.trim() === '') {
            clearSearch();
            return;
        }

        // 定位到当前激活的面板
        const activePanel = document.querySelector('.panel.active');
        if (!activePanel) return;

        // 判断当前是否为主面板，主面板需要搜索描述
        const isPrimary = activePanel.id === 'primary-panel';

        // 遍历所有分类容器
        activePanel.querySelectorAll('.card-container').forEach(container => {
            let categoryHasVisibleCards = false;
            // 遍历容器内的所有卡片
            container.querySelectorAll('.card').forEach(card => {
                const title = card.querySelector('.title')?.textContent.toLowerCase() || '';
                const url = card.href?.toLowerCase() || '';
                const desc = isPrimary ? (card.querySelector('.desc span')?.textContent.toLowerCase() || '') : '';

                // 匹配逻辑：标题、URL或描述包含搜索词
                const isMatch = title.includes(searchTerm) || url.includes(searchTerm) || (isPrimary && desc.includes(searchTerm));
                
                card.style.display = isMatch ? '' : 'none';
                if (isMatch) {
                    categoryHasVisibleCards = true;
                }
            });

            // 如果一个分类下没有任何卡片匹配，则隐藏该分类的标题
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

    // 暴露公共方法
    return { init, showSearch, hideSearch, toggleSearch };
})();
