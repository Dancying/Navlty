window.App = window.App || {};

App.actions = (function() {

    // _handleApiSubmit 封装了向服务器提交操作的通用逻辑
    function _handleApiSubmit({ endpoint, method = 'POST', payload, successMessage, modalId, onSuccess }) {
        if (!payload || (Array.isArray(payload) && payload.length === 0)) {
            modalId && App.modal.close(modalId);
            return Promise.resolve(true);
        }

        return App.api.request(endpoint, { method, body: JSON.stringify(payload) })
            .then(result => {
                if (result.success === false || result.status === 'error') {
                    throw new Error(result.message || '操作失败');
                }
                App.toast.show(successMessage, 'success');
                onSuccess && onSuccess(result);
                return true;
            })
            .catch(error => {
                if (error.message !== 'Unauthorized') {
                    const errorMessage = error.message.includes("failed to fetch") ? '网络错误，请检查您的连接' : error.message;
                    App.toast.show(`操作失败: ${errorMessage}`, 'error');
                    console.error(`Error with ${endpoint}:`, error);
                }
                return false;
            })
            .finally(() => {
                modalId && App.modal.close(modalId);
            });
    }

    // getActivePanel 获取当前激活的面板名称
    function getActivePanel() {
        const primaryPanel = document.getElementById('primary-panel');
        return primaryPanel && primaryPanel.classList.contains('active') ? 'primary' : 'secondary';
    }

    // addLinks 将链接添加到数据库
    async function addLinks() {
        const activePanel = document.querySelector('#settings-modal .settings-content-panel.active');
        if (!activePanel) return App.modal.close('settings-modal');

        let linksToAdd = [];
        const singleTitleInput = activePanel.querySelector('#link-title');
        const bulkLinksInput = activePanel.querySelector('#bulk-links');

        if (singleTitleInput) {
            const urlInput = activePanel.querySelector('#link-url');
            const categoryInput = activePanel.querySelector('#link-category');
            const descInput = activePanel.querySelector('#link-description');
            const iconInput = activePanel.querySelector('#link-icon');

            if (![singleTitleInput, urlInput, categoryInput, descInput, iconInput].some(i => i && i.value)) {
                return App.modal.close('settings-modal');
            }
            if (!singleTitleInput.value || !urlInput.value) {
                App.toast.show('标题和链接是必填项', 'error');
                singleTitleInput.classList.toggle('input-error', !singleTitleInput.value);
                urlInput.classList.toggle('input-error', !urlInput.value);
                return;
            }
            linksToAdd.push({
                title: singleTitleInput.value,
                url: urlInput.value,
                category: categoryInput.value || 'Uncategorized',
                desc: descInput.value,
                icon_url: iconInput.value || 'globe',
            });
        } else if (bulkLinksInput) {
            const bulkContent = bulkLinksInput.value.trim();
            if (!bulkContent) return App.modal.close('settings-modal');

            const lines = bulkContent.split('\n').filter(line => line.trim());
            const parsedLinks = lines.map(line => {
                const [title, url, category, icon_url, desc] = line.split('|').map(part => part.trim());
                return (title && url) ? { title, url, category: category || 'Uncategorized', icon_url: icon_url || 'globe', desc: desc || '' } : null;
            }).filter(Boolean);

            if (parsedLinks.length === 0) {
                App.toast.show('未找到有效链接，请检查格式是否正确 (标题 | 链接)', 'error');
                return;
            }
            linksToAdd = parsedLinks;
        }
        if (linksToAdd.length === 0) return;

        const linksByCategory = linksToAdd.reduce((acc, link) => {
            const { category = 'Uncategorized', ...linkData } = link;
            (acc[category] = acc[category] || []).push(linkData);
            return acc;
        }, {});

        const actions = Object.entries(linksByCategory).map(([category, links]) => ({
            action: 'CREATE_LINKS',
            payload: { panel: getActivePanel(), category, links }
        }));

        await _handleApiSubmit({
            endpoint: '/api/links/actions',
            payload: actions,
            successMessage: '链接已成功添加',
            modalId: 'settings-modal',
            onSuccess: () => document.dispatchEvent(new CustomEvent('links-updated'))
        });
    }

    // updateLink 更新当前正在编辑的链接
    async function updateLink() {
        const linkId = App.finder.getCurrentEditingLinkId();
        if (!linkId) return App.toast.show('请先从列表中搜索并选择一个链接', 'warning');

        const title = App.helpers.getFormValue('edit-link-title');
        const url = App.helpers.getFormValue('edit-link-url');
        if (!title || !url) return App.toast.show('标题和 URL 是必填项', 'error');
        
        const payload = {
            title: title,
            url: url,
            category: App.helpers.getFormValue('edit-link-category') || 'Uncategorized',
            icon_url: App.helpers.getFormValue('edit-link-icon'),
            desc: App.helpers.getFormValue('edit-link-description'),
        };

        await _handleApiSubmit({
            endpoint: '/api/links/actions',
            payload: [{ action: 'UPDATE_LINKS', payload: [{ id: linkId, updates: payload }] }],
            successMessage: '链接已成功更新',
            modalId: 'settings-modal',
            onSuccess: () => document.dispatchEvent(new CustomEvent('links-updated'))
        });
    }

    function _detectDeletions(initialLinks, currentLinksMap) {
        const deletedIds = initialLinks.filter(link => !currentLinksMap.has(link.id)).map(link => link.id);
        return deletedIds.length > 0 ? { action: 'DELETE_LINKS', payload: { ids: deletedIds } } : null;
    }
    
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
            const initialOrder = initialPanels[panelName].order;
            const currentOrder = currentPanels[panelName].order;
    
            if (JSON.stringify(initialOrder) !== JSON.stringify(currentOrder)) {
                actions.push({
                    action: 'REORDER_CATEGORIES',
                    payload: {
                        panel: panelName,
                        orderedCategoryNames: currentOrder.map(name => name === 'Uncategorized' ? '' : name)
                    }
                });
            }
        });
    
        return actions;
    }
    
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
            ? _handleApiSubmit({
                endpoint: '/api/links/actions',
                payload: actions,
                successMessage: '链接更改已成功保存',
                modalId: 'settings-modal',
                onSuccess: () => document.dispatchEvent(new CustomEvent('links-updated'))
            })
            : (App.modal.close('settings-modal'), Promise.resolve(true));
    }

    // changePassword 处理用户密码修改请求
    async function changePassword() {
        const current = document.getElementById('current-password');
        const newPass = document.getElementById('new-password-change');
        const confirm = document.getElementById('confirm-password');
    
        if (![current, newPass, confirm].some(i => i.value)) return App.modal.close('settings-modal');

        const allFilled = [current, newPass, confirm].every(input => (input.classList.toggle('input-error', !input.value), !!input.value));
        if (!allFilled) return App.toast.show('所有字段均为必填项', 'error');
        
        if (newPass.value !== confirm.value) {
            newPass.classList.add('input-error');
            confirm.classList.add('input-error');
            return App.toast.show('新密码和确认密码不匹配', 'error');
        }

        await _handleApiSubmit({
            endpoint: '/api/auth/passwd',
            payload: { currentPassword: current.value, newPassword: newPass.value },
            successMessage: '密码已更新，请重新登录',
            modalId: 'settings-modal',
            onSuccess: App.auth.invalidateSession
        });
    }

    // saveSettings 保存应用程序的设置
    async function saveSettings() {
        const activePanel = document.querySelector('#settings-modal .settings-content-panel.active');
        if (!activePanel) return;

        const originalSettings = App.settings.get();
        const formFields = activePanel.querySelectorAll('input[name], textarea[name]');
        const currentValues = Array.from(formFields).reduce((acc, field) => {
            const key = field.name;
            if (field.type === 'range') acc[key] = parseInt(field.value, 10) || 0;
            else if (field.type === 'textarea' && key === 'externalJS') acc[key] = field.value.split('\n').filter(line => line.trim());
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
                successMessage: '设置已保存，部分更改可能需要刷新页面生效',
                modalId: 'settings-modal',
                onSuccess: () => {
                    App.settings.update(updates);
                    document.dispatchEvent(new CustomEvent('settings-updated', { detail: App.settings.get() }));
                }
            })
            : (App.modal.close('settings-modal'), Promise.resolve(true));
    }

    return { addLinks, updateLink, updateStructure, changePassword, saveSettings };
})();
