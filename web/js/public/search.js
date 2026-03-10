window.App = window.App || {};

App.search = (function () {
    let searchWrapper, searchInput, searchButton;

    // init 初始化搜索相关的 DOM 元素和事件监听器
    function init() {
        searchWrapper = document.getElementById('search-wrapper');
        searchInput = document.getElementById('search-input');
        searchButton = document.getElementById('search-button');

        if (searchButton) {
            searchButton.addEventListener('click', toggleSearch);
        }
        if (searchInput) {
            let debounceTimer;
            searchInput.addEventListener('input', () => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(performSearch, 100);
            });
        }
    }

    // showSearch 显示并聚焦搜索框
    function showSearch() {
        if (!searchWrapper) return;
        searchWrapper.classList.add('active');
        searchInput.focus();
    }

    // hideSearch 隐藏搜索框并清除搜索结果
    function hideSearch() {
        if (!searchWrapper) return;
        searchWrapper.classList.remove('active');
        searchInput.value = '';
        searchInput.blur();
        clearSearch();
    }

    // toggleSearch 切换搜索框的显示或隐藏状态
    function toggleSearch() {
        if (!searchWrapper) return;
        if (searchWrapper.classList.contains('active')) {
            hideSearch();
        } else {
            showSearch();
        }
    }

    // performSearch 根据输入框中的词语执行搜索，通过 CSS 类名过滤卡片
    function performSearch() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const activePanel = document.querySelector('.panel.active');
        if (!activePanel) return;

        if (searchTerm === '') {
            clearSearch();
            return;
        }

        activePanel.classList.add('is-searching');
        const isPrimary = activePanel.id === 'primary-panel';

        activePanel.querySelectorAll('.card').forEach(card => {
            const title = card.querySelector('.title')?.textContent.toLowerCase() || '';
            const url = card.href?.toLowerCase() || '';
            const desc = isPrimary ? (card.querySelector('.desc span')?.textContent.toLowerCase() || '') : '';

            if (title.includes(searchTerm) || url.includes(searchTerm) || (isPrimary && desc.includes(searchTerm))) {
                card.classList.add('is-match');
            } else {
                card.classList.remove('is-match');
            }
        });

        activePanel.querySelectorAll('.card-container').forEach(container => {
            const categoryHasVisibleCards = container.querySelector('.card.is-match');
            const categoryTitle = container.previousElementSibling;

            if (categoryTitle && categoryTitle.classList.contains('category-title')) {
                if (categoryHasVisibleCards) {
                    categoryTitle.classList.add('is-match');
                } else {
                    categoryTitle.classList.remove('is-match');
                }
            }
        });
    }

    // clearSearch 清除搜索状态和所有匹配标记
    function clearSearch() {
        const activePanel = document.querySelector('.panel.active');
        if (!activePanel) return;

        activePanel.classList.remove('is-searching');
        
        activePanel.querySelectorAll('.card.is-match, .category-title.is-match').forEach(el => {
            el.classList.remove('is-match');
        });
    }

    return { init, showSearch, hideSearch, toggleSearch };
})();
