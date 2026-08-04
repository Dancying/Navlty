window.App = window.App || {};

App.settings = (function () {
    let lastActivePanelId = 'content-add-link';
    let originalSettings = {};
    let uniqueCategories = [];

    // initSearchableSelect 初始化一个可搜索的下拉选择框
    function initSearchableSelect(config) {
        const { inputId, resultsId, source, renderItem, onSelect } = config;
        const input = document.getElementById(inputId);
        const resultsContainer = document.getElementById(resultsId);
        const wrapper = input.closest('.searchable-select-wrapper');

        if (!input || !resultsContainer || !wrapper) return;

        const populateResults = () => {
            const searchTerm = input.value.toLowerCase();
            const items = source();
            const filtered = items.filter(item => 
                JSON.stringify(item).toLowerCase().includes(searchTerm)
            );

            resultsContainer.innerHTML = '';
            if (filtered.length > 0) {
                filtered.forEach(item => {
                    resultsContainer.insertAdjacentHTML('beforeend', renderItem(item));
                });
            } else {
                resultsContainer.innerHTML = '<div class="search-result-item">无匹配结果</div>';
            }
        };

        input.addEventListener('input', populateResults);
        input.addEventListener('focus', () => {
            if (input.disabled) return;
            wrapper.classList.add('active');
            populateResults();
        });

        resultsContainer.addEventListener('click', (e) => {
            const itemElement = e.target.closest('.search-result-item');
            if (itemElement && itemElement.dataset.id) {
                onSelect(itemElement.dataset.id);
                wrapper.classList.remove('active');
            }
        });
    }

    // bindUploadButton 绑定上传按钮和文件输入框
    function bindUploadButton(buttonId, inputId, targetId) {
        const button = document.getElementById(buttonId);
        const input = document.getElementById(inputId);
        if (!button || !input) return;

        button.addEventListener('click', () => input.click());

        input.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (!file) return;

            try {
                const base64String = await App.helpers.fileToBase64(file);
                const targetInput = document.getElementById(targetId);
                if (targetInput) {
                    targetInput.value = base64String;
                }
                App.toast.show('文件加载成功', 'success');
            } catch (error) {
                console.error('File could not be read:', error);
                App.toast.show(error.message || '文件加载失败', 'error');
            }
        });
    }
    
    // updateSliderValue 更新滑块值的显示
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

    // createModalAndEvents 创建并初始化设置模态框与事件
    function createModalAndEvents() {
        if (document.getElementById('settings-modal')) return;

        const modalHTML = `
            <div id="settings-modal" class="modal">
                <div class="modal-content">
                    <button class="close-button">&times;</button>
                    <div id="settings-nav"></div>
                    <div id="settings-content"></div>
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
        const navContainer = document.getElementById('settings-nav');
        const contentContainer = document.getElementById('settings-content');

        App.config.settingsNavigation.forEach(item => {
            const navLink = document.createElement('a');
            navLink.href = '#';
            navLink.className = 'settings-nav-item';
            navLink.dataset.target = item.target;
            navLink.textContent = item.name;
            navContainer.appendChild(navLink);

            const panelName = item.target.replace('content-', '')
                .split('-')
                .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                .join('');
            const functionName = `get${panelName}HTML`;

            if (typeof App.views[functionName] === 'function') {
                contentContainer.insertAdjacentHTML('beforeend', App.views[functionName]());
            }
        });

        modal.querySelector('.close-button').addEventListener('click', () => App.modal.close('settings-modal'));
        modal.querySelector('.cancel-button').addEventListener('click', () => App.modal.close('settings-modal'));
        modal.addEventListener('click', (event) => {
            if (event.target === modal) App.modal.close('settings-modal');
        });

        document.getElementById('settings-save-button')?.addEventListener('click', handleSave);
        document.getElementById('logout-button')?.addEventListener('click', () => {
            App.auth.logout();
            App.modal.close('settings-modal');
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

        initSearchableSelect({
            inputId: 'edit-link-search-input',
            resultsId: 'edit-link-search-results',
            source: () => App.finder.getLinksForEditing(),
            renderItem: App.finder.renderLinkItem,
            onSelect: (id) => App.finder.handleLinkSelectionChange(id)
        });

        const categoryRenderItem = (item) => {
            const name = App.helpers.escapeHTML(item.name);
            const match = name.match(/^(.*) \((主面板|副面板)\)$/);

            if (match) {
                const categoryName = match[1].trim();
                const panelName = match[2];
                const panelKey = panelName === '主面板' ? 'primary' : 'secondary';
                const panelHTML = `<span class="item-panel-badge ${panelKey}">${panelName}</span>`;

                return (
                    `<div class="search-result-item" data-id="${App.helpers.escapeHTML(item.id)}">
                        <div class="top-row">
                            <span class="title">${categoryName}</span>
                            <div class="badges-container">
                                ${panelHTML}
                            </div>
                        </div>
                    </div>`
                );
            }
            return (
                `<div class="search-result-item" data-id="${App.helpers.escapeHTML(item.id)}">
                    <span class="title">${name}</span>
                </div>`
            );
        };

        const onCategorySelect = (inputId, targetPanelId) => (id) => {
            const input = document.getElementById(inputId);
            const targetPanelInput = document.getElementById(targetPanelId);
            if (!input || !targetPanelInput) return;
        
            const match = id.match(/^(.*) \((主面板|副面板)\)$/);
            if (match) {
                const categoryName = match[1].trim();
                const panelName = match[2];
                const panelKey = panelName === '主面板' ? 'primary' : 'secondary';
                input.value = categoryName;
                targetPanelInput.value = panelKey;
            } else {
                input.value = id;
            }
        };

        const categoryConfig = {
            source: () => uniqueCategories.map(cat => ({ id: cat, name: cat })), 
            renderItem: categoryRenderItem,
        };

        initSearchableSelect({
            ...categoryConfig,
            inputId: 'link-category',
            resultsId: 'link-category-results',
            onSelect: onCategorySelect('link-category', 'add-link-target-panel'),
        });

        initSearchableSelect({
            ...categoryConfig,
            inputId: 'edit-link-category',
            resultsId: 'edit-link-category-results',
            onSelect: onCategorySelect('edit-link-category', 'edit-link-target-panel'),
        });

        document.addEventListener('click', (e) => {
            document.querySelectorAll('.searchable-select-wrapper.active').forEach(wrapper => {
                if (!wrapper.contains(e.target)) {
                    wrapper.classList.remove('active');
                }
            });
        }, true);
    }

    // switchPanel 切换设置模态框中的主内容面板
    async function switchPanel(targetId) {
        lastActivePanelId = targetId;
        const modal = document.getElementById('settings-modal');
        modal.querySelectorAll('.settings-nav-item').forEach(nav => nav.classList.remove('active'));
        modal.querySelectorAll('.settings-content-panel').forEach(panel => panel.classList.remove('active'));

        modal.querySelector(`.settings-nav-item[data-target="${targetId}"]`)?.classList.add('active');
        const activePanel = modal.querySelector(`#${targetId}`);
        if (activePanel) activePanel.classList.add('active');

        if (targetId === 'content-add-link') {
            const targetPanelInput = document.getElementById('add-link-target-panel');
            if (targetPanelInput) {
                targetPanelInput.value = App.actions.getActivePanel ? App.actions.getActivePanel() : 'primary';
            }
        }

        if (targetId === 'content-category-management') {
            const container = document.getElementById('category-management-body');
            App.editor.loadAndRender(container);
        } else if (targetId === 'content-edit-link' || targetId === 'content-add-link') {
            if (targetId === 'content-edit-link') {
                 App.finder.loadLinksForEditing();
            }
            try {
                const panelsToRender = await App.cache.fetchLinks();
                const flatLinks = [];
                if (panelsToRender && typeof panelsToRender === 'object') {
                    for (const panelName in panelsToRender) {
                        const categories = panelsToRender[panelName];
                        if (Array.isArray(categories)) {
                            categories.forEach(category => {
                                if (category.links && Array.isArray(category.links)) {
                                    category.links.forEach(link => {
                                        flatLinks.push({ ...link, panel: panelName, category: category.name || '' });
                                    });
                                }
                            });
                        }
                    }
                }
                
                const categorySet = new Set();
                flatLinks.forEach(l => {
                    if (l.category) {
                        const panelLabel = l.panel === 'primary' ? '主面板' : '副面板';
                        categorySet.add(`${l.category} (${panelLabel})`);
                    }
                });
                uniqueCategories = [...categorySet];
                if(activePanel.classList.contains('active')){
                    const input = activePanel.querySelector('.searchable-select-wrapper input');
                    if(input && document.activeElement === input) {
                        input.dispatchEvent(new Event('focus'));
                    }
                }
            } catch (error) {
                if (error.message !== 'Unauthorized') {
                     console.error(`Failed to populate categories for ${targetId} form:`, error);
                }
            }
        }
    }

    // loadAndShow 加载并显示设置模态框
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
                App.helpers.setFormValue('top-content', originalSettings.topContent);
                App.helpers.setFormValue('bottom-content', originalSettings.bottomContent);
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

    // handleSave 根据当前激活的面板处理保存操作
    function handleSave() {
        const activePanel = document.querySelector('#settings-modal .settings-content-panel.active');
        if (!activePanel) return;

        switch (activePanel.id) {
            case 'content-site-settings':
            case 'content-style-settings':
            case 'content-advanced-settings':
                App.actions.saveSettings();
                break;
            case 'content-add-link':
            case 'content-bulk-add':
                App.actions.addLinks();
                break;
            case 'content-edit-link':
                App.actions.updateLink();
                break;
            case 'content-category-management':
                const { initialLinks, currentLinks } = App.editor.getLinkData();
                App.actions.updateStructure(initialLinks, currentLinks);
                break;
            case 'content-password-settings':
                App.actions.changePassword();
                break;
        }
    }

    // get 获取原始设置
    function get() {
        return originalSettings;
    }

    // update 更新原始设置
    function update(newSettings) {
        originalSettings = { ...originalSettings, ...newSettings };
    }

    return { 
        loadAndShow,
        get,
        update
    };
})();
