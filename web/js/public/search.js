window.App = window.App || {};

App.search = (function () {
    let searchWrapper, searchInput, searchButton;

    // init 初始化搜索功能
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

    // showSearch 显示搜索框
    function showSearch() {
        if (searchWrapper) {
            searchWrapper.classList.add('active');
            searchInput.focus();
        }
    }

    // hideSearch 隐藏搜索框
    function hideSearch() {
        if (searchWrapper) {
            searchWrapper.classList.remove('active');
            searchInput.value = '';
            searchInput.blur();
            clearSearch();
        }
    }

    // toggleSearch 切换搜索框的显示状态
    function toggleSearch() {
        if (searchWrapper.classList.contains('active')) {
            hideSearch();
        } else {
            showSearch();
        }
    }

    // performSearch 执行搜索并过滤卡片
    function performSearch() {
        const searchTerm = searchInput.value.toLowerCase();
        if (searchTerm.trim() === '') {
            clearSearch();
            return;
        }

        const activePanel = document.querySelector('.panel.active');
        if (!activePanel) return;

        const isPrimary = activePanel.id === 'primary-panel';

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

    // clearSearch 清除搜索结果
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
