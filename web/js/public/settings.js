// 定义全局 App 命名空间
window.App = window.App || {};

// 设置模块
App.settings = (function () {

    // 记录上次打开的面板ID，刷新后重置
    let lastActivePanelId = 'content-add-link';
    // 存储从服务器加载的原始设置
    let originalSettings = {};

    // 辅助函数：绑定上传按钮和文件输入框
    function bindUploadButton(buttonId, inputId, targetId) {
        const button = document.getElementById(buttonId);
        const input = document.getElementById(inputId);
        if (button && input) {
            button.addEventListener('click', () => input.click());
            input.addEventListener('change', () => App.helpers.fileToBase64(input, targetId));
        }
    }
    
    // 更新滑块值的显示
    function updateSliderValue(sliderId, displayId) {
        const slider = document.getElementById(sliderId);
        const display = document.getElementById(displayId);
        if (slider && display) {
            display.textContent = slider.value;
            slider.addEventListener('input', () => {
                display.textContent = slider.value;
            });
        }
    }

    // --- HTML 模板函数 ---
    function _getSiteSettingsHTML() {
        return `
        <div id="content-site-settings" class="settings-content-panel">
            <div class="modal-header"><h2>站点设置</h2></div>
            <div class="modal-body">
                <form id="site-settings-form" class="form-grid">
                    <div class="form-group"><label for="site-name">站点名称</label><input type="text" id="site-name" name="siteName" placeholder="显示在标签页的名称"></div>
                    <div class="form-group"><label for="site-icon">站点图标</label><div class="input-with-button"><input type="text" id="site-icon" name="siteIcon" placeholder="Feather 图标名、URL 或 Base64"><button type="button" id="upload-site-icon-button" class="btn icon-button"><i data-feather="upload"></i></button><input type="file" id="site-icon-file-input" class="hidden-file-input" accept="image/*"></div></div>
                    <div class="form-group"><label for="site-title">网站标题</label><input type="text" id="site-title" name="siteTitle" placeholder="显示在主页的标题"></div>
                    <div class="form-group"><label for="avatar-url">网站头像</label><div class="input-with-button"><input type="text" id="avatar-url" name="avatarURL" placeholder="Feather 图标名、URL 或 Base64"><button type="button" id="upload-avatar-button" class="btn icon-button"><i data-feather="upload"></i></button><input type="file" id="avatar-file-input" class="hidden-file-input" accept="image/*"></div></div>
                </form>
            </div>
        </div>`;
    }

    function _getStyleSettingsHTML() {
        return `
        <div id="content-style-settings" class="settings-content-panel">
            <div class="modal-header"><h2>外观设置</h2></div>
            <div class="modal-body">
                <form id="style-settings-form" class="form-grid">
                    <div class="form-group span-two"><label for="background-url">背景图片</label><div class="input-with-button"><input type="text" id="background-url" name="backgroundURL" placeholder="图片 URL 或 Base64"><button type="button" id="upload-background-button" class="btn icon-button"><i data-feather="upload"></i></button><input type="file" id="background-file-input" class="hidden-file-input" accept="image/*"></div></div>
                    <div class="form-group span-two slider-group"><label for="background-blur">背景模糊: <span id="background-blur-value">5</span>px</label><input type="range" id="background-blur" name="backgroundBlur" min="0" max="50" value="5" class="slider"></div>
                    <div class="form-group span-two slider-group"><label for="cards-per-row">每行链接卡片数量: <span id="cards-per-row-value">4</span></label><input type="range" id="cards-per-row" name="cardsPerRow" min="1" max="20" value="4" class="slider"></div>
                </form>
            </div>
        </div>`;
    }

    function _getAdvancedSettingsHTML() {
        return `
        <div id="content-advanced-settings" class="settings-content-panel">
            <div class="modal-header"><h2>高级设置</h2></div>
            <div class="modal-body">
                <form id="advanced-settings-form" class="form-grid">
                    <div class="form-group span-two"><label for="custom-css">自定义 CSS</label><textarea id="custom-css" name="customCSS" rows="4" placeholder="此处输入自定义 CSS 代码"></textarea></div>
                    <div class="form-group span-two"><label for="external-js">外部 JS</label><textarea id="external-js" name="externalJS" rows="4" placeholder="https://example.com/script.js\nhttps://another.com/script.js"></textarea></div>
                </form>
            </div>
        </div>`;
    }

    function _getAddLinkHTML() {
        return `
        <div id="content-add-link" class="settings-content-panel">
            <div class="modal-header"><h2>添加链接</h2></div>
            <div class="modal-body">
                <form id="add-link-form" class="form-grid">
                    <div class="form-group"><label for="link-title">标题*</label><input type="text" id="link-title" name="title" placeholder="Google" required></div>
                    <div class="form-group"><label for="link-url">链接*</label><input type="url" id="link-url" name="url" placeholder="https://google.com" required></div>
                    <div class="form-group"><label for="link-category">分类</label><input type="text" id="link-category" name="category" placeholder="搜索引擎"></div>
                    <div class="form-group"><label for="link-icon">图标</label><div class="input-with-button"><input type="text" id="link-icon" name="icon" placeholder="Feather 图标名、URL 或 Base64"><button type="button" id="upload-icon-button" class="btn icon-button"><i data-feather="upload"></i></button><input type="file" id="icon-file-input" class="hidden-file-input" accept="image/*"></div></div>
                    <div class="form-group span-two"><label for="link-description">描述</label><textarea id="link-description" name="description" placeholder="全球最大的搜索引擎"></textarea></div>
                </form>
            </div>
        </div>`;
    }

    function _getBulkAddHTML() {
        return `
        <div id="content-bulk-add" class="settings-content-panel">
            <div class="modal-header"><h2>批量添加</h2></div>
            <div class="modal-body">
                <form id="bulk-add-form">
                    <div class="form-group"><label for="bulk-links">批量链接</label><textarea id="bulk-links" name="bulk-links" placeholder="标题 | URL | 分类(可选) | 图标URL(可选) | 描述(可选)"></textarea><small>提示：仅标题和 URL 是必需的。使用“|”分隔符。</small></div>
                </form>
            </div>
        </div>`;
    }

    function _getManageLinksHTML() {
        return `
        <div id="content-manage-links" class="settings-content-panel">
            <div class="modal-header"><h2>链接管理</h2></div>
            <div class="modal-body" id="link-management-body"></div>
        </div>`;
    }

    function _getPasswordSettingsHTML() {
        return `
        <div id="content-password-settings" class="settings-content-panel">
            <div class="modal-header"><h2>访问密码</h2></div>
            <div class="modal-body">
                <form id="change-password-form" class="form-grid">
                    <div class="form-group span-two"><label for="current-password">当前密码</label><input type="password" id="current-password" name="currentPassword" placeholder="请输入当前密码"></div>
                    <div class="form-group span-two"><label for="new-password-change">新密码</label><input type="password" id="new-password-change" name="newPassword" placeholder="请输入新密码"></div>
                    <div class="form-group span-two"><label for="confirm-password">确认新密码</label><input type="password" id="confirm-password" name="confirmPassword" placeholder="请再次输入新密码"></div>
                </form>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <div class="form-group span-two"><label>操作</label><button type="button" class="btn btn-danger" id="logout-button">退出登录</button></div>
            </div>
        </div>`;
    }

    // 创建并初始化设置模态框与事件
    function createModalAndEvents() {
        if (document.getElementById('settings-modal')) return;

        const modalHTML = `
            <div id="settings-modal" class="modal">
                <div class="modal-content">
                    <button class="close-button">&times;</button>
                    <div id="settings-nav">
                        <h3>设置</h3>
                        <a href="#" class="settings-nav-item active" data-target="content-add-link">添加链接</a>
                        <a href="#" class="settings-nav-item" data-target="content-bulk-add">批量添加</a>
                        <a href="#" class="settings-nav-item" data-target="content-manage-links">链接管理</a>
                        <a href="#" class="settings-nav-item" data-target="content-site-settings">站点设置</a>
                        <a href="#" class="settings-nav-item" data-target="content-style-settings">外观设置</a>
                        <a href="#" class="settings-nav-item" data-target="content-advanced-settings">高级设置</a>
                        <a href="#" class="settings-nav-item" data-target="content-password-settings">访问密码</a>
                    </div>
                    <div id="settings-content">
                        ${_getSiteSettingsHTML()}
                        ${_getStyleSettingsHTML()}
                        ${_getAdvancedSettingsHTML()}
                        ${_getAddLinkHTML()}
                        ${_getBulkAddHTML()}
                        ${_getManageLinksHTML()}
                        ${_getPasswordSettingsHTML()}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary cancel-button">取消</button>
                        <button type="button" class="btn btn-primary" id="settings-save-button">保存</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        feather.replace();
        
        const modal = document.getElementById('settings-modal');

        modal.querySelector('.close-button').addEventListener('click', () => App.modal.close());
        modal.querySelector('.cancel-button').addEventListener('click', () => App.modal.close());
        modal.addEventListener('click', (event) => {
            if (event.target === modal) App.modal.close();
        });

        document.getElementById('settings-save-button')?.addEventListener('click', handleSave);
        document.getElementById('logout-button')?.addEventListener('click', () => {
            App.auth.logout();
            App.modal.close();
        });

        bindUploadButton('upload-site-icon-button', 'site-icon-file-input', 'site-icon');
        bindUploadButton('upload-avatar-button', 'avatar-file-input', 'avatar-url');
        bindUploadButton('upload-background-button', 'background-file-input', 'background-url');
        bindUploadButton('upload-icon-button', 'icon-file-input', 'link-icon');

        const navItems = modal.querySelectorAll('.settings-nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = item.getAttribute('data-target');
                if(targetId){
                    switchPanel(targetId);
                }
            });
        });
        
        updateSliderValue('background-blur', 'background-blur-value');
        updateSliderValue('cards-per-row', 'cards-per-row-value');

    }

    // 切换设置模态框中的主内容面板
    function switchPanel(targetId) {
        lastActivePanelId = targetId;
        const modal = document.getElementById('settings-modal');
        modal.querySelectorAll('.settings-nav-item').forEach(nav => nav.classList.remove('active'));
        modal.querySelectorAll('.settings-content-panel').forEach(panel => panel.classList.remove('active'));

        modal.querySelector(`.settings-nav-item[data-target="${targetId}"]`)?.classList.add('active');
        modal.querySelector(`#${targetId}`)?.classList.add('active');

        if (targetId === 'content-manage-links') {
            const container = document.getElementById('link-management-body');
            App.manage.loadAndRender(container);
        }
    }

    // 从后端加载设置数据并显示模态框
    async function loadAndShow(initialPanelId) {
        createModalAndEvents();

        const panelToShow = initialPanelId || lastActivePanelId;

        const openSettingsPanel = async () => {
            try {
                if (Object.keys(originalSettings).length === 0) {
                    const data = await App.api.request('/api/settings');
                    originalSettings = data;
                }

                App.helpers.setFormValue('site-name', originalSettings.siteName);
                App.helpers.setFormValue('site-icon', originalSettings.siteIcon);
                App.helpers.setFormValue('site-title', originalSettings.siteTitle);
                App.helpers.setFormValue('avatar-url', originalSettings.avatarURL);
                App.helpers.setFormValue('background-url', originalSettings.backgroundURL);
                App.helpers.setFormValue('background-blur', originalSettings.backgroundBlur);
                App.helpers.setFormValue('cards-per-row', originalSettings.cardsPerRow);
                App.helpers.setFormValue('custom-css', originalSettings.customCSS);
                App.helpers.setFormValue('external-js', (originalSettings.externalJS || []).join('\n'));
                
                updateSliderValue('background-blur', 'background-blur-value');
                updateSliderValue('cards-per-row', 'cards-per-row-value');

                App.modal.open('settings-modal');
                switchPanel(panelToShow);
            } catch (error) {
                if (error.message !== 'Unauthorized') {
                    console.error('Error loading settings:', error);
                    App.toast.show('配置加载失败', 'error');
                }
            }
        };

        if (App.auth.isAuthenticated()) {
            openSettingsPanel();
        } else {
            App.auth.checkAuthStatus(openSettingsPanel);
        }
    }

    // 根据当前激活的面板处理保存操作
    function handleSave() {
        const activePanel = document.querySelector('#settings-modal .settings-content-panel.active');
        if (!activePanel) return;

        switch (activePanel.id) {
            case 'content-site-settings':
            case 'content-style-settings':
            case 'content-advanced-settings':
                saveSiteSettings();
                break;
            case 'content-add-link':
                App.links.saveSingle();
                break;
            case 'content-bulk-add':
                App.links.saveBulk();
                break;
            case 'content-manage-links':
                App.manage.saveChanges().then(success => {
                    if (success) App.modal.close();
                });
                break;
            case 'content-password-settings':
                handleChangePassword();
                break;
        }
    }

    // 处理密码修改。若表单为空则关闭面板；若校验失败则不关闭；若成功则关闭。
    async function handleChangePassword() {
        const currentPasswordInput = document.getElementById('current-password');
        const newPasswordInput = document.getElementById('new-password-change');
        const confirmPasswordInput = document.getElementById('confirm-password');
    
        const currentPassword = currentPasswordInput.value;
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        if (!currentPassword && !newPassword && !confirmPassword) {
            App.modal.close();
            return;
        }
    
        const inputs = [currentPasswordInput, newPasswordInput, confirmPasswordInput];
        let allFieldsFilled = true;
    
        inputs.forEach(input => {
            input.classList.remove('input-error');
            if (!input.value) {
                input.classList.add('input-error');
                allFieldsFilled = false;
            }
        });
    
        if (!allFieldsFilled) {
            App.toast.show('所有字段均为必填项', 'error');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            App.toast.show('新密码和确认密码不匹配', 'error');
            newPasswordInput.classList.add('input-error');
            confirmPasswordInput.classList.add('input-error');
            return;
        }
    
        try {
            const data = await App.api.request('/api/auth/passwd', {
                method: 'POST',
                body: JSON.stringify({ currentPassword, newPassword })
            });
            if (data.success) {
                App.toast.show('密码修改成功', 'success');
                App.modal.close();
            } else {
                throw new Error(data.message || '密码修改失败');
            }
        } catch (error) {
            App.toast.show(error.message, 'error');
            console.error('Error changing password:', error);
        }
    }
    
    // 保存网站设置
    async function saveSiteSettings() {
        const activePanel = document.querySelector('#settings-modal .settings-content-panel.active');
        if (!activePanel) return;

        const getValue = (id, defaultValue = '') => document.getElementById(id)?.value || defaultValue;
        const getIntValue = (id, defaultValue) => parseInt(getValue(id, defaultValue), 10) || 0;
        const getLinesValue = (id) => getValue(id).split('\n').filter(line => line.trim() !== '');

        let currentValues = {};
        const formFields = activePanel.querySelectorAll('input, textarea');
        
        formFields.forEach(field => {
            const key = field.name;
            if (key) {
                switch (field.type) {
                    case 'range':
                        currentValues[key] = getIntValue(field.id, field.defaultValue);
                        break;
                    case 'textarea':
                         if (key === 'externalJS') {
                            currentValues[key] = getLinesValue(field.id);
                        } else {
                            currentValues[key] = getValue(field.id);
                        }
                        break;
                    default:
                        currentValues[key] = getValue(field.id);
                }
            }
        });

        const updates = {};
        for (const key in currentValues) {
            const original = originalSettings[key] || (Array.isArray(currentValues[key]) ? [] : '');
            if (JSON.stringify(original) !== JSON.stringify(currentValues[key])) {
                updates[key] = currentValues[key];
            }
        }

        if (Object.keys(updates).length === 0) {
            App.modal.close();
            return;
        }

        try {
            const data = await App.api.request('/api/settings', {
                method: 'PATCH',
                body: JSON.stringify(updates)
            });

            if (data.status !== 'success') throw new Error(data.message || '保存失败');
            
            App.toast.show('配置保存成功', 'success');

            originalSettings = { ...originalSettings, ...updates };
            apply(originalSettings);
            document.dispatchEvent(new CustomEvent('settings-updated', { detail: originalSettings }));
            
            App.modal.close();
        } catch (error) {
            App.toast.show('配置保存失败', 'error');
            console.error('Error saving settings:', error);
        }
    }

    // 将设置实时应用到页面上
    function apply(settings) {
        document.title = settings.siteName || '';
        const siteTitleElement = document.querySelector('.site-title');
        if (siteTitleElement) {
            siteTitleElement.textContent = settings.siteTitle || '';
        }

        const avatarElement = document.querySelector('.avatar');
        if (avatarElement) {
            avatarElement.src = settings.avatarURL ? settings.avatarURL : 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
            avatarElement.style.display = settings.avatarURL ? 'block' : 'none';
        }

        let favicon = document.querySelector('link[rel="icon"]');
        if (!favicon) {
            favicon = document.createElement('link');
            favicon.rel = 'icon';
            document.head.appendChild(favicon);
        }
        favicon.href = settings.siteIcon || '/favicon.ico';

        if (settings.backgroundURL) {
            const img = new Image();
            img.onload = () => {
                document.documentElement.style.setProperty('--background-url', `url(${settings.backgroundURL})`);
                document.documentElement.style.setProperty('--background-opacity', 1);
            };
            img.src = settings.backgroundURL;
        } else {
            document.documentElement.style.setProperty('--background-opacity', 0);
        }

        document.documentElement.style.setProperty('--background-blur', `${settings.backgroundBlur || 0}px`);
        document.documentElement.style.setProperty('--cards-per-row', settings.cardsPerRow || 4);

        let customCSSStyle = document.getElementById('custom-css-style');
        if (!customCSSStyle) {
            customCSSStyle = document.createElement('style');
            customCSSStyle.id = 'custom-css-style';
            document.head.appendChild(customCSSStyle);
        }
        customCSSStyle.innerHTML = settings.customCSS || '';

        App.helpers.updateCardOverflow();
    }

    // 自动为设置按钮绑定点击事件
    document.addEventListener('DOMContentLoaded', () => {
        document.getElementById('settings-button')?.addEventListener('click', () => loadAndShow());
    });

    return { loadAndShow, apply };
})();
