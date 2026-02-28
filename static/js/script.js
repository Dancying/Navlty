document.addEventListener('DOMContentLoaded', function () {
    const togglePanelButton = document.getElementById('toggle-panel-button');
    const primaryPanel = document.getElementById('primary-panel');
    const secondaryPanel = document.getElementById('secondary-panel');

    // Check if all elements exist
    if (togglePanelButton && primaryPanel && secondaryPanel) {
        togglePanelButton.addEventListener('click', function () {
            // Check which panel is currently active
            const isPrimaryActive = primaryPanel.classList.contains('active');

            if (isPrimaryActive) {
                // Switch to secondary panel
                primaryPanel.classList.remove('active');
                secondaryPanel.classList.add('active');
                togglePanelButton.textContent = 'Primary'; // Update button text
            } else {
                // Switch to primary panel
                secondaryPanel.classList.remove('active');
                primaryPanel.classList.add('active');
                togglePanelButton.textContent = 'Secondary'; // Update button text
            }
        });
    } else {
        console.error('One or more elements for panel toggling were not found.');
    }
});
