// 定义全局 App 命名空间
window.App = window.App || {};

// 设置模块
App.settings = (function () {

    // 记录上次打开的面板ID
    let lastActivePanelId = 'content-add-link';
    // 存储从服务器加载的原始设置
    let originalSettings = {};
    // 缓存链接列表用于编辑
    let linksForEditing = [];
    // 当前正在编辑的链接ID
    let currentEditingLinkId = null;

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

    // 注入可搜索下拉框所需的样式
    function _injectSearchableSelectStyles() {
        const styleId = 'searchable-select-styles';
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
            .searchable-select-wrapper {
                position: relative;
            }
            #edit-link-search-results {
                display: none;
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                max-height: 280px;
                overflow-y: auto;
                background: #fff;
                border: 1px solid #ced4da;
                border-top: none;
                border-radius: 0 0 8px 8px;
                z-index: 1051;
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            }
            .searchable-select-wrapper.active #edit-link-search-results {
                display: block;
            }
            .search-result-item {
                padding: 8px 12px;
                cursor: pointer;
                border-bottom: 1px solid #eee;
            }
            .search-result-item:last-child {
                border-bottom: none;
            }
            .search-result-item:hover {
                background-color: #e9ecef;
            }
            .search-result-item .top-row, .search-result-item .bottom-row {
                display: flex;
                align-items: center;
                width: 100%;
                overflow: hidden;
            }
            .search-result-item .top-row {
                justify-content: space-between;
                margin-bottom: 5px;
                gap: 15px;
            }
            .search-result-item .title {
                font-weight: 500;
                color: #212529;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                flex-shrink: 1;
            }
            .search-result-item .url {
                color: #888;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                flex-shrink: 0;
                font-size: 0.9em;
            }
            .search-result-item .bottom-row {
                font-size: 0.8em;
                color: #6c757d;
                gap: 6px;
            }
            .search-result-item .separator {
                color: #b0b0b0;
            }
            .search-result-item .panel {
                font-weight: 600;
                padding: 2px 6px;
                border-radius: 4px;
                color: #fff !important;
                white-space: nowrap;
            }
            .search-result-item .panel.primary {
                background-color: #007bff;
            }
            .search-result-item .panel.secondary {
                background-color: #6c757d;
            }
            .search-result-item .category {
                font-style: italic;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
        `;
        document.head.appendChild(style);
    }

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

    function _getEditLinkHTML() {
        return `
        <div id="content-edit-link" class="settings-content-panel">
            <div class="modal-header"><h2>编辑链接</h2></div>
            <div class="modal-body">
                <form id="edit-link-form" class="form-grid">
                    <div class="form-group span-two searchable-select-wrapper">
                        <label for="edit-link-search-input">搜索并选择链接</label>
                        <input type="text" id="edit-link-search-input" placeholder="搜索标题、URL、分类..." autocomplete="off">
                        <div id="edit-link-search-results"></div>
                    </div>
                    <div class="form-group"><label for="edit-link-title">标题*</label><input type="text" id="edit-link-title" name="title" required disabled></div>
                    <div class="form-group"><label for="edit-link-url">链接*</label><input type="url" id="edit-link-url" name="url" required disabled></div>
                    <div class="form-group"><label for="edit-link-category">分类</label><input type="text" id="edit-link-category" name="category" disabled></div>
                    <div class="form-group"><label for="edit-link-icon">图标</label><div class="input-with-button"><input type="text" id="edit-link-icon" name="icon" disabled><button type="button" id="upload-edit-icon-button" class="btn icon-button" disabled><i data-feather="upload"></i></button><input type="file" id="edit-icon-file-input" class="hidden-file-input" accept="image/*"></div></div>
                    <div class="form-group span-two"><label for="edit-link-description">描述</label><textarea id="edit-link-description" name="description" disabled></textarea></div>
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

    function _getCategoryManagementHTML() {
        return `
        <div id="content-category-management" class="settings-content-panel">
            <div class="modal-header"><h2>分类管理</h2></div>
            <div class="modal-body" id="category-management-body"></div>
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

        _injectSearchableSelectStyles();

        const modalHTML = `
            <div id="settings-modal" class="modal">
                <div class="modal-content">
                    <button class="close-button">&times;</button>
                    <div id="settings-nav">
                        <h3>设置</h3>
                        <a href="#" class="settings-nav-item active" data-target="content-add-link">添加链接</a>
                        <a href="#" class="settings-nav-item" data-target="content-bulk-add">批量添加</a>
                        <a href="#" class="settings-nav-item" data-target="content-edit-link">编辑链接</a>
                        <a href="#" class="settings-nav-item" data-target="content-category-management">分类管理</a>
                        <a href="#" class="settings-nav-item" data-target="content-site-settings">站点设置</a>
                        <a href="#" class="settings-nav-item" data-target="content-style-settings">外观设置</a>
                        <a href="#" class="settings-nav-item" data-target="content-advanced-settings">高级设置</a>
                        <a href="#" class="settings-nav-item" data-target="content-password-settings">访问密码</a>
                    </div>
                    <div id="settings-content">
                        ${_getAddLinkHTML()}
                        ${_getBulkAddHTML()}
                        ${_getEditLinkHTML()}
                        ${_getCategoryManagementHTML()}
                        ${_getSiteSettingsHTML()}
                        ${_getStyleSettingsHTML()}
                        ${_getAdvancedSettingsHTML()}
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
            location.reload();
        });

        bindUploadButton('upload-site-icon-button', 'site-icon-file-input', 'site-icon');
        bindUploadButton('upload-avatar-button', 'avatar-file-input', 'avatar-url');
        bindUploadButton('upload-background-button', 'background-file-input', 'background-url');
        bindUploadButton('upload-icon-button', 'icon-file-input', 'link-icon');
        bindUploadButton('upload-edit-icon-button', 'edit-icon-file-input', 'edit-link-icon');

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

        const searchInput = document.getElementById('edit-link-search-input');
        const searchWrapper = searchInput?.closest('.searchable-select-wrapper');
        const searchResults = document.getElementById('edit-link-search-results');

        if (searchInput && searchWrapper && searchResults) {
            searchInput.addEventListener('input', filterAndPopulateResults);
            searchInput.addEventListener('focus', () => {
                searchWrapper.classList.add('active');
                filterAndPopulateResults();
            });

            document.addEventListener('click', (e) => {
                if (!searchWrapper.contains(e.target)) {
                    searchWrapper.classList.remove('active');
                }
            }, true);

            searchResults.addEventListener('click', (e) => {
                const item = e.target.closest('.search-result-item');
                if (item) {
                    const linkId = item.dataset.id;
                    handleLinkSelectionChange(linkId);
                    searchWrapper.classList.remove('active');
                }
            });
        }
    }

    // 切换设置模态框中的主内容面板
    function switchPanel(targetId) {
        lastActivePanelId = targetId;
        const modal = document.getElementById('settings-modal');
        modal.querySelectorAll('.settings-nav-item').forEach(nav => nav.classList.remove('active'));
        modal.querySelectorAll('.settings-content-panel').forEach(panel => panel.classList.remove('active'));

        modal.querySelector(`.settings-nav-item[data-target="${targetId}"]`)?.classList.add('active');
        modal.querySelector(`#${targetId}`)?.classList.add('active');

        if (targetId === 'content-category-management') {
            const container = document.getElementById('category-management-body');
            App.categories.loadAndRender(container);
        } else if (targetId === 'content-edit-link') {
            loadLinksForEditing();
        }
    }

    // 使编辑链接的缓存失效
    function invalidateLinksCache() {
        linksForEditing = [];
    }

    // 为编辑链接面板加载并扁平化链接列表
    async function loadLinksForEditing() {
        const searchInput = document.getElementById('edit-link-search-input');
        const resultsContainer = document.getElementById('edit-link-search-results');
        if (!searchInput || !resultsContainer) return;

        toggleEditForm(false);
        searchInput.value = '';
        currentEditingLinkId = null;

        if (linksForEditing.length > 0) {
            filterAndPopulateResults();
            return;
        }

        resultsContainer.innerHTML = '<div class="search-result-item">正在加载...</div>';

        try {
            const panelsToRender = await App.api.request('/api/links');
            const flatLinks = [];

            if (panelsToRender && typeof panelsToRender === 'object' && !Array.isArray(panelsToRender)) {
                for (const panelName in panelsToRender) {
                    const categories = panelsToRender[panelName];
                    if (Array.isArray(categories)) {
                        categories.forEach(category => {
                            if (category.links && Array.isArray(category.links)) {
                                category.links.forEach(link => {
                                    flatLinks.push({
                                        id: link.id,
                                        title: link.title || '',
                                        url: link.url || '',
                                        panel: panelName,
                                        category: category.name || '',
                                        icon: link.icon_url || '',
                                        description: link.desc || ''
                                    });
                                });
                            }
                        });
                    }
                }
            }
            
            flatLinks.sort((a, b) => a.title.localeCompare(b.title));
            linksForEditing = flatLinks;
            filterAndPopulateResults();

        } catch (error) {
            if (error.message !== 'Unauthorized') {
                console.error('Error loading links for editing:', error);
                resultsContainer.innerHTML = '<div class="search-result-item">加载失败</div>';
                App.toast.show('加载链接列表失败', 'error');
            }
        }
    }
    
    // 筛选并填充链接搜索结果
    function filterAndPopulateResults() {
        const searchTerm = document.getElementById('edit-link-search-input').value.toLowerCase();
        const resultsContainer = document.getElementById('edit-link-search-results');
        
        const filteredLinks = linksForEditing.filter(link => {
            return (link.title.toLowerCase().includes(searchTerm) ||
                    link.url.toLowerCase().includes(searchTerm) ||
                    link.category.toLowerCase().includes(searchTerm));
        });

        resultsContainer.innerHTML = '';
        if (filteredLinks.length > 0) {
            filteredLinks.forEach(link => {
                const item = document.createElement('div');
                item.className = 'search-result-item';
                item.dataset.id = link.id;

                const panelKey = (link.panel || '').toLowerCase();
                const categoryText = link.category || '未分类';
                let panelHTML = '';

                if (panelKey === 'primary') {
                    panelHTML = `<span class="panel primary">主面板</span>`;
                } else if (panelKey === 'secondary') {
                    panelHTML = `<span class="panel secondary">副面板</span>`;
                }

                item.innerHTML = `
                    <div class="top-row">
                        <span class="title" title="${App.helpers.escapeHTML(link.title)}">${App.helpers.escapeHTML(link.title)}</span>
                        <span class="url" title="${App.helpers.escapeHTML(link.url)}">${App.helpers.escapeHTML(link.url)}</span>
                    </div>
                    <div class="bottom-row">
                        ${panelHTML}
                        ${panelHTML ? '<span class="separator">-</span>' : ''}
                        <span class="category">${App.helpers.escapeHTML(categoryText)}</span>
                    </div>
                `;
                resultsContainer.appendChild(item);
            });
        } else {
            resultsContainer.innerHTML = '<div class="search-result-item">无匹配结果</div>';
        }
    }

    // 在用户从搜索结果中选择链接后，填充表单
    function handleLinkSelectionChange(selectedId) {
        const link = linksForEditing.find(l => l.id === selectedId);
        if (link) {
            currentEditingLinkId = selectedId;
            document.getElementById('edit-link-search-input').value = link.title;

            App.helpers.setFormValue('edit-link-title', link.title);
            App.helpers.setFormValue('edit-link-url', link.url);
            App.helpers.setFormValue('edit-link-category', link.category);
            App.helpers.setFormValue('edit-link-icon', link.icon);
            App.helpers.setFormValue('edit-link-description', link.description);
            
            toggleEditForm(true);
        } else {
            toggleEditForm(false);
        }
    }

    // 切换编辑表单的禁用状态
    function toggleEditForm(isEnabled) {
        const form = document.getElementById('edit-link-form');
        if (!form) return;

        const elements = form.querySelectorAll('input, textarea, button');
        elements.forEach(el => {
            if (el.id !== 'edit-link-search-input') {
                el.disabled = !isEnabled;
            }
        });

        if (!isEnabled) {
            currentEditingLinkId = null;
            const fieldsToReset = ['edit-link-title', 'edit-link-url', 'edit-link-category', 'edit-link-icon', 'edit-link-description'];
            fieldsToReset.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });
        }
    }

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
                if (error.message === 'Unauthorized') {
                    App.auth.handleUnauthorized();
                } else {
                    console.error('Error loading settings:', error);
                    App.toast.show('配置加载失败，请刷新页面重试', 'error');
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
            case 'content-edit-link':
                saveEditedLink();
                break;
            case 'content-bulk-add':
                App.links.saveBulk();
                break;
            case 'content-category-management':
                App.categories.saveChanges();
                break;
            case 'content-password-settings':
                handleChangePassword();
                break;
        }
    }
    
    // 保存编辑后的链接
    async function saveEditedLink() {
        if (!currentEditingLinkId) {
            App.toast.show('请先从列表中搜索并选择一个链接', 'warning');
            return;
        }

        const title = App.helpers.getFormValue('edit-link-title');
        const url = App.helpers.getFormValue('edit-link-url');

        if (!title || !url) {
            App.toast.show('标题和 URL 是必填项', 'error');
            return;
        }
        
        const payload = {
            title: title,
            url: url,
            category: App.helpers.getFormValue('edit-link-category'),
            icon_url: App.helpers.getFormValue('edit-link-icon'),
            desc: App.helpers.getFormValue('edit-link-description'),
        };

        try {
            const response = await App.api.request(`/api/links/${currentEditingLinkId}`, {
                method: 'PATCH',
                body: JSON.stringify(payload)
            });
            if (response.status === 'success') {
                App.toast.show('链接已成功更新', 'success');
                document.dispatchEvent(new CustomEvent('links-updated'));
                if (App.categories && App.categories.invalidateCache) {
                    App.categories.invalidateCache();
                }
                App.modal.close();
            } else {
                throw new Error(response.message || '更新失败');
            }
        } catch (error) {
            App.toast.show(`链接更新失败: ${error.message}`, 'error');
            console.error('Error updating link:', error);
        }
    }

    // 处理密码修改
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
                App.toast.show('密码已更新，下次请使用新密码登录', 'success');
                App.modal.close();
            } else {
                throw new Error(data.message || '密码修改失败');
            }
        } catch (error) {
            App.toast.show(`密码修改失败: ${error.message}`, 'error');
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
            
            App.toast.show('设置已保存，部分更改可能需要刷新页面生效', 'success');

            originalSettings = { ...originalSettings, ...updates };
            apply(originalSettings);
            document.dispatchEvent(new CustomEvent('settings-updated', { detail: originalSettings }));
            
            App.modal.close();
        } catch (error) {
            App.toast.show('设置保存失败，请检查网络并重试', 'error');
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

    // 监听全局的 links-updated 事件，以便在链接数据发生变更时清空缓存
    document.addEventListener('links-updated', invalidateLinksCache);

    return { loadAndShow, apply };
})();
