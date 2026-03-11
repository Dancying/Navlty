window.App = window.App || {};

App.api = (function () {

    // request 发起一个 API 请求
    async function request(url, options = {}) {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        if (response.ok) {
            return response.json();
        }

        response.status === 401 && App.auth.handleUnauthorized();
        throw new Error({401: 'Unauthorized'}[response.status] || `HTTP error! status: ${response.status}`);
    }

    return { request };
})();
