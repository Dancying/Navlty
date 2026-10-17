window.App = window.App || {};

App.views = (function() {

    const uploadIconSVG = `<i data-feather="upload"></i>`;

    // getAddLinkHTML 返回添加链接表单的 HTML 结构
    function getAddLinkHTML() {
        return `
            <div id="content-add-link" class="settings-content-panel">
                <div class="modal-body">
                    <form id="add-link-form" class="form-grid">
                        <input type="hidden" id="add-link-target-panel" name="targetPanel">
                        <div class="form-group">
                            <label for="link-title">标题*</label>
                            <input type="text" id="link-title" name="title" placeholder="Google" required>
                        </div>
                        <div class="form-group">
                            <label for="link-url">链接*</label>
                            <input type="url" id="link-url" name="url" placeholder="https://google.com" required>
                        </div>
                        <div class="form-group searchable-select-wrapper">
                            <label for="link-category">分类</label>
                            <div class="input-with-button">
                                <input type="text" id="link-category" name="category" placeholder="搜索引擎" autocomplete="off">
                                <button type="button" id="link-category-panel-btn" class="btn category-panel-btn">主</button>
                            </div>
                            <div id="link-category-results" class="search-results-list"></div>
                        </div>
                        <div class="form-group">
                            <label for="link-icon">图标</label>
                            <div class="input-with-button">
                                <input type="text" id="link-icon" name="icon" placeholder="Feather 图标名、URL、SVG 代码或 Base64">
                                <button type="button" id="upload-icon-button" class="btn icon-button">${uploadIconSVG}</button>
                                <input type="file" id="icon-file-input" class="hidden-file-input" accept="image/*">
                            </div>
                        </div>
                        <div class="form-group span-two">
                            <label for="link-description">描述</label>
                            <textarea id="link-description" name="description" rows="4" placeholder="全球最大的搜索引擎"></textarea>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    // getBulkAddHTML 返回批量添加链接表单的 HTML 结构
    function getBulkAddHTML() {
        return `
            <div id="content-bulk-add" class="settings-content-panel">
                <div class="modal-body">
                    <form id="bulk-add-form">
                        <div class="form-group">
                            <div class="bulk-label-row">
                                <label for="bulk-links">批量链接</label>
                                <button type="button" id="bulk-add-target-panel-btn" class="btn btn-primary">主面板</button>
                            </div>
                            <input type="hidden" id="bulk-add-target-panel" name="targetPanel" value="primary">
                            <textarea id="bulk-links" name="bulk-links" placeholder="标题 | URL | 分类(可选) | 图标URL(可选) | 描述(可选)"></textarea>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    // getEditLinkHTML 返回编辑链接表单的 HTML 结构
    function getEditLinkHTML() {
        return `
            <div id="content-edit-link" class="settings-content-panel">
                <div class="modal-body">
                    <form id="edit-link-form" class="form-grid">
                        <input type="hidden" id="edit-link-target-panel" name="targetPanel">
                        <div class="form-group span-two searchable-select-wrapper">
                            <label for="edit-link-search-input">选择链接</label>
                            <input type="text" id="edit-link-search-input" placeholder="搜索标题、URL、分类..." autocomplete="off">
                            <div id="edit-link-search-results" class="search-results-list"></div>
                        </div>
                        <div class="form-group">
                            <label for="edit-link-title">标题*</label>
                            <input type="text" id="edit-link-title" name="title" placeholder="Google" required disabled>
                        </div>
                        <div class="form-group">
                            <label for="edit-link-url">链接*</label>
                            <input type="url" id="edit-link-url" name="url" placeholder="https://google.com" required disabled>
                        </div>
                        <div class="form-group searchable-select-wrapper">
                            <label for="edit-link-category">分类</label>
                            <div class="input-with-button">
                                <input type="text" id="edit-link-category" name="category" placeholder="搜索引擎" autocomplete="off" disabled>
                                <button type="button" id="edit-link-category-panel-btn" class="btn category-panel-btn">主</button>
                            </div>
                            <div id="edit-link-category-results" class="search-results-list"></div>
                        </div>
                        <div class="form-group">
                            <label for="edit-link-icon">图标</label>
                            <div class="input-with-button">
                                <input type="text" id="edit-link-icon" name="icon" placeholder="Feather 图标名、URL、SVG 代码或 Base64" disabled>
                                <button type="button" id="upload-edit-icon-button" class="btn icon-button" disabled>${uploadIconSVG}</button>
                                <input type="file" id="edit-icon-file-input" class="hidden-file-input" accept="image/*">
                            </div>
                        </div>
                        <div class="form-group span-two">
                            <label for="edit-link-description">描述</label>
                            <textarea id="edit-link-description" name="description" rows="4" placeholder="全球最大的搜索引擎" disabled></textarea>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    // getCategoryManagementHTML 返回分类管理界面的 HTML 结构
    function getCategoryManagementHTML() {
        return `
            <div id="content-category-management" class="settings-content-panel">
                <div class="modal-body" id="category-management-body" data-dnd-target="category-container">
                    <ul class="management-link-list" data-dnd-target="link-container"></ul>
                </div>
            </div>
        `;
    }

    // getSiteAppearanceHTML 返回站点外观设置的 HTML 结构
    function getSiteAppearanceHTML() {
        return `
            <div id="content-site-appearance" class="settings-content-panel">
                <div class="modal-body">
                    <form id="site-appearance-form" class="form-grid">
                        <div class="form-group">
                            <label for="site-name">站点名称</label>
                            <input type="text" id="site-name" name="siteName" placeholder="显示在标签页的名称">
                        </div>
                        <div class="form-group">
                            <label for="site-icon">站点图标</label>
                            <div class="input-with-button">
                                <input type="text" id="site-icon" name="siteIcon" placeholder="URL 或 Base64">
                                <button type="button" id="upload-site-icon-button" class="btn icon-button">${uploadIconSVG}</button>
                                <input type="file" id="site-icon-file-input" class="hidden-file-input" accept="image/*">
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="site-title">网站标题</label>
                            <input type="text" id="site-title" name="siteTitle" placeholder="显示在主页的标题">
                        </div>
                        <div class="form-group">
                            <label for="avatar-url">网站头像</label>
                            <div class="input-with-button">
                                <input type="text" id="avatar-url" name="avatarURL" placeholder="URL 或 Base64">
                                <button type="button" id="upload-avatar-button" class="btn icon-button">${uploadIconSVG}</button>
                                <input type="file" id="avatar-file-input" class="hidden-file-input" accept="image/*">
                            </div>
                        </div>
                        <div class="form-group searchable-select-wrapper">
                            <label for="theme">主题颜色</label>
                            <input type="text" id="theme" name="theme" placeholder="选择主题色调" autocomplete="off">
                            <div id="theme-results" class="search-results-list"></div>
                        </div>
                        <div class="form-group">
                            <label for="background-url">背景图片</label>
                            <input type="text" id="background-url" name="backgroundURL" placeholder="图片 URL">
                        </div>
                        <div class="form-group span-two slider-group">
                            <label for="background-blur">背景模糊: <span id="background-blur-value">5</span>px</label>
                            <input type="range" id="background-blur" name="backgroundBlur" min="0" max="20" value="5" class="slider">
                        </div>
                        <div class="form-group span-two slider-group">
                            <label for="cards-per-row">卡片列数: <span id="cards-per-row-value">4</span></label>
                            <input type="range" id="cards-per-row" name="cardsPerRow" min="1" max="30" value="4" class="slider">
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    // getAdvancedSettingsHTML 返回高级设置的 HTML 结构
    function getAdvancedSettingsHTML() {
        return `
            <div id="content-advanced-settings" class="settings-content-panel">
                <div class="modal-body">
                    <form id="advanced-settings-form" class="form-grid">
                        <div class="form-group span-two">
                            <label for="custom-css">自定义 CSS</label>
                            <textarea id="custom-css" name="customCSS" rows="4" placeholder="支持 CSS 代码，例如：body { background: #fafafa; }"></textarea>
                        </div>
                        <div class="form-group span-two">
                            <label for="custom-js">自定义 JS</label>
                            <textarea id="custom-js" name="customJS" rows="4" placeholder="支持 HTML/JS 代码，例如：<script>alert('Hi');</script>"></textarea>
                        </div>
                        <div class="form-group span-two">
                            <label for="footer-content">页脚内容</label>
                            <textarea id="footer-content" name="footerContent" rows="4" placeholder="支持 HTML 代码，例如：<a href='https://beian.miit.gov.cn'>京ICP备00000000号-1</a>"></textarea>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    // getPasswordSettingsHTML 返回密码设置表单的 HTML 结构
    function getPasswordSettingsHTML() {
        return `
            <div id="content-password-settings" class="settings-content-panel">
                <div class="modal-body">
                    <form id="change-password-form" class="form-grid">
                        <div class="form-group span-two">
                            <label for="current-password">当前密码</label>
                            <input type="password" id="current-password" name="currentPassword" placeholder="请输入当前密码">
                        </div>
                        <div class="form-group span-two">
                            <label for="new-password-change">新密码</label>
                            <input type="password" id="new-password-change" name="newPassword" placeholder="请输入新密码">
                        </div>
                        <div class="form-group span-two">
                            <label for="confirm-password">确认新密码</label>
                            <input type="password" id="confirm-password" name="confirmPassword" placeholder="请再次输入新密码">
                        </div>
                    </form>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <div class="form-group span-two">
                        <button type="button" class="btn btn-danger" id="logout-button">退出登录</button>
                    </div>
                </div>
            </div>
        `;
    }

    return {
        getAddLinkHTML,
        getBulkAddHTML,
        getEditLinkHTML,
        getCategoryManagementHTML,
        getSiteAppearanceHTML,
        getAdvancedSettingsHTML,
        getPasswordSettingsHTML
    };
})();