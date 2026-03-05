// 定义全局 App 命名空间
window.App = window.App || {};

// 模态框管理模块
App.modal = (function() {

  // 监听窗口大小变化，以确保显示的模态框能够始终保持居中
  window.addEventListener('resize', () => {
    document.querySelectorAll('.modal.show').forEach(center);
  });

  // 根据 ID 打开一个模态框，并处理滚动条问题
  function open(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    const bodyHasScrollbar = document.body.scrollHeight > window.innerHeight;
    if (bodyHasScrollbar) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      const header = document.querySelector('.header-background');
      if (header) header.style.paddingRight = `${scrollbarWidth}px`;
    }

    modal.style.display = 'block';
    center(modal);
    setTimeout(() => modal.classList.add('show'), 10);
    document.body.classList.add('modal-open');
  }

  // 关闭当前显示的模态框，并在过渡动画结束后恢复页面状态
  function close() {
    const modal = document.querySelector('.modal.show');
    if (!modal) return;
    
    modal.classList.remove('show');
    modal.addEventListener('transitionend', () => {
      modal.remove();
      if (document.querySelectorAll('.modal.show').length === 0) {
        document.body.classList.remove('modal-open');
        document.body.style.paddingRight = '';
        const header = document.querySelector('.header-background');
        if (header) header.style.paddingRight = '';
      }
    }, { once: true });
  }

  // 计算并设置模态框的 top 和 left 样式，使其在视口中居中显示
  function center(modal) {
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
      const top = (window.innerHeight - modalContent.offsetHeight) / 2;
      const left = (window.innerWidth - modalContent.offsetWidth) / 2;
      modalContent.style.top = `${Math.max(0, top)}px`;
      modalContent.style.left = `${Math.max(0, left)}px`;
    }
  }

  return { open, close };
})();
