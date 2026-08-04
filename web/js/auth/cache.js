window.App = window.App || {};

App.cache = (function() {
    let cachedLinks = null;
    let isFetching = false;
    let fetchPromise = null;

    // fetchLinks 从服务器获取链接数据
    async function fetchLinks() {
        if (cachedLinks) {
            return cachedLinks;
        }

        if (isFetching) {
            return fetchPromise;
        }

        isFetching = true;
        fetchPromise = App.api.request('/api/links').then(data => {
            cachedLinks = data;
            isFetching = false;
            return cachedLinks;
        }).catch(error => {
            isFetching = false;
            throw error;
        });

        return fetchPromise;
    }

    // invalidate 使缓存失效
    function invalidate() {
        cachedLinks = null;
    }

    document.addEventListener('links-updated', invalidate);

    return {
        fetchLinks,
        invalidate
    };
})();
