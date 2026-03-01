document.addEventListener('DOMContentLoaded', function() {
    // --- Toast Notification Logic ---
    let toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);

    window.showToast = function(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => toast.remove());
        }, 3000);
    };

    // --- Apply Settings Logic ---
    function applySettings(settings) {
        // Update site name and title
        document.title = settings.siteName || '';
        const siteTitleElement = document.querySelector('.site-title');
        if (siteTitleElement) {
            siteTitleElement.textContent = settings.siteTitle || '';
        }

        // Update avatar
        const avatarElement = document.querySelector('.avatar');
        if (avatarElement) {
            if (settings.avatarURL) {
                avatarElement.src = settings.avatarURL;
                avatarElement.style.display = 'block';
            } else {
                avatarElement.style.display = 'none';
            }
        }

        // Update favicon
        let favicon = document.querySelector('link[rel="icon"]');
        if (!favicon) {
            favicon = document.createElement('link');
            favicon.rel = 'icon';
            document.head.appendChild(favicon);
        }
        favicon.href = settings.siteIcon || '/favicon.ico';

        // Update styles
        document.documentElement.style.setProperty('--background-url', `url(${settings.backgroundURL || ''})`);
        document.documentElement.style.setProperty('--background-blur', `${settings.backgroundBlur || 0}px`);
        document.documentElement.style.setProperty('--cards-per-row', settings.cardsPerRow || 4);

        let customCSSStyle = document.getElementById('custom-css-style');
        if (!customCSSStyle) {
            customCSSStyle = document.createElement('style');
            customCSSStyle.id = 'custom-css-style';
            document.head.appendChild(customCSSStyle);
        }
        customCSSStyle.innerHTML = settings.customCSS || '';
    }

    // --- Handler Functions ---
    function handleSingleLink() {
        const titleInput = document.getElementById('link-title');
        const urlInput = document.getElementById('link-url');

        let isValid = true;
        titleInput.classList.remove('input-error');
        urlInput.classList.remove('input-error');

        if (!titleInput.value) {
            titleInput.classList.add('input-error');
            isValid = false;
        }
        if (!urlInput.value) {
            urlInput.classList.add('input-error');
            isValid = false;
        }

        if (!isValid) return;

        const newLink = {
            title: titleInput.value,
            url: urlInput.value,
            panel: document.querySelector('input[name="switch_panel_single"]:checked').value,
            category: document.getElementById('link-category').value || '默认',
            desc: document.getElementById('link-description').value,
            icon_url: document.getElementById('link-icon').value,
        };

        document.querySelector('#addLinkModal .close-button').click();

        fetch('/api/links/bulk', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify([newLink]) })
            .then(response => {
                if (!response.ok) throw new Error('Server responded with an error');
                showToast('保存成功', 'success');
            })
            .catch(error => {
                showToast('保存失败', 'error');
                console.error('Error:', error);
            });
    }

    function handleBulkLinks() {
        const lines = document.getElementById('bulk-links').value.split('\n').filter(line => line.trim() !== '');
        if (lines.length === 0) {
            alert('请输入至少一个链接。');
            return;
        }
        const panel = document.querySelector('input[name="switch_panel_bulk"]:checked').value;
        const newLinks = lines.map(line => {
            const [title, url, category, icon, description] = line.split('|').map(part => part.trim());
            if (!title || !url) return null;
            return { title, url, panel, category: category || '默认', icon_url: icon, desc: description };
        }).filter(link => link !== null);

        if (newLinks.length === 0) {
            alert('没有有效的链接可添加。请确保每行都包含标题和URL。');
            return;
        }

        document.querySelector('#addLinkModal .close-button').click();

        fetch('/api/links/bulk', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(newLinks) })
            .then(response => {
                if (!response.ok) throw new Error('Server responded with an error');
                showToast('保存成功', 'success');
            })
            .catch(error => {
                showToast('保存失败', 'error');
                console.error('Error:', error);
            });
    }

    function handleSettings() {
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

        document.querySelector('#settings-modal .close-button').click();

        fetch('/api/settings', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(settings) })
            .then(response => response.json())
            .then(data => {
                if (data.status !== 'success') throw new Error(data.message || 'Save failed');
                showToast('保存成功', 'success');
                applySettings(settings);
            })
            .catch(error => {
                showToast('保存失败', 'error');
                console.error('Error:', error);
            });
    }

    function fileToBase64(fileInputElement, targetInputId) {
        if (fileInputElement.files.length > 0) {
            const file = fileInputElement.files[0];
            const reader = new FileReader();

            reader.onload = function(e) {
                document.getElementById(targetInputId).value = e.target.result;
                showToast('图片已成功编码', 'success');
            };

            reader.onerror = function(error) {
                showToast('图片编码失败', 'error');
                console.error('File could not be read: ' + error.message);
            };

            reader.readAsDataURL(file);
        }
    }

    // --- Generic Modal Open/Close Logic ---
    const setFormValue = (id, value) => {
        const element = document.getElementById(id);
        if (element) {
            if (element.type === 'range') {
                element.value = value;
                const display = document.getElementById(id + '-value');
                if (display) display.textContent = value;
            } else if (element.type === 'textarea') {
                element.value = Array.isArray(value) ? value.join('\n') : (value || '');
            } else {
                element.value = value || '';
            }
        }
    };

    const loadAndShowSettings = () => {
        fetch('/api/settings')
            .then(response => {
                if (!response.ok) throw new Error('Failed to load settings');
                return response.json();
            })
            .then(data => {
                setFormValue('site-name', data.siteName);
                setFormValue('site-icon', data.siteIcon);
                setFormValue('site-title', data.siteTitle);
                setFormValue('avatar-url', data.avatarURL);
                setFormValue('background-url', data.backgroundURL);
                setFormValue('background-blur', data.backgroundBlur);
                setFormValue('cards-per-row', data.cardsPerRow);
                setFormValue('custom-css', data.customCSS);
                setFormValue('external-js', data.externalJS);

                document.getElementById('settings-modal')?.classList.add('active');
            })
            .catch(error => {
                console.error('Error loading settings:', error);
                showToast('加载失败', 'error');
            });
    };

    document.querySelectorAll('[data-modal-target]').forEach(trigger => {
        trigger.addEventListener('click', () => {
            const modalId = trigger.getAttribute('data-modal-target');
            if (modalId === 'settings-modal') {
                loadAndShowSettings();
            } else {
                document.getElementById(modalId)?.classList.add('active');
            }
        });
    });

    document.querySelectorAll('.modal .close-button, .modal .cancel-button').forEach(button => {
        button.addEventListener('click', (event) => {
            event.target.closest('.modal')?.classList.remove('active');
        });
    });

    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(modal => modal.classList.remove('active'));
        }
    });

    document.getElementById('toggle-panel-button')?.addEventListener('click', () => {
        document.getElementById('primary-panel')?.classList.toggle('active');
        document.getElementById('secondary-panel')?.classList.toggle('active');
    });

    const addLinkModal = document.getElementById('addLinkModal');
    if (addLinkModal) {
        addLinkModal.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', () => {
                addLinkModal.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
                addLinkModal.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                button.classList.add('active');
                document.getElementById(button.getAttribute('data-tab'))?.classList.add('active');
            });
        });

        document.getElementById('save-link-button')?.addEventListener('click', () => {
            const activeTab = addLinkModal.querySelector('.tab-button.active')?.getAttribute('data-tab');
            if (activeTab === 'single-link-tab') {
                handleSingleLink();
            } else {
                handleBulkLinks();
            }
        });

        const uploadIconButton = document.getElementById('upload-icon-button');
        const iconFileInput = document.getElementById('icon-file-input');
        if (uploadIconButton && iconFileInput) {
            uploadIconButton.addEventListener('click', () => iconFileInput.click());
            iconFileInput.addEventListener('change', () => fileToBase64(iconFileInput, 'link-icon'));
        }
    }

    const settingsModal = document.getElementById('settings-modal');
    if (settingsModal) {
        document.getElementById('settings-save-button')?.addEventListener('click', handleSettings);
        
        // Bind upload buttons in settings modal
        document.getElementById('upload-site-icon-button').addEventListener('click', () => document.getElementById('site-icon-file-input').click());
        document.getElementById('site-icon-file-input').addEventListener('change', () => fileToBase64(document.getElementById('site-icon-file-input'), 'site-icon'));

        document.getElementById('upload-avatar-button').addEventListener('click', () => document.getElementById('avatar-file-input').click());
        document.getElementById('avatar-file-input').addEventListener('change', () => fileToBase64(document.getElementById('avatar-file-input'), 'avatar-url'));

        document.getElementById('upload-background-button').addEventListener('click', () => document.getElementById('background-file-input').click());
        document.getElementById('background-file-input').addEventListener('change', () => fileToBase64(document.getElementById('background-file-input'), 'background-url'));
    }
    
    // --- Initial Load ---
    fetch('/api/settings').then(r => r.json()).then(settings => {
        applySettings(settings);
        checkDescriptionOverflow();
    });

    function checkDescriptionOverflow() {
        document.querySelectorAll('.card').forEach(card => {
            const desc = card.querySelector('.desc');
            if (desc.scrollWidth > desc.clientWidth) {
                card.classList.add('scrolling-desc');
            }
        });
    }
});
