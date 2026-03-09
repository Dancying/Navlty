// 定义全局 App 命名空间
window.App = window.App || {};

// API 模块
App.api = (function () {

    // 封装的 fetch 函数
    async function request(url, options = {}) {
        // 默认设置
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
        };

        // 合并默认和传入的 options
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

            // 如果遇到 401 未授权错误，触发重新认证
            if (response.status === 401) {
                App.auth.handleUnauthorized();
                // 抛出错误以中断后续操作
                throw new Error('Unauthorized');
            }

            // 如果响应不成功，尝试解析 JSON 错误信息
            if (!response.ok) {
                try {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
                } catch (e) {
                    // 如果无法解析 JSON，则抛出通用错误
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            }

            // 如果响应成功，则返回 JSON 数据
            return await response.json();

        } catch (error) {
            // 重新抛出错误，以便调用方可以捕获它
            throw error;
        }
    }

    // 导出公共方法
    return {
        request,
    };

})();