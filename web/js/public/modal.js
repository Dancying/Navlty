window.App = window.App || {};

App.modal = (function() {

  // open 打开指定 ID 的模态框，并处理背景滚动条
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
    
    document.body.classList.add('modal-open');
    modal.classList.add('show');
  }

  // close 关闭指定 ID 的模态框，并在所有模态框关闭后恢复滚动条
  function close(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    modal.classList.remove('show');
    
    if (document.querySelectorAll('.modal.show').length === 0) {
        document.body.classList.remove('modal-open');
        document.body.style.paddingRight = '';
        const header = document.querySelector('.header-background');
        if (header) header.style.paddingRight = '';
    }
  }

  return { open, close };
})();
