// static/js/ui.js

document.addEventListener('DOMContentLoaded', function() {

    // Panel toggling
    const toggleButton = document.getElementById('toggle-panel-button');
    const primaryPanel = document.getElementById('primary-panel');
    const secondaryPanel = document.getElementById('secondary-panel');

    if (toggleButton && primaryPanel && secondaryPanel) {
        toggleButton.addEventListener('click', function() {
            primaryPanel.classList.toggle('active');
            secondaryPanel.classList.toggle('active');
        });
    }

    // Add link modal functionality
    const addLinkModal = document.getElementById('addLinkModal');

    if (addLinkModal) {
        const tabButtons = addLinkModal.querySelectorAll('.tab-button');
        const tabContents = addLinkModal.querySelectorAll('.tab-content');

        // Tab switching
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));

                button.classList.add('active');
                const tabId = button.getAttribute('data-tab');
                document.getElementById(tabId).classList.add('active');
            });
        });

        // Icon upload
        const uploadIconButton = document.getElementById('upload-icon-button');
        const iconFileInput = document.getElementById('icon-file-input');
        const linkIconInput = document.getElementById('link-icon');

        if (uploadIconButton && iconFileInput) {
            uploadIconButton.addEventListener('click', () => {
                iconFileInput.click();
            });

            iconFileInput.addEventListener('change', () => {
                if (iconFileInput.files.length > 0) {
                    const file = iconFileInput.files[0];
                    const formData = new FormData();
                    formData.append('icon', file);

                    fetch('/api/upload/icon', {
                        method: 'POST',
                        body: formData
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.url) {
                            linkIconInput.value = data.url;
                        } else {
                            alert('图标上传失败！');
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        alert('图标上传时发生错误！');
                    });
                }
            });
        }

        // Save button
        const saveLinkButton = document.getElementById('save-link-button');
        if (saveLinkButton) {
            saveLinkButton.addEventListener('click', function() {
                const activeTab = document.querySelector('.tab-button.active').getAttribute('data-tab');

                let panel;
                if (activeTab === 'single-link-tab') {
                    panel = document.querySelector('input[name="switch_panel_single"]:checked').value;
                    handleSingleLink(panel);
                } else {
                    panel = document.querySelector('input[name="switch_panel_bulk"]:checked').value;
                    handleBulkLinks(panel);
                }
            });
        }
    }
});

function handleSingleLink(panel) {
    const title = document.getElementById('link-title').value;
    const url = document.getElementById('link-url').value;
    const category = document.getElementById('link-category').value;
    const icon = document.getElementById('link-icon').value;
    const description = document.getElementById('link-description').value;

    if (!title || !url) {
        alert('标题和 URL 是必填项。');
        return;
    }

    const newLink = {
        title,
        url,
        category: category || '默认',
        desc: description,
        icon_url: icon,
        panel: panel
    };

    fetch('/api/links/bulk', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify([newLink]),
    })
    .then(response => {
        if (response.ok) {
            location.reload();
        } else {
            alert('添加链接失败！');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('添加链接时发生错误！');
    });
}

function handleBulkLinks(panel) {
    const bulkLinks = document.getElementById('bulk-links').value;
    const lines = bulkLinks.split('\n').filter(line => line.trim() !== '');

    if (lines.length === 0) {
        alert('请输入至少一个链接。');
        return;
    }

    const newLinks = lines.map(line => {
        const parts = line.split('|').map(part => part.trim());
        const [title, url, category, icon, description] = parts;

        if (!title || !url) {
            return null; // Skip invalid lines
        }

        return {
            title,
            url,
            category: category || '默认',
            icon_url: icon,
            desc: description,
            panel: panel
        };
    }).filter(link => link !== null);

    if (newLinks.length === 0) {
        alert('没有有效的链接可添加。请确保每行都包含标题和URL。');
        return;
    }

    fetch('/api/links/bulk', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(newLinks),
    })
    .then(response => {
        if (response.ok) {
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
