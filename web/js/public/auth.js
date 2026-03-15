window.App = window.App || {};

App.auth = (function () {
    let onSuccessCallback = null;
    let modalElements = null;

    const MODAL_CONFIG = {
        SETUP: {
            modalId: 'auth-modal',
            title: '设置访问密码',
            label: '首次使用，请设置访问密码',
            inputId: 'new-password',
            placeholder: '请输入密码...',
            autocomplete: 'new-password',
            buttonText: '保存'
        },
        VERIFY: {
            modalId: 'auth-modal',
            title: '验证访问密码',
            label: '请输入访问密码',
            inputId: 'password',
            placeholder: '请输入密码...',
            autocomplete: 'current-password',
            buttonText: '确认'
        }
    };

    // isAuthenticated 检查用户是否已通过身份验证，sessionStorage 是唯一的数据源
    function isAuthenticated() {
        return sessionStorage.getItem("isAuthorized") === "true";
    }

    // init 初始化认证模块
    function init() {
        return Promise.resolve();
    }

    // invalidateSession 静默地使前端会话失效
    function invalidateSession() {
        sessionStorage.removeItem("isAuthorized");
    }

    // handleUnauthorized 处理未授权的情况
    function handleUnauthorized() {
        invalidateSession();
        App.toast.show("登录已失效", "error");
        checkAuthStatus();
    }

    // authUser 验证用户密码
    function authUser(password) {
        const handleAuthSuccess = (result) => {
            return result.success
                ? Promise.resolve()
                : Promise.reject(new Error("密码验证失败"));
        };

        const performSuccessActions = () => {
            sessionStorage.setItem("isAuthorized", "true");
            App.modal.close(MODAL_CONFIG.VERIFY.modalId);
            onSuccessCallback && (onSuccessCallback(), onSuccessCallback = null);
            window.location.reload();
        };

        const handleAuthError = (error) => {
            invalidateSession();
            console.error("Auth failed:", error);

            const errorActionMap = {
                '密码验证失败': () => App.toast.show("密码错误", "error"),
                'default': () => App.toast.show("验证失败请重试", "error")
            };

            (error.message !== 'Unauthorized') && (errorActionMap[error.message] || errorActionMap['default'])();
        };

        App.api.request("/auth/login", {
            method: "POST",
            body: JSON.stringify({ password }),
        })
        .then(handleAuthSuccess)
        .then(performSuccessActions)
        .catch(handleAuthError);
    }

    // logout 用户登出
    function logout() {
        const finalAction = () => {
            invalidateSession();
            window.location.reload();
        };

        App.api.request("/auth/logout", { method: "POST" })
            .catch(error => console.error("Logout failed:", error))
            .finally(finalAction);
    }

    // _showAuthModal 创建并显示一个通用的认证模态框
    function _showAuthModal(config) {
        if (!modalElements) {
            const modalId = 'auth-modal';
            const modal = document.createElement('div');
            modal.id = modalId;
            modal.className = 'modal';

            modal.innerHTML = '<div class="modal-content"><div class="modal-header"><h2></h2><span class="close-button">&times;</span></div><div class="modal-body"><div class="form-group"><label></label><input type="password"></div></div><div class="modal-footer"><button class="btn btn-secondary cancel-button">取消</button><button class="btn btn-primary confirm-button"></button></div></div>';

            document.body.appendChild(modal);

            modalElements = {
                modal,
                title: modal.querySelector('h2'),
                label: modal.querySelector('label'),
                input: modal.querySelector('input[type="password"]'),
                confirmButton: modal.querySelector('.confirm-button'),
                modalContent: modal.querySelector('.modal-content')
            };

            modal.addEventListener('click', (event) => {
                event.target === modal && App.modal.close(modalId);
            });

            modalElements.modalContent.addEventListener('click', (event) => {
                const confirmAction = () => {
                    const password = modalElements.input.value;
                    password ? authUser(password) : App.toast.show("密码不能为空", "error");
                };
                const cancelAction = () => App.modal.close(modalId);

                const actionMap = {
                    '.confirm-button': confirmAction,
                    '.cancel-button': cancelAction,
                    '.close-button': cancelAction
                };

                const selector = Object.keys(actionMap).find(s => event.target.closest(s));
                selector && actionMap[selector]();
            });

            modalElements.input.addEventListener('keyup', (event) => {
                event.key === 'Enter' && (event.preventDefault(), modalElements.confirmButton.click());
            });
        }

        modalElements.title.textContent = config.title;
        modalElements.label.htmlFor = config.inputId;
        modalElements.label.textContent = config.label;
        modalElements.input.id = config.inputId;
        modalElements.input.placeholder = config.placeholder;
        modalElements.input.autocomplete = config.autocomplete;
        modalElements.input.value = "";
        modalElements.confirmButton.textContent = config.buttonText;

        App.modal.open(modalElements.modal.id);
        modalElements.input.focus();
    }

    // checkAuthStatus 检查授权状态（交互式）
    function checkAuthStatus(callback) {
        const handleStatusSuccess = (result) => {
            _showAuthModal(result.isPasswordSet ? MODAL_CONFIG.VERIFY : MODAL_CONFIG.SETUP);
        };

        const handleStatusError = (error) => {
            (error.message !== 'Unauthorized') && (
                console.error("Failed to check auth status:", error),
                App.toast.show("无法检查状态", "error")
            );
        };

        return isAuthenticated()
            ? (callback && callback(), Promise.resolve())
            : (
                onSuccessCallback = callback || null,
                App.api.request("/auth/status")
                    .then(handleStatusSuccess)
                    .catch(handleStatusError)
            );
    }

    return { init, logout, checkAuthStatus, isAuthenticated, handleUnauthorized, invalidateSession };
})();
