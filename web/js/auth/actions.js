window.App = window.App || {};

App.actions = (function() {

    // _handleApiSubmit 封装了向服务器提交操作的通用逻辑
    function _handleApiSubmit({ endpoint, method = 'POST', payload, successMessage, modalId, onSuccess, closeModal = true, skipAuthRedirect = false, errorMessage = '保存失败' }) {
        if (!payload || (Array.isArray(payload) && payload.length === 0)) {
            if (closeModal && modalId) App.modal.close(modalId);
            return Promise.resolve(true);
        }

        return App.api.request(endpoint, { method, body: JSON.stringify(payload), skipAuthRedirect })
            .then(result => {
                if (result.success === false || result.status === 'error') {
                    throw new Error(result.message || '操作失败');
                }
                App.toast.show(successMessage, 'success');
                onSuccess && onSuccess(result);
                !closeModal && document.dispatchEvent(new CustomEvent('settings-saved'));
                return true;
            })
            .catch(error => {
                error.message !== 'Unauthorized' && (App.toast.show(errorMessage, 'error'), console.error(`Error with ${endpoint}:`, error));
                return false;
            })
            .finally(() => { closeModal && modalId && App.modal.close(modalId); });
    }

    // getActivePanel 获取当前激活的面板名称
    function getActivePanel() {
        const primaryPanel = document.getElementById('primary-panel');
        return primaryPanel && primaryPanel.classList.contains('active') ? 'primary' : 'secondary';
    }

    // addLinks 将链接添加到数据库
    async function addLinks() {
        const activePanel = document.querySelector('#settings-modal .settings-content-panel.active');
        if (!activePanel) return;

        let linksToAdd = [];
        const singleTitleInput = activePanel.querySelector('#link-title');
        const bulkLinksInput = activePanel.querySelector('#bulk-links');

        if (singleTitleInput) {
            const urlInput = activePanel.querySelector('#link-url');
            const categoryInput = activePanel.querySelector('#link-category');
            const descInput = activePanel.querySelector('#link-description');
            const iconInput = activePanel.querySelector('#link-icon');

            if (![singleTitleInput, urlInput, categoryInput, descInput, iconInput].some(i => i && i.value)) return;
            if (!singleTitleInput.value || !urlInput.value) {
                App.toast.show('标题和链接必填', 'error');
                return;
            }
            linksToAdd.push({ title: singleTitleInput.value, url: urlInput.value, category: categoryInput.value || 'Uncategorized', desc: descInput.value, icon_url: iconInput.value || 'globe' });
        } else if (bulkLinksInput) {
            const bulkContent = bulkLinksInput.value.trim();
            if (!bulkContent) return;
            linksToAdd = bulkContent.split('\n').filter(line => line.trim()).map(line => {
                const [title, url, category, icon_url, desc] = line.split('|').map(part => part.trim());
                return (title && url) ? { title, url, category: category || 'Uncategorized', icon_url: icon_url || 'globe', desc: desc || '' } : null;
            }).filter(Boolean);
            if (linksToAdd.length === 0) { App.toast.show('标题和链接必填', 'error'); return; }
        }
        if (linksToAdd.length === 0) return;

        const targetPanel = App.helpers.getFormValue('add-link-target-panel') || getActivePanel();
        const linksByCategory = linksToAdd.reduce((acc, link) => {
            const { category = 'Uncategorized', ...linkData } = link;
            (acc[category] = acc[category] || []).push(linkData);
            return acc;
        }, {});

        return _handleApiSubmit({
            endpoint: '/api/links/actions',
            payload: Object.entries(linksByCategory).map(([category, links]) => ({ action: 'CREATE_LINKS', payload: { panel: targetPanel, category, links } })),
            successMessage: '保存成功',
            modalId: 'settings-modal',
            closeModal: false,
            onSuccess: () => document.dispatchEvent(new CustomEvent('links-updated'))
        });
    }

    // updateLink 更新当前正在编辑的链接
    async function updateLink() {
        const linkId = App.finder.getCurrentEditingLinkId();
        if (!linkId) { App.toast.show('请先选择链接', 'warning'); return; }

        const originalLink = App.finder.getLinkById(linkId);
        if (!originalLink) { App.toast.show('未找到原始链接数据', 'error'); return; }

        const newTitle = App.helpers.getFormValue('edit-link-title');
        const newUrl = App.helpers.getFormValue('edit-link-url');
        if (!newTitle || !newUrl) { App.toast.show('标题和链接必填', 'error'); return; }

        const newCategory = App.helpers.getFormValue('edit-link-category') || 'Uncategorized';
        const newPanel = App.helpers.getFormValue('edit-link-target-panel');
        const newIcon = App.helpers.getFormValue('edit-link-icon');
        const newDesc = App.helpers.getFormValue('edit-link-description');

        const updatePayload = {};
        if (originalLink.title !== newTitle) updatePayload.title = newTitle;
        if (originalLink.url !== newUrl) updatePayload.url = newUrl;
        if (originalLink.icon !== newIcon) updatePayload.icon_url = newIcon;
        if (originalLink.description !== newDesc) updatePayload.desc = newDesc;

        const actions = [];
        Object.keys(updatePayload).length > 0 && actions.push({ action: 'UPDATE_LINKS', payload: [{ id: linkId, updates: updatePayload }] });
        (originalLink.panel !== newPanel || originalLink.category !== newCategory) && actions.push({ action: 'MOVE_LINKS', payload: { target: { panel: newPanel, category: newCategory }, ids: [linkId] } });
        if (actions.length === 0) return;

        return _handleApiSubmit({
            endpoint: '/api/links/actions',
            payload: actions,
            successMessage: '保存成功',
            modalId: 'settings-modal',
            closeModal: false,
            onSuccess: () => document.dispatchEvent(new CustomEvent('links-updated'))
        });
    }

    // _detectDeletions 检测被删除的链接
    function _detectDeletions(initialLinks, currentLinksMap) {
        const deletedIds = initialLinks.filter(link => !currentLinksMap.has(link.id)).map(link => link.id);
        return deletedIds.length > 0 ? { action: 'DELETE_LINKS', payload: { ids: deletedIds } } : null;
    }

    // _detectMoves 检测发生移动的链接
    function _detectMoves(currentLinks, initialLinksMap) {
        return Array.from(currentLinks.reduce((moves, currentLink) => {
            const initialLink = initialLinksMap.get(currentLink.id);
            if (!initialLink) return moves;
            const initialTarget = `${initialLink.panel || 'primary'}:${initialLink.category || 'Uncategorized'}`;
            const currentTarget = `${currentLink.panel || 'primary'}:${currentLink.category || 'Uncategorized'}`;
            if (initialTarget !== currentTarget) {
                if (!moves.has(currentTarget)) {
                    moves.set(currentTarget, { target: { panel: currentLink.panel || 'primary', category: currentLink.category || 'Uncategorized' }, ids: [] });
                }
                moves.get(currentTarget).ids.push(currentLink.id);
            }
            return moves;
        }, new Map()).values()).map(move => ({ action: 'MOVE_LINKS', payload: move }));
    }

    // _detectCategoryReorders 检测分类顺序变化
    function _detectCategoryReorders(initialLinks, currentLinks) {
        const getOrderedCategories = (links) => {
            const panels = { primary: { order: [], set: new Set() }, secondary: { order: [], set: new Set() } };
            links.forEach(link => {
                const panelName = link.panel || 'primary';
                const categoryName = link.category || 'Uncategorized';
                if (!panels[panelName].set.has(categoryName)) {
                    panels[panelName].set.add(categoryName);
                    panels[panelName].order.push(categoryName);
                }
            });
            return panels;
        };

        const initialPanels = getOrderedCategories(initialLinks);
        const currentPanels = getOrderedCategories(currentLinks);
        const actions = [];

        ['primary', 'secondary'].forEach(panelName => {
            if (JSON.stringify(initialPanels[panelName].order) !== JSON.stringify(currentPanels[panelName].order)) {
                actions.push({ action: 'REORDER_CATEGORIES', payload: { panel: panelName, orderedCategoryNames: currentPanels[panelName].order.map(name => name === 'Uncategorized' ? '' : name) } });
            }
        });

        return actions;
    }

    // _detectLinkUpdates 检测链接内容的更新
    function _detectLinkUpdates(initialLinks, currentLinks, initialLinksMap) {
        const groupLinks = links => links.reduce((acc, link) => {
            const key = `${link.panel || 'primary'}:${link.category || 'Uncategorized'}`;
            (acc[key] = acc[key] || []).push(link);
            return acc;
        }, {});

        const initialGroups = groupLinks(initialLinks);
        const currentGroups = groupLinks(currentLinks);

        const updates = Object.entries(currentGroups).flatMap(([key, currentLinksInCat]) => {
            const initialLinksInCat = initialGroups[key] || [];
            const orderChanged = initialLinksInCat.map(l => l.id).join() !== currentLinksInCat.map(l => l.id).join();

            return currentLinksInCat.map((currentLink, index) => {
                const initialLink = initialLinksMap.get(currentLink.id);
                if (!initialLink) return null;

                const updatePayload = {};
                let hasChange = false;

                if (orderChanged && initialLink.sort !== index) {
                    updatePayload.sort = index;
                    hasChange = true;
                }

                ['title', 'url', 'desc', 'icon_url', 'category'].forEach(field => {
                    if (currentLink[field] !== initialLink[field]) {
                        updatePayload[field] = currentLink[field];
                        hasChange = true;
                    }
                });

                return hasChange ? { id: currentLink.id, updates: updatePayload } : null;
            });
        }).filter(Boolean);

        return updates.length > 0 ? { action: 'UPDATE_LINKS', payload: updates } : null;
    }

    // updateStructure 将链接结构的更改保存到服务器
    async function updateStructure(initialLinks, currentLinks) {
        const initialLinksMap = new Map(initialLinks.map(link => [link.id, link]));
        const currentLinksMap = new Map(currentLinks.map(link => [link.id, link]));
        const actions = [
            _detectDeletions(initialLinks, currentLinksMap),
            ..._detectMoves(currentLinks, initialLinksMap),
            ..._detectCategoryReorders(initialLinks, currentLinks),
            _detectLinkUpdates(initialLinks, currentLinks, initialLinksMap)
        ].filter(Boolean);

        return (actions.length > 0)
            ? _handleApiSubmit({ endpoint: '/api/links/actions', payload: actions, successMessage: '保存成功', modalId: 'settings-modal', closeModal: false, onSuccess: () => document.dispatchEvent(new CustomEvent('links-updated')) })
            : Promise.resolve(true);
    }

    // changePassword 处理用户密码修改请求
    async function changePassword() {
        const current = document.getElementById('current-password');
        const newPass = document.getElementById('new-password-change');
        const confirm = document.getElementById('confirm-password');

        if (![current, newPass, confirm].some(i => i.value)) return;
        if (![current, newPass, confirm].every(input => (input.classList.toggle('input-error', !input.value), !!input.value))) return App.toast.show('所有字段均为必填', 'error');
        if (newPass.value !== confirm.value) {
            newPass.classList.add('input-error');
            confirm.classList.add('input-error');
            return App.toast.show('两次输入的密码不一致', 'error');
        }

        return _handleApiSubmit({
            endpoint: '/api/auth/passwd',
            payload: { currentPassword: current.value, newPassword: newPass.value },
            successMessage: '保存成功',
            modalId: 'settings-modal',
            closeModal: false,
            skipAuthRedirect: true,
            errorMessage: '原密码错误',
            onSuccess: App.auth.invalidateSession
        });
    }

    // saveSettings 保存应用程序的设置
    async function saveSettings() {
        const activePanel = document.querySelector('#settings-modal .settings-content-panel.active');
        if (!activePanel) return;

        const originalSettings = App.settings.get();
        const currentValues = Array.from(activePanel.querySelectorAll('[name]')).reduce((acc, field) => {
            const key = field.name;
            if (field.type === 'range') acc[key] = parseInt(field.value, 10) || 0;
            else acc[key] = field.value;
            return acc;
        }, {});

        const updates = Object.entries(currentValues).reduce((acc, [key, value]) => {
            if (JSON.stringify(originalSettings[key] || (Array.isArray(value) ? [] : '')) !== JSON.stringify(value)) acc[key] = value;
            return acc;
        }, {});

        return (Object.keys(updates).length > 0)
            ? _handleApiSubmit({
                endpoint: '/api/settings',
                method: 'PATCH',
                payload: updates,
                successMessage: '保存成功',
                modalId: 'settings-modal',
                closeModal: false,
                onSuccess: () => {
                    App.settings.update(updates);
                    document.dispatchEvent(new CustomEvent('settings-saved'));
                }
            })
            : Promise.resolve(true);
    }

    return { addLinks, updateLink, updateStructure, changePassword, saveSettings, getActivePanel };
})();