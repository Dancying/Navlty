// 定义全局 App 命名空间
window.App = window.App || {};

// 辅助函数模块
App.helpers = (function () {

    // 将文件转换为 Base64 字符串
    function fileToBase64(fileInputElement, targetInputId) {
        if (fileInputElement.files.length > 0) {
            const file = fileInputElement.files[0];
            const reader = new FileReader();

            // 文件读取成功
            reader.onload = function (e) {
                const targetInput = document.getElementById(targetInputId);
                if (targetInput) {
                    targetInput.value = e.target.result;
                }
                App.toast.show('文件编码成功', 'success');
            };

            // 文件读取失败
            reader.onerror = function (error) {
                App.toast.show('文件编码失败', 'error');
                console.error('File could not be read: ' + error.message);
            };

            reader.readAsDataURL(file);
        }
    }

    // 检查卡片描述和标题是否溢出，并为溢出的元素添加对应的滚动类
    function updateCardOverflow() {
        document.querySelectorAll('.card').forEach(card => {
            const title = card.querySelector('.title');
            const desc = card.querySelector('.desc');

            // 首先重置类
            card.classList.remove('scrolling-title', 'scrolling-desc');

            // 检查标题是否溢出
            if (title && title.scrollWidth > title.clientWidth) {
                card.classList.add('scrolling-title');
            }

            // 检查描述是否溢出
            if (desc && desc.scrollWidth > desc.clientWidth) {
                card.classList.add('scrolling-desc');
            }
        });
    }

    // 设置表单元素的值，适配不同类型
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

    return {
        fileToBase64,
        updateCardOverflow,
        setFormValue
    };
})();
