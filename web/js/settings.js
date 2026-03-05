// 定义全局 App 命名空间
window.App = window.App || {};

// 设置模块
App.settings = (function () {

    // 辅助函数：绑定上传按钮和文件输入框
    function bindUploadButton(buttonId, inputId, targetId) {
        const button = document.getElementById(buttonId);
        const input = document.getElementById(inputId);
        if (button && input) {
            button.addEventListener('click', () => input.click());
            input.addEventListener('change', () => App.helpers.fileToBase64(input, targetId));
        }
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
                        <a href="#" class="settings-nav-item active" data-target="content-site-settings">网站设置</a>
                        <a href="#" class="settings-nav-item" data-target="content-add-link">添加链接</a>
                        <a href="#" class="settings-nav-item" data-target="content-manage-links">链接管理</a>
                    </div>
                    <div id="settings-content">
                        <!-- Site Settings -->
                        <div id="content-site-settings" class="settings-content-panel active">
                             <div class="modal-header">
                                <h2>网站设置</h2>
                            </div>
                            <div class="modal-body">
                                <form id="settings-form">
                                    <div class="tab-switcher">
                                        <button type="button" class="tab-button active" data-tab="general-settings-tab">常规</button>
                                        <button type="button" class="tab-button" data-tab="style-settings-tab">样式</button>
                                        <button type="button" class="tab-button" data-tab="advanced-settings-tab">高级</button>
                                    </div>
                                    <div class="tab-content-container">
                                        <div id="general-settings-tab" class="tab-content active">
                                            <div class="form-grid" style="margin-top: 1.5rem;">
                                                <div class="form-group">
                                                    <label for="site-name">站点名称</label>
                                                    <input type="text" id="site-name" name="siteName" placeholder="显示在标签页的名称">
                                                </div>
                                                <div class="form-group">
                                                    <label for="site-icon">站点图标</label>
                                                    <div class="input-with-button">
                                                        <input type="text" id="site-icon" name="siteIcon" placeholder="Feather 图标名、URL 或 Base64">
                                                        <button type="button" id="upload-site-icon-button" class="btn icon-button"><i data-feather="upload"></i></button>
                                                        <input type="file" id="site-icon-file-input" class="hidden-file-input" accept="image/*">
                                                    </div>
                                                </div>
                                                <div class="form-group">
                                                    <label for="site-title">网站标题</label>
                                                    <input type="text" id="site-title" name="siteTitle" placeholder="显示在主页的标题">
                                                </div>
                                                <div class="form-group">
                                                    <label for="avatar-url">网站头像</label>
                                                    <div class="input-with-button">
                                                        <input type="text" id="avatar-url" name="avatarURL" placeholder="Feather 图标名、URL 或 Base64">
                                                        <button type="button" id="upload-avatar-button" class="btn icon-button"><i data-feather="upload"></i></button>
                                                        <input type="file" id="avatar-file-input" class="hidden-file-input" accept="image/*">
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div id="style-settings-tab" class="tab-content">
                                            <div class="form-grid" style="margin-top: 1.5rem;">
                                                <div class="form-group span-two">
                                                    <label for="background-url">背景图片</label>
                                                    <div class="input-with-button">
                                                        <input type="text" id="background-url" name="backgroundURL" placeholder="图片 URL 或 Base64">
                                                        <button type="button" id="upload-background-button" class="btn icon-button"><i data-feather="upload"></i></button>
                                                        <input type="file" id="background-file-input" class="hidden-file-input" accept="image/*">
                                                    </div>
                                                </div>
                                                <div class="form-group span-two slider-group">
                                                    <label for="background-blur">背景模糊: <span id="background-blur-value">5</span>px</label>
                                                    <input type="range" id="background-blur" name="backgroundBlur" min="0" max="20" value="5" class="slider">
                                                </div>
                                                <div class="form-group span-two slider-group">
                                                    <label for="cards-per-row">每行链接卡片数量: <span id="cards-per-row-value">4</span></label>
                                                    <input type="range" id="cards-per-row" name="cardsPerRow" min="1" max="12" value="4" class="slider">
                                                </div>
                                            </div>
                                        </div>
                                        <div id="advanced-settings-tab" class="tab-content">
                                            <div class="form-grid" style="margin-top: 1.5rem;">
                                                <div class="form-group span-two">
                                                    <label for="custom-css">外部 CSS</label>
                                                    <textarea id="custom-css" name="customCSS" rows="4" placeholder="此处输入自定义 CSS 代码"></textarea>
                                                </div>
                                                <div class="form-group span-two">
                                                    <label for="external-js">外部 JS</label>
                                                    <textarea id="external-js" name="externalJS" rows="4" placeholder="https://example.com/script.js
https://another.com/script.js"></textarea>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                        <!-- Add Link -->
                        <div id="content-add-link" class="settings-content-panel">
                            <div class="modal-header">
                                <h2>添加链接</h2>
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
                        </div>
                        <!-- Link Management -->
                        <div id="content-manage-links" class="settings-content-panel">
                            <div class="modal-header">
                                <h2>链接管理</h2>
                            </div>
                            <div class="modal-body" id="link-management-body">
                                <!-- App.manage.loadAndRender will populate this -->
                            </div>
                        </div>
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

        bindUploadButton('upload-site-icon-button', 'site-icon-file-input', 'site-icon');
        bindUploadButton('upload-avatar-button', 'avatar-file-input', 'avatar-url');
        bindUploadButton('upload-background-button', 'background-file-input', 'background-url');
        
        App.links.init(document.getElementById('content-add-link'));

        const navItems = modal.querySelectorAll('.settings-nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = item.getAttribute('data-target');
                switchPanel(targetId);
            });
        });
        
        const tabButtons = modal.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabContainer = button.closest('.tab-switcher');
                const contentContainer = button.closest('.modal-body').querySelector('.tab-content-container');

                tabContainer.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                contentContainer.querySelectorAll('.tab-content').forEach(content => {
                    content.id === button.dataset.tab ? content.classList.add('active') : content.classList.remove('active');
                });
            });
        });
    }

    // 切换设置模态框中的主内容面板
    function switchPanel(targetId) {
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
    function loadAndShow(initialPanelId = 'content-site-settings') {
        createModalAndEvents();

        const openSettingsPanel = () => {
            fetch('/api/settings')
                .then(response => {
                    if (!response.ok) throw new Error('加载设置失败');
                    return response.json();
                })
                .then(data => {
                    App.helpers.setFormValue('site-name', data.siteName);
                    App.helpers.setFormValue('site-icon', data.siteIcon);
                    App.helpers.setFormValue('site-title', data.siteTitle);
                    App.helpers.setFormValue('avatar-url', data.avatarURL);
                    App.helpers.setFormValue('background-url', data.backgroundURL);
                    App.helpers.setFormValue('background-blur', data.backgroundBlur);
                    App.helpers.setFormValue('cards-per-row', data.cardsPerRow);
                    App.helpers.setFormValue('custom-css', data.customCSS);
                    App.helpers.setFormValue('external-js', data.externalJS.join('\n'));
                    
                    App.modal.open('settings-modal');
                    switchPanel(initialPanelId);
                })
                .catch(error => {
                    console.error('Error loading settings:', error);
                    App.toast.show('配置加载失败', 'error');
                });
        };

        if (App.auth.isAuthenticated()) {
            openSettingsPanel();
        } else {
            App.auth.checkAuthStatus(openSettingsPanel);
        }
    }

    // 处理保存操作，根据当前激活的面板调用不同的保存方法
    function handleSave() {
        const activePanel = document.querySelector('#settings-modal .settings-content-panel.active');
        if (!activePanel) return;

        switch (activePanel.id) {
            case 'content-site-settings':
                saveSiteSettings();
                break;
            case 'content-add-link':
                App.links.save();
                break;
            case 'content-manage-links':
                App.manage.saveChanges();
                break;
        }
    }
    
    // 保存网站设置
    function saveSiteSettings() {
        const getValue = (id, defaultValue = '') => document.getElementById(id)?.value || defaultValue;
        const settings = {
            siteName: getValue('site-name'),
            siteIcon: getValue('site-icon'),
            siteTitle: getValue('site-title'),
            avatarURL: getValue('avatar-url'),
            backgroundURL: getValue('background-url'),
            backgroundBlur: parseInt(getValue('background-blur', '5'), 10) || 0,
            cardsPerRow: parseInt(getValue('cards-per-row', '4'), 10) || 4,
            customCSS: getValue('custom-css'),
            externalJS: getValue('external-js').split('\n').filter(line => line.trim() !== ''),
        };

        fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
        })
            .then(response => response.json())
            .then(data => {
                if (data.status !== 'success') throw new Error(data.message || '保存失败');
                App.toast.show('配置保存成功', 'success');
                App.modal.close();
                apply(settings);
                document.dispatchEvent(new CustomEvent('settings-updated', { detail: settings }));
            })
            .catch(error => {
                App.toast.show('配置保存失败', 'error');
                console.error('Error saving settings:', error);
            });
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

        App.helpers.checkDescriptionOverflow();
    }

    // 自动为设置按钮绑定点击事件
    document.addEventListener('DOMContentLoaded', () => {
        document.getElementById('settings-button')?.addEventListener('click', () => loadAndShow());
    });

    return { loadAndShow, apply };
})();
