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
        return (str || '').replace(/[&<>'"]/g, tag => HTML_ESCAPE_MAP[tag] || tag);
    }

    // fileToBase64 将文件对象转换为 Base64 字符串，返回一个 Promise
    function fileToBase64(file) {
        return !(file instanceof File)
            ? Promise.reject(new TypeError("传入的参数不是一个有效的文件对象"))
            : new Promise((resolve, reject) => {
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
            card.classList.toggle('scrolling-title', title && title.scrollWidth > title.clientWidth);
            card.classList.toggle('scrolling-desc', desc && desc.scrollWidth > desc.clientWidth);
        });
    }

    // setFormValue 设置表单字段的值
    function setFormValue(id, value) {
        const element = document.getElementById(id);
        element && (() => {
            const finalValue = value ?? '';
            const actions = {
                'range': () => {
                    const display = document.getElementById(id + '-value');
                    display && (display.textContent = finalValue);
                    return finalValue;
                },
                'textarea': () => Array.isArray(finalValue) ? finalValue.join('\n') : finalValue,
            };
            element.value = actions[element.type]?.() ?? finalValue;
        })();
    };

    // getFormValue 获取表单字段的值
    function getFormValue(id) {
        return document.getElementById(id)?.value ?? null;
    };

    return { escapeHTML, fileToBase64, updateCardOverflow, setFormValue, getFormValue };
})();
