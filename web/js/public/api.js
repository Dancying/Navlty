window.App = window.App || {};

App.api = (function () {

    // request 发起一个 API 请求
    async function request(url, options = {}) {
        const config = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        };

        const response = await fetch(url, config);

        if (response.status === 401) {
            App.auth.handleUnauthorized();
            throw new Error('Unauthorized');
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    return {
        request,
    };

})();
