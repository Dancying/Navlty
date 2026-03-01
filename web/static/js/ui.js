document.addEventListener('DOMContentLoaded', function () {
    const togglePanelButton = document.getElementById('toggle-panel-button');
    const primaryPanel = document.getElementById('primary-panel');
    const secondaryPanel = document.getElementById('secondary-panel');
    const tabSwitches = document.querySelectorAll('input[name="switch_tab"]');
    const tabContents = document.querySelectorAll('.tab-content');
    const uploadIcon = document.getElementById('upload-icon-button');
    const fileInput = document.getElementById('link-icon-upload');

    // Toggle Panel
    if (togglePanelButton && primaryPanel && secondaryPanel) {
        togglePanelButton.addEventListener('click', function () {
            const isPrimaryActive = primaryPanel.classList.contains('active');
            primaryPanel.classList.toggle('active', !isPrimaryActive);
            secondaryPanel.classList.toggle('active', isPrimaryActive);
        });
    }

    // Tab switching
    tabSwitches.forEach(switchEl => {
        switchEl.addEventListener('change', () => {
            const selectedTab = document.querySelector('input[name="switch_tab"]:checked').value;
            
            tabContents.forEach(content => {
                if (content.id === selectedTab) {
                    content.classList.add('active');
                } else {
                    content.classList.remove('active');
                }
            });
        });
    });

    // Icon upload
    if(uploadIcon && fileInput){
        uploadIcon.addEventListener('click', () => {
            fileInput.click();
        });
    }
});
