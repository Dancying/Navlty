// 定义全局 App 命名空间
window.App = window.App || {};

// 辅助函数模块
App.helpers = (function() {

    // 将文件转换为 Base64 字符串
    function fileToBase64(fileInputElement, targetInputId) {
        if (fileInputElement.files.length > 0) {
            const file = fileInputElement.files[0];
            const reader = new FileReader();

            // 文件读取成功
            reader.onload = function(e) {
                const targetInput = document.getElementById(targetInputId);
                if (targetInput) {
                    targetInput.value = e.target.result;
                }
                App.toast.show('图片已成功编码', 'success');
            };

            // 文件读取失败
            reader.onerror = function(error) {
                App.toast.show('图片编码失败', 'error');
                console.error('File could not be read: ' + error.message);
            };

            reader.readAsDataURL(file);
        }
    }

    // 检查卡片描述是否溢出，如果溢出则添加滚动类
    function checkDescriptionOverflow() {
        document.querySelectorAll('.card').forEach(card => {
            const desc = card.querySelector('.desc');
            card.classList.remove('scrolling-desc');
            if (desc && desc.scrollWidth > desc.clientWidth) {
                card.classList.add('scrolling-desc');
            }
        });
    }

    // 设置表单元素的值，适配不同类型
    const setFormValue = (id, value) => {
        const element = document.getElementById(id);
        if (element) {
            // 滑块类型，同时更新旁边的数值显示
            if (element.type === 'range') {
                element.value = value;
                const display = document.getElementById(id + '-value');
                if (display) display.textContent = value;
            // 文本域类型，处理数组和空值
            } else if (element.type === 'textarea') {
                element.value = Array.isArray(value) ? value.join('\n') : (value || '');
            // 其他普通类型
            } else {
                element.value = value || '';
            }
        }
    };

    // 暴露公共方法
    return {
        fileToBase64,
        checkDescriptionOverflow,
        setFormValue
    };
})();
