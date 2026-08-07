window.App = window.App || {};

App.settings = (function () {
    let lastActivePanelId = 'content-add-link';
    let originalSettings = {};
    let uniqueCategories = [];
    let saveButtonVisible = false;
    let cancelButtonVisible = false;
    let hasSaved = false;
    let changeListenersBound = false;
    let modalCloseHandlerBound = false;

    // initSearchableSelect 初始化一个可搜索的下拉选择框
    function initSearchableSelect(config) {
        const { inputId, resultsId, source, renderItem, onSelect } = config;
        const input = document.getElementById(inputId);
        const resultsContainer = document.getElementById(resultsId);
        const wrapper = input.closest('.searchable-select-wrapper');

        if (!input || !resultsContainer || !wrapper) return;

        const populateResults = () => {
            const searchTerm = input.value.toLowerCase();
            const filtered = source().filter(item => JSON.stringify(item).toLowerCase().includes(searchTerm));

            resultsContainer.innerHTML = filtered.length > 0
                ? filtered.map(renderItem).join('')
                : '<div class="search-result-item">无匹配结果</div>';
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
                targetInput && (targetInput.value = base64String);
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

    // showSaveButton 显示共享标题栏的保存和取消按钮
    function showSaveButton() {
        const header = document.querySelector('#settings-content .modal-header');
        if (!header) return;
        const buttons = header.querySelectorAll('.settings-action-button');
        if (buttons.length > 0 && !saveButtonVisible) {
            buttons.forEach(btn => btn.classList.add('visible'));
            saveButtonVisible = true;
            cancelButtonVisible = true;
        }
    }

    // hideSaveButton 隐藏共享标题栏的保存和取消按钮
    function hideSaveButton() {
        const header = document.querySelector('#settings-content .modal-header');
        if (!header) return;
        const buttons = header.querySelectorAll('.settings-action-button');
        if (buttons.length > 0 && saveButtonVisible) {
            buttons.forEach(btn => btn.classList.remove('visible'));
            saveButtonVisible = false;
            cancelButtonVisible = false;
        }
    }

    // updatePanelTitle 更新共享标题栏的标题
    function updatePanelTitle(panelId) {
        const headerTitle = document.querySelector('#settings-content .modal-header h2');
        if (!headerTitle) return;
        const navItem = App.config.settingsNavigation.find(item => item.target === panelId);
        headerTitle.textContent = navItem ? navItem.name : '';
    }

    // handleCancel 撤销当前面板的修改，不关闭设置窗口
    function handleCancel() {
        const activePanel = document.querySelector('#settings-modal .settings-content-panel.active');
        if (!activePanel) return;

        switch (activePanel.id) {
            case 'content-site-appearance':
            case 'content-advanced-settings':
                // 从原始设置恢复表单值
                App.helpers.setFormValue('site-name', originalSettings.siteName);
                App.helpers.setFormValue('site-icon', originalSettings.siteIcon);
                App.helpers.setFormValue('site-title', originalSettings.siteTitle);
                App.helpers.setFormValue('avatar-url', originalSettings.avatarURL);
                App.helpers.setFormValue('theme', originalSettings.theme);
                App.helpers.setFormValue('background-url', originalSettings.backgroundURL);
                App.helpers.setFormValue('background-blur', originalSettings.backgroundBlur);
                App.helpers.setFormValue('cards-per-row', originalSettings.cardsPerRow);
                App.helpers.setFormValue('top-content', originalSettings.topContent);
                App.helpers.setFormValue('bottom-content', originalSettings.bottomContent);
                App.helpers.setFormValue('custom-css', originalSettings.customCSS);
                App.helpers.setFormValue('external-js', (originalSettings.externalJS || []).join('\n'));
                updateSliderValue('background-blur', 'background-blur-value');
                updateSliderValue('cards-per-row', 'cards-per-row-value');
                break;
            case 'content-add-link':
            case 'content-bulk-add':
            case 'content-password-settings':
                // 清空表单
                const form = activePanel.querySelector('form');
                form && form.reset();
                break;
            case 'content-edit-link':
                // 重置编辑链接表单
                App.finder.toggleEditForm(false);
                const editSearchInput = document.getElementById('edit-link-search-input');
                editSearchInput && (editSearchInput.value = '');
                break;
            case 'content-category-management':
                // 重置分类管理到初始状态
                App.editor.reset();
                break;
        }
        hideSaveButton();
    }

    // bindChangeListeners 为设置模态框中的所有表单元素绑定修改事件
    function bindChangeListeners() {
        if (changeListenersBound) return;
        changeListenersBound = true;

        const modal = document.getElementById('settings-modal');
        if (!modal) return;

        modal.addEventListener('input', (event) => {
            event.target.matches('input, textarea, select') && showSaveButton();
        }, true);

        modal.addEventListener('change', (event) => {
            event.target.matches('input, textarea, select') && showSaveButton();
        }, true);

        // 监听分类管理中的拖放、编辑、删除等操作
        document.addEventListener('settings-changed', showSaveButton);
    }

    // bindModalCloseHandler 绑定模态框关闭事件，若已保存则刷新页面
    function bindModalCloseHandler() {
        if (modalCloseHandlerBound) return;
        modalCloseHandlerBound = true;

        document.addEventListener('modal:closed', (event) => {
            if (event.detail?.modalId === 'settings-modal') {
                // 关闭前如果有未保存的修改，触发取消逻辑撤销修改
                saveButtonVisible && handleCancel();
                hasSaved && window.location.reload();
            }
        });
    }

    // createModalAndEvents 创建并初始化设置模态框与事件
    function createModalAndEvents() {
        if (document.getElementById('settings-modal')) return;

        const modalHTML = `
            <div id="settings-modal" class="modal">
                <div class="modal-content">
                    <div id="settings-nav"></div>
                    <div id="settings-content">
                        <div class="modal-header">
                            <button type="button" class="btn btn-secondary settings-action-button settings-cancel-button">取消</button>
                            <h2></h2>
                            <button type="button" class="btn btn-primary settings-action-button settings-save-button">保存</button>
                            <button type="button" class="close-button"><i data-feather="x"></i></button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        feather.replace();

        const modal = document.getElementById('settings-modal');
        const navContainer = document.getElementById('settings-nav');
        const contentContainer = document.getElementById('settings-content');

        // 左侧导航顶部添加"设置"标题
        const navTitle = document.createElement('h3');
        navTitle.textContent = '设置';
        navContainer.appendChild(navTitle);

        App.config.settingsNavigation.forEach(item => {
            if (item.target === 'content-site-appearance') {
                const divider = document.createElement('div');
                divider.className = 'settings-nav-divider';
                navContainer.appendChild(divider);
            }
            const navLink = document.createElement('a');
            navLink.href = '#';
            navLink.className = 'settings-nav-item';
            navLink.dataset.target = item.target;
            navLink.textContent = item.name;
            navContainer.appendChild(navLink);

            const panelName = item.target.replace('content-', '').split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
            const functionName = `get${panelName}HTML`;

            typeof App.views[functionName] === 'function' && contentContainer.insertAdjacentHTML('beforeend', App.views[functionName]());
        });

        modal.addEventListener('click', (event) => {
            event.target === modal && App.modal.close('settings-modal');
        });

        // 绑定共享标题栏按钮事件
        const header = document.querySelector('#settings-content .modal-header');
        if (header) {
            header.querySelector('.settings-cancel-button').addEventListener('click', handleCancel);
            header.querySelector('.settings-save-button').addEventListener('click', handleSave);
            header.querySelector('.close-button').addEventListener('click', () => App.modal.close('settings-modal'));
        }

        document.addEventListener('settings-saved', () => {
            hasSaved = true;
        });
        bindChangeListeners();
        bindModalCloseHandler();
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
                targetId && switchPanel(targetId);
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
                input.value = match[1].trim();
                targetPanelInput.value = match[2] === '主面板' ? 'primary' : 'secondary';
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
                !wrapper.contains(e.target) && wrapper.classList.remove('active');
            });
        }, true);
    }

    // switchPanel 切换设置模态框中的主内容面板
    async function switchPanel(targetId) {
        // 如果有未保存的修改，先触发取消逻辑撤销修改
        saveButtonVisible && handleCancel();
        lastActivePanelId = targetId;
        const modal = document.getElementById('settings-modal');
        modal.querySelectorAll('.settings-nav-item').forEach(nav => nav.classList.remove('active'));
        modal.querySelectorAll('.settings-content-panel').forEach(panel => panel.classList.remove('active'));

        modal.querySelector(`.settings-nav-item[data-target="${targetId}"]`)?.classList.add('active');
        const activePanel = modal.querySelector(`#${targetId}`);
        activePanel && activePanel.classList.add('active');

        // 更新共享标题栏标题
        updatePanelTitle(targetId);

        if (targetId === 'content-add-link') {
            const targetPanelInput = document.getElementById('add-link-target-panel');
            targetPanelInput && (targetPanelInput.value = App.actions.getActivePanel ? App.actions.getActivePanel() : 'primary');
        }

        if (targetId === 'content-category-management') {
            const container = document.getElementById('category-management-body');
            App.editor.loadAndRender(container);
        } else if (targetId === 'content-edit-link' || targetId === 'content-add-link') {
            targetId === 'content-edit-link' && App.finder.loadLinksForEditing();
            try {
                const panelsToRender = await App.cache.fetchLinks();
                const flatLinks = [];
                if (panelsToRender && typeof panelsToRender === 'object') {
                    for (const panelName in panelsToRender) {
                        const categories = panelsToRender[panelName];
                        if (!Array.isArray(categories)) continue;
                        categories.forEach(category => {
                            if (!category.links || !Array.isArray(category.links)) return;
                            category.links.forEach(link => {
                                flatLinks.push({ ...link, panel: panelName, category: category.name || '' });
                            });
                        });
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
                if (activePanel.classList.contains('active')) {
                    const input = activePanel.querySelector('.searchable-select-wrapper input');
                    if (input && document.activeElement === input) {
                        input.dispatchEvent(new Event('focus'));
                    }
                }
            } catch (error) {
                error.message !== 'Unauthorized' && console.error(`Failed to populate categories for ${targetId} form:`, error);
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
                App.helpers.setFormValue('theme', originalSettings.theme);
                App.helpers.setFormValue('background-url', originalSettings.backgroundURL);
                App.helpers.setFormValue('background-blur', originalSettings.backgroundBlur);
                App.helpers.setFormValue('cards-per-row', originalSettings.cardsPerRow);
                App.helpers.setFormValue('top-content', originalSettings.topContent);
                App.helpers.setFormValue('bottom-content', originalSettings.bottomContent);
                App.helpers.setFormValue('custom-css', originalSettings.customCSS);
                App.helpers.setFormValue('external-js', (originalSettings.externalJS || []).join('\n'));

                updateSliderValue('background-blur', 'background-blur-value');
                updateSliderValue('cards-per-row', 'cards-per-row-value');

                hideSaveButton();
                App.modal.open('settings-modal');
                switchPanel(panelToShow);
            } catch (error) {
                if (error.message === 'Unauthorized') {
                    App.auth.handleUnauthorized();
                } else {
                    console.error('Error loading settings:', error);
                    App.toast.show('设置加载失败', 'error');
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
            case 'content-site-appearance':
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
        hideSaveButton();
    }

    // get 获取原始设置
    function get() {
        return originalSettings;
    }

    // update 更新原始设置
    function update(newSettings) {
        originalSettings = { ...originalSettings, ...newSettings };
    }

    return { loadAndShow, get, update };
})();