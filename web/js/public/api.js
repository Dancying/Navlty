window.App = window.App || {};

App.api = (function () {

    // request 发起一个 API 请求
    async function request(url, options = {}) {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const config = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers,
            },
        };

        try {
            const response = await fetch(url, config);

            if (response.status === 401) {
                App.auth.handleUnauthorized();
                throw new Error('Unauthorized');
            }

            if (!response.ok) {
                try {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
                } catch (e) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            }

            return await response.json();

        } catch (error) {
            throw error;
        }
    }

    return {
        request,
    };

})();