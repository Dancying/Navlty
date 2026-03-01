// static/js/modal.js

document.addEventListener('DOMContentLoaded', function() {
    const modals = document.querySelectorAll('.modal');
    const modalButtons = document.querySelectorAll('[data-modal-target]');

    const openModal = function(modal) {
        if (modal) {
            modal.style.display = 'block';
            document.body.classList.add('modal-open');
        }
    };

    const closeModal = function(modal) {
        if (modal) {
            modal.style.display = 'none';
            document.body.classList.remove('modal-open');
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
            if (event.target == modal) {
                closeModal(modal);
            }
        });
    });

    // Legacy button handling for backward compatibility
    const addButton = document.getElementById('add-button');
    if (addButton && !addButton.hasAttribute('data-modal-target')) {
        const addLinkModal = document.getElementById('addLinkModal');
        addButton.addEventListener('click', () => openModal(addLinkModal));
    }

    const settingsButton = document.getElementById('settings-button');
    if (settingsButton && !settingsButton.hasAttribute('data-modal-target')) {
        const settingsModal = document.getElementById('settings-modal');
        settingsButton.addEventListener('click', () => openModal(settingsModal));
    }
});
