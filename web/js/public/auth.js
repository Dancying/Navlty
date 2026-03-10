window.App = window.App || {};

App.auth = (function () {
    let isAuthorized = false;
    let onSuccessCallback = null;

    // init 初始化认证模块
    function init() {
        if (localStorage.getItem("isAuthorized") === "true") {
            isAuthorized = true;
        }
    }
    
    // handleUnauthorized 处理未授权的情况
    function handleUnauthorized() {
        isAuthorized = false;
        localStorage.removeItem("isAuthorized");
        App.toast.show("登录状态已失效，请重新验证", "error");
        checkAuthStatus();
    }

    // authUser 验证用户密码
    async function authUser(password) {
        try {
            const result = await App.api.request("/auth/login", {
                method: "POST",
                body: JSON.stringify({ password }),
            });

            if (result.success) {
                isAuthorized = true;
                localStorage.setItem("isAuthorized", "true");
                window.location.reload();
            } else {
                isAuthorized = false;
                localStorage.removeItem("isAuthorized");
                App.toast.show("密码验证失败", "error");
            }
        } catch (error) {
            isAuthorized = false;
            localStorage.removeItem("isAuthorized");
            console.error("Auth failed:", error);
            if (error.message !== 'Unauthorized') {
                App.toast.show("验证请求失败，请检查网络或稍后重试", "error");
            }
        }
    }
    
    // logout 用户登出
    async function logout() {
        try {
            await App.api.request("/auth/logout", { method: "POST" });
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            isAuthorized = false;
            localStorage.removeItem("isAuthorized");
        }
    }

    // _showAuthModal 创建并显示一个通用的认证模态框
    function _showAuthModal(config) {
        const modalContent = `
            <div class="modal-content" id="auth-modal-content">
                <div class="modal-header">
                    <h2>${config.title}</h2>
                    <span class="close-button">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="${config.inputId}">${config.label}</label>
                        <input type="password" id="${config.inputId}" placeholder="${config.placeholder}" autocomplete="${config.autocomplete}">
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary cancel-button">取消</button>
                    <button class="btn btn-primary confirm-button">${config.buttonText}</button>
                </div>
            </div>`;

        const modal = document.createElement('div');
        modal.id = config.modalId;
        modal.className = 'modal';
        modal.innerHTML = modalContent;
        document.body.appendChild(modal);

        App.modal.open(config.modalId);

        modal.querySelector('.confirm-button').addEventListener('click', async () => {
            const passwordInput = document.getElementById(config.inputId);
            const password = passwordInput.value;
            if (!password) {
                App.toast.show("密码不能为空", "error");
                return;
            }
            await authUser(password);
        });

        modal.querySelector('.cancel-button').addEventListener('click', () => App.modal.close());
        modal.querySelector('.close-button').addEventListener('click', () => App.modal.close());

        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                App.modal.close();
            }
        });
    }

    // showSetInitialPassword 显示设置初始密码的模态框
    function showSetInitialPassword() {
        _showAuthModal({
            modalId: 'auth-modal',
            title: '设置访问密码',
            label: '首次使用，请设置访问密码',
            inputId: 'new-password',
            placeholder: '请输入···',
            autocomplete: 'new-password',
            buttonText: '保存'
        });
    }

    // showVerifyPassword 显示验证密码的模态框
    function showVerifyPassword() {
        _showAuthModal({
            modalId: 'auth-modal',
            title: '验证访问密码',
            label: '请输入访问密码',
            inputId: 'password',
            placeholder: '请输入···',
            autocomplete: 'current-password',
            buttonText: '确认'
        });
    }

    // checkAuthStatus 检查授权状态（交互式）
    async function checkAuthStatus(callback) {
        if (isAuthorized) {
            if (callback) callback();
            return;
        }

        onSuccessCallback = callback;

        try {
            const result = await App.api.request("/auth/status");
            if (result.isPasswordSet) {
                showVerifyPassword();
            } else {
                showSetInitialPassword();
            }
        } catch (error) {
            console.error("Failed to check auth status:", error);
            if (error.message !== 'Unauthorized') {
                App.toast.show("密码错误或服务器异常，请重试", "error");
            }
        }
    }

    // isAuthenticated 检查用户是否已通过身份验证
    function isAuthenticated() {
        return isAuthorized;
    }

    return {
        init,
        logout,
        checkAuthStatus,
        isAuthenticated,
        handleUnauthorized,
    };
})();
