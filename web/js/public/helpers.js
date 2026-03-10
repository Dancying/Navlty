window.App = window.App || {};

App.helpers = (function () {

    // escapeHTML 转义 HTML 字符串以防止 XSS
    function escapeHTML(str) {
        if (str === null || str === undefined) {
            return '';
        }
        return String(str).replace(/[&<>'"]/g, function (tag) {
            const chars = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            };
            return chars[tag] || tag;
        });
    }

    // fileToBase64 将文件输入转换为 Base64 字符串
    function fileToBase64(fileInputElement, targetInputId) {
        if (fileInputElement.files.length > 0) {
            const file = fileInputElement.files[0];
            const reader = new FileReader();

            reader.onload = function (e) {
                const targetInput = document.getElementById(targetInputId);
                if (targetInput) {
                    targetInput.value = e.target.result;
                }
                App.toast.show('文件已成功加载', 'success');
            };

            reader.onerror = function (error) {
                App.toast.show('文件加载失败，请检查文件格式或重试', 'error');
                console.error('File could not be read: ' + error.message);
            };

            reader.readAsDataURL(file);
        }
    }

    // updateCardOverflow 检查并更新卡片标题和描述的溢出状态
    function updateCardOverflow() {
        document.querySelectorAll('.card').forEach(card => {
            const title = card.querySelector('.title');
            const desc = card.querySelector('.desc');

            card.classList.remove('scrolling-title', 'scrolling-desc');

            if (title && title.scrollWidth > title.clientWidth) {
                card.classList.add('scrolling-title');
            }

            if (desc && desc.scrollWidth > desc.clientWidth) {
                card.classList.add('scrolling-desc');
            }
        });
    }

    // setFormValue 设置表单字段的值
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

    // getFormValue 获取表单字段的值
    const getFormValue = (id) => {
        const element = document.getElementById(id);
        return element ? element.value : '';
    };

    return {
        escapeHTML,
        fileToBase64,
        updateCardOverflow,
        setFormValue,
        getFormValue
    };
})();
