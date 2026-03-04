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
                createAdminUI(); // 创建管理员 UI
                App.modal.close("auth-modal");
                App.toast.show("密码验证通过", "success");
                if (typeof onSuccessCallback === 'function') {
                    onSuccessCallback();
                }
                onSuccessCallback = null;
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

    // 创建并注入管理员 UI 元素
    function createAdminUI() {
        if (document.getElementById('add-button')) {
            return;
        }

        const buttonContainer = document.querySelector(".button-container");
        const settingsButton = document.getElementById('settings-button');

        const addButton = document.createElement('button');
        addButton.id = 'add-button';
        addButton.className = 'icon-button';
        addButton.dataset.modalTarget = 'addLinkModal';
        addButton.innerHTML = '<i data-feather="plus"></i>';

        const managementButton = document.createElement('button');
        managementButton.id = 'management-button';
        managementButton.className = 'icon-button';
        managementButton.dataset.modalTarget = 'management-modal';
        managementButton.innerHTML = '<i data-feather="list"></i>';

        if (buttonContainer && settingsButton) {
            buttonContainer.insertBefore(addButton, settingsButton);
            buttonContainer.insertBefore(managementButton, settingsButton);
        }

        const modalsHTML = `
            <!-- Add Link Modal -->
            <div id="addLinkModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>添加链接</h2>
                        <span class="close-button"><i data-feather="x"></i></span>
                    </div>
                    <div class="modal-body">
                        <div class="tab-switcher">
                            <button class="tab-button active" data-tab="single-link-tab">单个添加</button>
                            <button class="tab-button" data-tab="bulk-add-tab">批量添加</button>
                        </div>
                        <div class="tab-content-container">
                            <div id="single-link-tab" class="tab-content active">
                                 <form id="add-link-form" class="form-grid">
                                    <div class="form-group">
                                        <label for="link-title">标题*</label>
                                        <input type="text" id="link-title" name="title" placeholder="Google" required>
                                    </div>
                                    <div class="form-group">
                                        <label for="link-url">链接*</label>
                                        <input type="url" id="link-url" name="url" placeholder="https://google.com" required>
                                    </div>
                                    <div class="form-group">
                                        <label for="link-category">分类</label>
                                        <input type="text" id="link-category" name="category" placeholder="搜索引擎">
                                    </div>
                                    <div class="form-group">
                                        <label for="link-icon">图标</label>
                                        <div class="input-with-button">
                                            <input type="text" id="link-icon" name="icon" placeholder="Feather 图标名、URL 或 Base64">
                                            <button type="button" id="upload-icon-button" class="btn icon-button"><i data-feather="upload"></i></button>
                                            <input type="file" id="icon-file-input" class="hidden-file-input" accept="image/*">
                                        </div>
                                    </div>
                                    <div class="form-group span-two">
                                        <label for="link-description">描述</label>
                                        <textarea id="link-description" name="description" placeholder="全球最大的搜索引擎"></textarea>
                                    </div>
                                </form>
                            </div>
                            <div id="bulk-add-tab" class="tab-content">
                                <form id="bulk-add-form">
                                     <div class="form-group">
                                        <label for="bulk-links">批量链接</label>
                                        <textarea id="bulk-links" name="bulk-links" placeholder="标题 | URL | 分类(可选) | 图标URL(可选) | 描述(可选)"></textarea>
                                        <small>提示：仅标题和 URL 是必需的。使用“|”分隔符。</small>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary cancel-button">取消</button>
                        <button class="btn btn-primary" id="save-link-button">保存</button>
                    </div>
                </div>
            </div>
            <!-- Link Management Modal -->
            <div id="management-modal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>链接管理</h2>
                        <span class="close-button"><i data-feather="x"></i></span>
                    </div>
                    <div class="modal-body" id="link-management-body">
                        <div id="link-management-container" class="link-management-grid">
                            <!-- JS will populate this content -->
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary cancel-button">取消</button>
                        <button type="button" class="btn btn-primary" id="management-save-button">保存</button>
                    </div>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', modalsHTML);

        feather.replace();

        App.modal.init();
        App.links.init();
        App.manage.init();
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
