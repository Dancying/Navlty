// 定义全局 App 命名空间
window.App = window.App || {};

// 设置模块
App.settings = (function () {

    // 初始化设置相关的事件绑定
    function init() {
        const settingsModal = document.getElementById('settings-modal');
        if (settingsModal) {
            document.getElementById('settings-save-button')?.addEventListener('click', handleSave);

            bindUploadButton('upload-site-icon-button', 'site-icon-file-input', 'site-icon');
            bindUploadButton('upload-avatar-button', 'avatar-file-input', 'avatar-url');
            bindUploadButton('upload-background-button', 'background-file-input', 'background-url');
        }
    }

    // 辅助函数：绑定上传按钮和文件输入框
    function bindUploadButton(buttonId, inputId, targetId) {
        const button = document.getElementById(buttonId);
        const input = document.getElementById(inputId);
        if (button && input) {
            button.addEventListener('click', () => input.click());
            input.addEventListener('change', () => App.helpers.fileToBase64(input, targetId));
        }
    }

    // 从后端加载设置数据并显示模态框
    function loadAndShow() {
        App.auth.checkAuthStatus(() => {
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
                    App.helpers.setFormValue('external-js', data.externalJS);
                    App.modal.open('settings-modal');
                })
                .catch(error => {
                    console.error('Error loading settings:', error);
                    App.toast.show('配置加载失败', 'error');
                });
        });
    }

    // 处理保存设置的逻辑
    function handleSave() {
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

        App.modal.close('settings-modal');

        fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
        })
            .then(response => response.json())
            .then(data => {
                if (data.status !== 'success') throw new Error(data.message || '保存失败');
                App.toast.show('配置保存成功', 'success');
                apply(settings);
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
            avatarElement.src = settings.avatarURL ? settings.avatarURL : '#';
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

    // 页面首次加载时获取并应用设置
    function initialLoad() {
        if (!App.auth.isAuthenticated()) {
            return Promise.resolve(null);
        }

        return fetch('/api/settings')
            .then(response => {
                if (response.ok) {
                    return response.json();
                }
                return Promise.resolve(null);
            })
            .then(settings => {
                if (settings) {
                    apply(settings);
                }
            })
            .catch(error => {
                console.error("Failed to initialize app settings:", error);
                return Promise.resolve();
            });
    }

    return { init, loadAndShow, apply, initialLoad };
})();
