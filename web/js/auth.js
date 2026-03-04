// 定义全局 App 命名空间
window.App = window.App || {};

// 授权模块
App.auth = (function () {
    let isAuthorized = false;
    let onSuccessCallback = null;

    // 初始化模块
    function init() { }

    // 验证用户密码
    async function authUser(password) {
        try {
            const response = await fetch("/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                isAuthorized = true;
                document.getElementById("add-button").style.display = "block";
                document.getElementById("management-button").style.display = "block";
                App.modal.close("auth-modal");
                App.toast.show("密码验证通过", "success");
                if (onSuccessCallback) {
                    onSuccessCallback();
                }
            } else {
                isAuthorized = false;
                App.toast.show("密码验证失败", "error");
            }
        } catch (error) {
            isAuthorized = false;
            console.error("Auth failed:", error);
            App.toast.show("验证发生错误", "error");
        }
    }

    // 显示设置初始密码的模态框
    function showSetInitialPassword() {
        const modalContent = `
            <div class="modal-content" id="auth-modal-content">
                <div class="modal-header">
                    <h2>设置访问密码</h2>
                    <span class="close-button">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="new-password">首次使用，请设置访问密码</label>
                        <input type="password" id="new-password" placeholder="请输入···" autocomplete="new-password">
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary cancel-button">取消</button>
                    <button class="btn btn-primary save-button">保存</button>
                </div>
            </div>`;

        const modal = document.createElement('div');
        modal.id = 'auth-modal';
        modal.className = 'modal';
        modal.innerHTML = modalContent;
        document.body.appendChild(modal);

        App.modal.open('auth-modal');

        modal.querySelector('.save-button').addEventListener('click', async () => {
            const passwordInput = document.getElementById("new-password");
            const password = passwordInput.value;
            if (!password) {
                App.toast.show("密码不能为空", "error");
                return;
            }
            await authUser(password);
        });

        modal.querySelector('.cancel-button').addEventListener('click', () => App.modal.close('auth-modal'));
        modal.querySelector('.close-button').addEventListener('click', () => App.modal.close('auth-modal'));

        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                App.modal.close('auth-modal');
            }
        });
    }

    // 显示验证密码的模态框
    function showVerifyPassword() {
        const modalContent = `
            <div class="modal-content" id="auth-modal-content">
                <div class="modal-header">
                    <h2>验证访问密码</h2>
                    <span class="close-button">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="password">请输入访问密码</label>
                        <input type="password" id="password" placeholder="请输入···" autocomplete="current-password">
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary cancel-button">取消</button>
                    <button class="btn btn-primary confirm-button">确认</button>
                </div>
            </div>`;

        const modal = document.createElement('div');
        modal.id = 'auth-modal';
        modal.className = 'modal';
        modal.innerHTML = modalContent;
        document.body.appendChild(modal);

        App.modal.open('auth-modal');

        modal.querySelector('.confirm-button').addEventListener('click', async () => {
            const passwordInput = document.getElementById("password");
            const password = passwordInput.value;
            if (!password) {
                App.toast.show("密码不能为空", "error");
                return;
            }
            await authUser(password);
        });

        modal.querySelector('.cancel-button').addEventListener('click', () => App.modal.close('auth-modal'));
        modal.querySelector('.close-button').addEventListener('click', () => App.modal.close('auth-modal'));

        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                App.modal.close('auth-modal');
            }
        });
    }

    // 检查授权状态（交互式）
    async function checkAuthStatus(callback) {
        if (isAuthorized) {
            if (callback) callback();
            return;
        }

        onSuccessCallback = callback;

        try {
            const response = await fetch("/auth/status");
            const result = await response.json();
            if (result.isPasswordSet) {
                showVerifyPassword();
            } else {
                showSetInitialPassword();
            }
        } catch (error) {
            console.error("Failed to check auth status:", error);
            App.toast.show("身份验证失败", "error");
        }
    }

    // 检查用户是否已通过身份验证
    function isAuthenticated() {
        return isAuthorized;
    }

    return {
        init,
        checkAuthStatus,
        isAuthenticated,
    };
})();
