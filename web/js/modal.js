// static/js/modal.js

document.addEventListener('DOMContentLoaded', function() {
    const modals = document.querySelectorAll('.modal');
    const modalButtons = document.querySelectorAll('[data-modal-target]');

    function centerModal(modal) {
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            const top = (window.innerHeight - modalContent.offsetHeight) / 2;
            const left = (window.innerWidth - modalContent.offsetWidth) / 2;
            modalContent.style.top = `${top > 0 ? top : 0}px`;
            modalContent.style.left = `${left > 0 ? left : 0}px`;
        }
    }

    const openModal = function(modal) {
        if (modal) {
            // Calculate scrollbar width and apply padding
            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
            const bodyHasScrollbar = document.body.scrollHeight > window.innerHeight;

            if (bodyHasScrollbar) {
                document.body.style.paddingRight = `${scrollbarWidth}px`;
                const headerBackground = document.querySelector('.header-background');
                if (headerBackground) {
                    headerBackground.style.paddingRight = `${scrollbarWidth}px`;
                }
            }
            
            modal.style.display = 'block';
            centerModal(modal);
            modal.classList.add('show');
            document.body.classList.add('modal-open');
        }
    };

    const closeModal = function(modal) {
        if (modal) {
            modal.classList.remove('show');

            // Remove padding and class after transition
            setTimeout(() => {
                modal.style.display = 'none';
                document.body.classList.remove('modal-open');
                document.body.style.paddingRight = '';
                const headerBackground = document.querySelector('.header-background');
                if (headerBackground) {
                    headerBackground.style.paddingRight = '';
                }
            }, 200);
        }
    };

    modalButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modalId = this.getAttribute('data-modal-target');
            const modal = document.getElementById(modalId);
            openModal(modal);
        });
    });

    modals.forEach(modal => {
        const closeButton = modal.querySelector('.close-button');
        const cancelButton = modal.querySelector('.cancel-button');

        if (closeButton) {
            closeButton.addEventListener('click', () => closeModal(modal));
        }

        if (cancelButton) {
            cancelButton.addEventListener('click', () => closeModal(modal));
        }

        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeModal(modal);
            }
        });

        // Tab switching logic
        const tabButtons = modal.querySelectorAll('.tab-button');
        const tabContents = modal.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.getAttribute('data-tab');

                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                tabContents.forEach(content => {
                    if (content.id === tabId) {
                        content.classList.add('active');
                    } else {
                        content.classList.remove('active');
                    }
                });
            });
        });

        // Slider value display logic
        const sliders = modal.querySelectorAll('.slider');
        sliders.forEach(slider => {
            const valueSpan = document.getElementById(`${slider.id}-value`);
            if (valueSpan) {
                slider.addEventListener('input', () => {
                    valueSpan.textContent = slider.value;
                });
            }
        });
    });

    window.addEventListener('resize', () => {
        modals.forEach(modal => {
            if (modal.classList.contains('show')) {
                centerModal(modal);
            }
        });
    });
});
