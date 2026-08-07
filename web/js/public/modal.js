window.App = window.App || {};

App.modal = (function() {

  // restoreScroll 恢复页面滚动和头部内边距
  function restoreScroll() {
    document.body.classList.remove('modal-open');
    document.body.style.paddingRight = '';
    const header = document.querySelector('.header-background');
    header && (header.style.paddingRight = '');
  }

  // open 打开指定 ID 的模态框，并处理背景滚动条
  function open(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    if (document.body.scrollHeight > window.innerHeight) {
      const scrollbarWidth = `${window.innerWidth - document.documentElement.clientWidth}px`;
      document.body.style.paddingRight = scrollbarWidth;
      const header = document.querySelector('.header-background');
      header && (header.style.paddingRight = scrollbarWidth);
    }
    
    document.body.classList.add('modal-open');
    modal.classList.add('show');
  }

  // close 关闭指定 ID 的模态框，并在所有模态框关闭后恢复滚动条
  function close(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    modal.classList.remove('show');

    // 若焦点停留在模态框内的元素上，将其移除避免快捷键被隐藏元素拦截
    modal.contains(document.activeElement) && document.activeElement.blur();
    
    document.querySelectorAll('.modal.show').length === 0 && restoreScroll();

    // 派发模态框关闭事件，供其他模块监听
    document.dispatchEvent(new CustomEvent('modal:closed', { detail: { modalId } }));
  }

  return { open, close };
})();