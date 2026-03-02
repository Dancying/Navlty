// 定义全局 App 命名空间
window.App = window.App || {};

// 设置模块
App.settings = (function() {

    // 初始化设置相关的事件绑定
    function init() {
        const settingsModal = document.getElementById('settings-modal');
        if (settingsModal) {
            document.getElementById('settings-save-button')?.addEventListener('click', handleSave);

            // 绑定各个上传按钮
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
        fetch('/api/settings')
            .then(response => {
                if (!response.ok) throw new Error('加载设置失败');
                return response.json();
            })
            .then(data => {
                // 使用辅助函数填充表单
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
                App.toast.show('加载失败', 'error');
            });
    }

    // 处理保存设置的逻辑
    function handleSave() {
        // 从表单获取各项设置的值
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

        // 将设置数据提交到后端
        fetch('/api/settings', { 
            method: 'POST', 
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify(settings) 
        })
        .then(response => response.json())
        .then(data => {
            if (data.status !== 'success') throw new Error(data.message || '保存失败');
            App.toast.show('保存成功', 'success');
            // 实时将新设置应用到页面
            apply(settings);
        })
        .catch(error => {
            App.toast.show('保存失败', 'error');
            console.error('Error:', error);
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

        // 更新网站图标
        let favicon = document.querySelector('link[rel="icon"]');
        if (!favicon) {
            favicon = document.createElement('link');
            favicon.rel = 'icon';
            document.head.appendChild(favicon);
        }
        favicon.href = settings.siteIcon || '/favicon.ico';

        // 更新背景图片，使用图片预加载确保流畅
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

        // 更新 CSS 变量
        document.documentElement.style.setProperty('--background-blur', `${settings.backgroundBlur || 0}px`);
        document.documentElement.style.setProperty('--cards-per-row', settings.cardsPerRow || 4);

        // 应用自定义 CSS
        let customCSSStyle = document.getElementById('custom-css-style');
        if (!customCSSStyle) {
            customCSSStyle = document.createElement('style');
            customCSSStyle.id = 'custom-css-style';
            document.head.appendChild(customCSSStyle);
        }
        customCSSStyle.innerHTML = settings.customCSS || '';
        
        // 重新检查卡片描述是否溢出
        App.helpers.checkDescriptionOverflow();
    }

    // 页面首次加载时获取并应用设置
    function initialLoad() {
        return fetch('/api/settings')
            .then(r => r.json())
            .then(settings => {
                apply(settings);
                // 在此处可以动态加载外部 JS
            });
    }

    // 暴露公共方法
    return { init, loadAndShow, apply, initialLoad };
})();
