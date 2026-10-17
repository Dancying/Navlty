window.App = window.App || {};

App.helpers = (function () {
    // HTML_ESCAPE_MAP HTML 转义映射表
    const HTML_ESCAPE_MAP = { '&': '&a' + 'mp;', '<': '&l' + 't;', '>': '&g' + 't;', "'": '&#' + '39;', '"': '&q' + 'uot;' };

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

    // isOverflowing 判断容器内容是否超出其显示宽度
    function isOverflowing(container) {
        const span = container.querySelector('span');
        if (!span) return container.scrollWidth > container.clientWidth;
        return span.getBoundingClientRect().width - container.getBoundingClientRect().width > 1;
    }

    // setScrollDistance 计算并写入滚动元素的无单位滚动距离
    function setScrollDistance(container) {
        const span = container.querySelector('span');
        if (!span) return;
        const distance = Math.max(0, span.getBoundingClientRect().width - 50);
        span.style.setProperty('--scroll-distance', Math.round(distance));
    }

    // updateCardOverflow 检查并更新卡片标题和描述的溢出状态
    function updateCardOverflow() {
        document.querySelectorAll('.card').forEach(card => {
            const title = card.querySelector('.title');
            const desc = card.querySelector('.desc');
            const titleOverflow = title && isOverflowing(title);
            const descOverflow = desc && isOverflowing(desc);
            card.classList.toggle('scrolling-title', titleOverflow);
            card.classList.toggle('scrolling-desc', descOverflow);
            titleOverflow && setScrollDistance(title);
            descOverflow && setScrollDistance(desc);
        });
    }

    // updateTimer 检测防抖计时器
    let updateTimer;

    // scheduleUpdateCardOverflow 防抖调度卡片溢出状态检测
    function scheduleUpdateCardOverflow() {
        clearTimeout(updateTimer);
        updateTimer = setTimeout(updateCardOverflow, 150);
    }

    // setFormValue 设置表单字段的值
    function setFormValue(id, value) {
        const element = document.getElementById(id);
        if (!element) return;
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
    };

    // getFormValue 获取表单字段的值
    function getFormValue(id) {
        return document.getElementById(id)?.value ?? null;
    };

    // copyText 复制文本到剪贴板，返回一个 Promise
    function copyText(text) {
        const value = text ?? '';
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(value);
        }
        return new Promise((resolve, reject) => {
            const textarea = document.createElement('textarea');
            textarea.value = value;
            textarea.setAttribute('readonly', '');
            textarea.style.position = 'fixed';
            textarea.style.top = '-9999px';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            textarea.setSelectionRange(0, textarea.value.length);
            try {
                document.execCommand('copy') ? resolve() : reject(new Error('复制失败'));
            } catch (error) {
                reject(error);
            } finally {
                textarea.remove();
            }
        });
    }

    return { escapeHTML, fileToBase64, updateCardOverflow, scheduleUpdateCardOverflow, setFormValue, getFormValue, copyText };
})();