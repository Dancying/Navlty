window.App = window.App || {};

App.background = (function () {
    // init 读取主题色作背景占位色并在背景图加载完成后淡入显示
    function init() {
        const root = document.documentElement;
        const themeColor = getComputedStyle(root).backgroundColor;
        if (themeColor && themeColor !== 'rgba(0, 0, 0, 0)' && themeColor !== 'transparent') {
            root.style.setProperty('--background-placeholder', themeColor);
        }

        const raw = getComputedStyle(root)
            .getPropertyValue('--background-url').trim();
        const match = raw.match(/url\(['"]?(.*?)['"]?\)/);
        if (!match || !match[1]) return;

        const reveal = function () {
            root.style.setProperty('--background-opacity', '1');
        };
        const img = new Image();
        img.onload = reveal;
        img.onerror = reveal;
        img.src = match[1];
    }
    return { init: init };
})();
App.background.init();