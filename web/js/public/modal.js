window.App = window.App || {};

App.modal = (function() {

  // 监听窗口大小变化以保持模态框居中
  window.addEventListener('resize', () => {
    document.querySelectorAll('.modal.show').forEach(center);
  });

  // open 打开指定 ID 的模态框
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

  // close 关闭当前活动的模态框
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

  // center 将模态框在视口中居中
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
