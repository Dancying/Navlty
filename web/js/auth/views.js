window.App = window.App || {};

App.views = (function() {

    // getSiteSettingsHTML 返回站点设置的 HTML 结构
    function getSiteSettingsHTML() {
        return `
        <div id="content-site-settings" class="settings-content-panel">
            <div class="modal-header"><h2>站点设置</h2></div>
            <div class="modal-body">
                <form id="site-settings-form" class="form-grid">
                    <div class="form-group"><label for="site-name">站点名称</label><input type="text" id="site-name" name="siteName" placeholder="显示在标签页的名称"></div>
                    <div class="form-group"><label for="site-icon">站点图标</label><div class="input-with-button"><input type="text" id="site-icon" name="siteIcon" placeholder="Feather 图标名、URL 或 Base64"><button type="button" id="upload-site-icon-button" class="btn icon-button"><i data-feather="upload"></i></button><input type="file" id="site-icon-file-input" class="hidden-file-input" accept="image/*"></div></div>
                    <div class="form-group"><label for="site-title">网站标题</label><input type="text" id="site-title" name="siteTitle" placeholder="显示在主页的标题"></div>
                    <div class="form-group"><label for="avatar-url">网站头像</label><div class="input-with-button"><input type="text" id="avatar-url" name="avatarURL" placeholder="Feather 图标名、URL 或 Base64"><button type="button" id="upload-avatar-button" class="btn icon-button"><i data-feather="upload"></i></button><input type="file" id="avatar-file-input" class="hidden-file-input" accept="image/*"></div></div>
                </form>
            </div>
        </div>`;
    }

    // getStyleSettingsHTML 返回外观设置的 HTML 结构
    function getStyleSettingsHTML() {
        return `
        <div id="content-style-settings" class="settings-content-panel">
            <div class="modal-header"><h2>外观设置</h2></div>
            <div class="modal-body">
                <form id="style-settings-form" class="form-grid">
                    <div class="form-group span-two"><label for="background-url">背景图片</label><div class="input-with-button"><input type="text" id="background-url" name="backgroundURL" placeholder="图片 URL 或 Base64"><button type="button" id="upload-background-button" class="btn icon-button"><i data-feather="upload"></i></button><input type="file" id="background-file-input" class="hidden-file-input" accept="image/*"></div></div>
                    <div class="form-group span-two slider-group"><label for="background-blur">背景模糊: <span id="background-blur-value">5</span>px</label><input type="range" id="background-blur" name="backgroundBlur" min="0" max="50" value="5" class="slider"></div>
                    <div class="form-group span-two slider-group"><label for="cards-per-row">每行链接卡片数量: <span id="cards-per-row-value">4</span></label><input type="range" id="cards-per-row" name="cardsPerRow" min="1" max="20" value="4" class="slider"></div>
                </form>
            </div>
        </div>`;
    }

    // getAdvancedSettingsHTML 返回高级设置的 HTML 结构
    function getAdvancedSettingsHTML() {
        return `
        <div id="content-advanced-settings" class="settings-content-panel">
            <div class="modal-header"><h2>高级设置</h2></div>
            <div class="modal-body">
                <form id="advanced-settings-form" class="form-grid">
                    <div class="form-group span-two"><label for="custom-css">自定义 CSS</label><textarea id="custom-css" name="customCSS" rows="4" placeholder="此处输入自定义 CSS 代码"></textarea></div>
                    <div class="form-group span-two"><label for="external-js">外部 JS</label><textarea id="external-js" name="externalJS" rows="4" placeholder="https://example.com/script.js\nhttps://another.com/script.js"></textarea></div>
                </form>
            </div>
        </div>`;
    }

    // getAddLinkHTML 返回添加链接表单的 HTML 结构
    function getAddLinkHTML() {
        return `
        <div id="content-add-link" class="settings-content-panel">
            <div class="modal-header"><h2>添加链接</h2></div>
            <div class="modal-body">
                <form id="add-link-form" class="form-grid">
                    <div class="form-group"><label for="link-title">标题*</label><input type="text" id="link-title" name="title" placeholder="Google" required></div>
                    <div class="form-group"><label for="link-url">链接*</label><input type="url" id="link-url" name="url" placeholder="https://google.com" required></div>
                    <div class="form-group"><label for="link-category">分类</label><input type="text" id="link-category" name="category" placeholder="搜索引擎"></div>
                    <div class="form-group"><label for="link-icon">图标</label><div class="input-with-button"><input type="text" id="link-icon" name="icon" placeholder="Feather 图标名、URL 或 Base64"><button type="button" id="upload-icon-button" class="btn icon-button"><i data-feather="upload"></i></button><input type="file" id="icon-file-input" class="hidden-file-input" accept="image/*"></div></div>
                    <div class="form-group span-two"><label for="link-description">描述</label><textarea id="link-description" name="description" placeholder="全球最大的搜索引擎"></textarea></div>
                </form>
            </div>
        </div>`;
    }

    // getEditLinkHTML 返回编辑链接表单的 HTML 结构
    function getEditLinkHTML() {
        return `
        <div id="content-edit-link" class="settings-content-panel">
            <div class="modal-header"><h2>编辑链接</h2></div>
            <div class="modal-body">
                <form id="edit-link-form" class="form-grid">
                    <div class="form-group span-two searchable-select-wrapper">
                        <label for="edit-link-search-input">搜索并选择链接</label>
                        <input type="text" id="edit-link-search-input" placeholder="搜索标题、URL、分类..." autocomplete="off">
                        <div id="edit-link-search-results"></div>
                    </div>
                    <div class="form-group"><label for="edit-link-title">标题*</label><input type="text" id="edit-link-title" name="title" required disabled></div>
                    <div class="form-group"><label for="edit-link-url">链接*</label><input type="url" id="edit-link-url" name="url" required disabled></div>
                    <div class="form-group"><label for="edit-link-category">分类</label><input type="text" id="edit-link-category" name="category" disabled></div>
                    <div class="form-group"><label for="edit-link-icon">图标</label><div class="input-with-button"><input type="text" id="edit-link-icon" name="icon" disabled><button type="button" id="upload-edit-icon-button" class="btn icon-button" disabled><i data-feather="upload"></i></button><input type="file" id="edit-icon-file-input" class="hidden-file-input" accept="image/*"></div></div>
                    <div class="form-group span-two"><label for="edit-link-description">描述</label><textarea id="edit-link-description" name="description" disabled></textarea></div>
                </form>
            </div>
        </div>`;
    }

    // getBulkAddHTML 返回批量添加链接表单的 HTML 结构
    function getBulkAddHTML() {
        return `
        <div id="content-bulk-add" class="settings-content-panel">
            <div class="modal-header"><h2>批量添加</h2></div>
            <div class="modal-body">
                <form id="bulk-add-form">
                    <div class="form-group"><label for="bulk-links">批量链接</label><textarea id="bulk-links" name="bulk-links" placeholder="标题 | URL | 分类(可选) | 图标URL(可选) | 描述(可选)"></textarea><small>提示：仅标题和 URL 是必需的。使用“|”分隔符。</small></div>
                </form>
            </div>
        </div>`;
    }

    // getCategoryManagementHTML 返回分类管理界面的 HTML 结构
    function getCategoryManagementHTML() {
        return `
        <div id="content-category-management" class="settings-content-panel">
            <div class="modal-header"><h2>分类管理</h2></div>
            <div class="modal-body" id="category-management-body"></div>
        </div>`;
    }

    // getPasswordSettingsHTML 返回密码设置表单的 HTML 结构
    function getPasswordSettingsHTML() {
        return `
        <div id="content-password-settings" class="settings-content-panel">
            <div class="modal-header"><h2>访问密码</h2></div>
            <div class="modal-body">
                <form id="change-password-form" class="form-grid">
                    <div class="form-group span-two"><label for="current-password">当前密码</label><input type="password" id="current-password" name="currentPassword" placeholder="请输入当前密码"></div>
                    <div class="form-group span-two"><label for="new-password-change">新密码</label><input type="password" id="new-password-change" name="newPassword" placeholder="请输入新密码"></div>
                    <div class="form-group span-two"><label for="confirm-password">确认新密码</label><input type="password" id="confirm-password" name="confirmPassword" placeholder="请再次输入新密码"></div>
                </form>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <div class="form-group span-two"><label>操作</label><button type="button" class="btn btn-danger" id="logout-button">退出登录</button></div>
            </div>
        </div>`;
    }

    return {
        getSiteSettingsHTML,
        getStyleSettingsHTML,
        getAdvancedSettingsHTML,
        getAddLinkHTML,
        getEditLinkHTML,
        getBulkAddHTML,
        getCategoryManagementHTML,
        getPasswordSettingsHTML
    };
})();
