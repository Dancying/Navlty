window.App = window.App || {};

App.actions = (function() {

    // getActivePanel 获取当前激活的面板名称
    function getActivePanel() {
        const primaryPanel = document.getElementById('primary-panel');
        if (primaryPanel && primaryPanel.classList.contains('active')) {
            return 'primary';
        }
        return 'secondary';
    }

    // submitLinks 将链接数据提交到后端 API
    async function submitLinks(links) {
        const linksByCategory = links.reduce((acc, link) => {
            const category = link.category || 'Uncategorized';
            if (!acc[category]) {
                acc[category] = [];
            }
            const { category: _, ...linkData } = link;
            acc[category].push(linkData);
            return acc;
        }, {});

        const panel = getActivePanel();
        const actions = Object.entries(linksByCategory).map(([category, categoryLinks]) => {
            return {
                action: 'CREATE_LINKS',
                payload: {
                    panel: panel,
                    category: category,
                    links: categoryLinks
                }
            };
        });

        try {
            await App.api.request('/api/links/actions', {
                method: 'POST',
                body: JSON.stringify(actions)
            });
            App.toast.show('链接已成功添加', 'success');
            document.dispatchEvent(new CustomEvent('links-updated'));
            return true;
        } catch (error) {
            App.toast.show(`链接保存失败: ${error.message}`, 'error');
            console.error('Error submitting links:', error);
            return false;
        }
    }

    // addLinks 处理单个或批量添加链接的逻辑
    async function addLinks() {
        const singleTitle = document.getElementById('link-title');
        const bulkLinks = document.getElementById('bulk-links');

        if (singleTitle) {
            const urlInput = document.getElementById('link-url');
            const categoryInput = document.getElementById('link-category');
            const descInput = document.getElementById('link-description');
            const iconInput = document.getElementById('link-icon');

            if (!singleTitle.value && !urlInput.value && !categoryInput.value && !descInput.value && !iconInput.value) {
                App.modal.close();
                return;
            }

            singleTitle.classList.remove('input-error');
            urlInput.classList.remove('input-error');

            if (!singleTitle.value || !urlInput.value) {
                App.toast.show('标题和链接是必填项', 'error');
                if (!singleTitle.value) singleTitle.classList.add('input-error');
                if (!urlInput.value) urlInput.classList.add('input-error');
                return;
            }

            const newLink = {
                title: singleTitle.value,
                url: urlInput.value,
                category: categoryInput.value || 'Uncategorized',
                desc: descInput.value,
                icon_url: iconInput.value || 'globe',
            };

            if (await submitLinks([newLink])) {
                App.modal.close();
            }
        } else if (bulkLinks) {
            const bulkContent = bulkLinks.value.trim();

            if (!bulkContent) {
                App.modal.close();
                return;
            }
            
            const lines = bulkContent.split('\n').filter(line => line.trim() !== '');
            bulkLinks.classList.remove('input-error');

            if (lines.length === 0) {
                App.modal.close();
                return;
            }
            
            const newLinks = lines.map(line => {
                const [title, url, category, icon_url, desc] = line.split('|').map(part => part.trim());
                if (!title || !url) return null;
                return { 
                    title, 
                    url, 
                    category: category || 'Uncategorized', 
                    icon_url: icon_url || 'globe', 
                    desc: desc || '' 
                };
            }).filter(link => link !== null);

            if (newLinks.length === 0) {
                App.toast.show('未找到有效链接，请检查格式是否正确 (标题 | 链接)', 'error');
                return;
            }

            if (await submitLinks(newLinks)) {
                App.modal.close();
            }
        }
    }

    // updateLink 更新当前正在编辑的链接
    async function updateLink() {
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

    // updateStructure 将链接结构的更改保存到服务器
    async function updateStructure(initialLinks, currentLinks) {
        const actions = [];
        const initialLinksMap = new Map(initialLinks.map(link => [link.id, link]));
        const currentLinksMap = new Map(currentLinks.map(link => [link.id, link]));

        const deletedIds = [];
        for (const id of initialLinksMap.keys()) {
            if (!currentLinksMap.has(id)) {
                deletedIds.push(id);
            }
        }
        if (deletedIds.length > 0) {
            actions.push({
                action: 'DELETE_LINKS',
                payload: { ids: deletedIds }
            });
        }

        const updates = [];
        const moves = new Map();

        currentLinks.forEach(link => {
            const initialLink = initialLinksMap.get(link.id);
            if (initialLink) {
                let hasUpdate = false;
                const linkUpdates = {};

                if (link.title !== initialLink.title) {
                    linkUpdates.title = link.title;
                    hasUpdate = true;
                }
                if (link.url !== initialLink.url) {
                    linkUpdates.url = link.url;
                    hasUpdate = true;
                }
                
                if (hasUpdate) {
                    updates.push({ id: link.id, updates: linkUpdates });
                }

                const categoryChanged = (link.category || '') !== (initialLink.category || '');
                const panelChanged = link.panel !== initialLink.panel;

                if (categoryChanged || panelChanged) {
                    const targetKey = `${link.panel}:${link.category || ''}`;
                    if (!moves.has(targetKey)) {
                        moves.set(targetKey, {
                            target: { panel: link.panel, category: link.category || '' },
                            ids: []
                        });
                    }
                    moves.get(targetKey).ids.push(link.id);
                }
            }
        });

        if (updates.length > 0) {
            actions.push({
                action: 'UPDATE_LINKS',
                payload: updates
            });
        }

        for (const move of moves.values()) {
            actions.push({
                action: 'MOVE_LINKS',
                payload: move
            });
        }

        if (actions.length === 0) {
            App.modal.close();
            return;
        }

        try {
            await App.api.request('/api/links/actions', {
                method: 'POST',
                body: JSON.stringify(actions),
            });
            App.toast.show('链接更改已成功保存', 'success');
            document.dispatchEvent(new CustomEvent('links-updated'));
            App.modal.close();
        } catch (error) {
            if (error.message !== 'Unauthorized') {
                console.error('Error saving changes:', error);
                App.toast.show('链接更改保存失败，请刷新后重试', 'error');
            }
        }
    }

    // changePassword 处理用户密码修改请求
    async function changePassword() {
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

    // saveSettings 保存应用程序的设置
    async function saveSettings() {
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

    return { 
        addLinks, 
        updateLink, 
        updateStructure, 
        changePassword, 
        saveSettings 
    };
})();