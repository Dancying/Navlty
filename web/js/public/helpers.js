window.App = window.App || {};

App.helpers = (function () {

    const HTML_ESCAPE_MAP = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    };

    // escapeHTML 转义 HTML 字符串以防止 XSS
    function escapeHTML(str) {
        if (!str) {
            return '';
        }
        return str.replace(/[&<>'"]/g, tag => HTML_ESCAPE_MAP[tag] || tag);
    }

    // fileToBase64 将文件对象转换为 Base64 字符串，返回一个 Promise
    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            if (!(file instanceof File)) {
                return reject(new TypeError("传入的参数不是一个有效的文件对象"));
            }
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error("文件读取失败"));
            reader.readAsDataURL(file);
        });
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
    function setFormValue(id, value) {
        const element = document.getElementById(id);
        if (!element) return;

        const finalValue = value ?? '';

        if (element.type === 'range') {
            element.value = finalValue;
            const display = document.getElementById(id + '-value');
            if (display) display.textContent = finalValue;
        } else if (element.type === 'textarea') {
            element.value = Array.isArray(finalValue) ? finalValue.join('\n') : finalValue;
        } else {
            element.value = finalValue;
        }
    };

    // getFormValue 获取表单字段的值
    function getFormValue(id) {
        const element = document.getElementById(id);
        return element ? element.value : null;
    };

    return {
        escapeHTML,
        fileToBase64,
        updateCardOverflow,
        setFormValue,
        getFormValue
    };
})();
