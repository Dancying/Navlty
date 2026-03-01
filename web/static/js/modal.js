document.addEventListener('DOMContentLoaded', function () {
    const addButton = document.getElementById('add-button');
    const settingsButton = document.getElementById('settings-button');
    const addModal = document.getElementById('add-modal');
    const settingsModal = document.getElementById('settings-modal');
    const closeButtons = document.querySelectorAll('.close-button');
    const cancelButtons = document.querySelectorAll('.cancel-button');

    const openModal = (modal) => {
        if (modal) {
            modal.style.display = 'block';
            document.body.classList.add('modal-open');
        }
    };

    const closeModal = () => {
        if (addModal) addModal.style.display = 'none';
        if (settingsModal) settingsModal.style.display = 'none';
        document.body.classList.remove('modal-open');
    };

    if (addButton && addModal) {
        addButton.addEventListener('click', () => openModal(addModal));
    }

    if (settingsButton && settingsModal) {
        settingsButton.addEventListener('click', () => openModal(settingsModal));
    }

    closeButtons.forEach(button => {
        button.addEventListener('click', closeModal);
    });

    cancelButtons.forEach(button => {
        button.addEventListener('click', closeModal);
    });

    window.addEventListener('click', (event) => {
        if (event.target == addModal || event.target == settingsModal) {
            closeModal();
        }
    });

    // Tab switching in Add Modal
    const singleSwitch = document.getElementById('switch_single');
    const bulkSwitch = document.getElementById('switch_bulk');
    const singleLinkForm = document.getElementById('single-link-form');
    const bulkAddForm = document.getElementById('bulk-add-form');

    if (singleSwitch && bulkSwitch && singleLinkForm && bulkAddForm) {
        singleSwitch.addEventListener('change', () => {
            if (singleSwitch.checked) {
                singleLinkForm.classList.add('active');
                bulkAddForm.classList.remove('active');
            }
        });

        bulkSwitch.addEventListener('change', () => {
            if (bulkSwitch.checked) {
                bulkAddForm.classList.add('active');
                singleLinkForm.classList.remove('active');
            }
        });
    }

    // Handle icon upload button click
    const uploadIconButton = document.getElementById('upload-icon-button');
    const linkIconUpload = document.getElementById('link-icon-upload');

    if (uploadIconButton && linkIconUpload) {
        uploadIconButton.addEventListener('click', () => {
            linkIconUpload.click(); // Trigger the hidden file input
        });
    }

    // Handle Add Modal submit
    const addModalSaveButton = addModal.querySelector('.submit-button');
    if (addModalSaveButton) {
        addModalSaveButton.addEventListener('click', function(event) {
            event.preventDefault();

            if (bulkSwitch && bulkSwitch.checked) {
                const bulkLinksTextarea = document.getElementById('bulk-links');
                const bulkPanelSelect = document.getElementById('bulk-link-panel');
                const selectedPanel = bulkPanelSelect.value;

                const lines = bulkLinksTextarea.value.trim().split('\n');
                const links = lines.map(line => {
                    const parts = line.split('|').map(part => part.trim());
                    if (parts.length < 2) return null;

                    return {
                        title: parts[0],
                        url: parts[1],
                        category: parts[2] || '未分类',
                        icon_url: parts[3] || '',
                        panel: selectedPanel,
                        desc: parts[4] || ''
                    };
                }).filter(link => link !== null && link.title && link.url);

                if (links.length > 0) {
                    fetch('/api/links/bulk', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(links),
                    })
                    .then(response => {
                        if (response.ok) {
                            closeModal();
                            location.reload();
                        } else {
                            alert('批量添加链接失败！');
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        alert('批量添加链接时发生错误！');
                    });
                }
            } 
        });
    }
});
