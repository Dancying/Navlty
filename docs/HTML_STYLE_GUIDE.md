# HTML 编码与注释规范

本文档旨在统一项目中的 HTML 代码风格，确保代码的语义化、可读性和可访问性。

---

## 1. 代码排版规范

所有 HTML 代码都应遵循清晰、一致的排版规则。

- **文档类型 (Doctype):**
  - 必须在 HTML 文档的第一行声明 `<!DOCTYPE html>`。

- **缩进 (Indentation):**
  - 每个嵌套层级统一使用 **4 个空格**。

- **标签与属性 (Tags and Attributes):**
  - 所有标签名和属性名都必须使用 **小写**。
  - 属性值必须用 **双引号** `""` 包裹。

- **布尔属性 (Boolean Attributes):**
  - 不要为布尔属性赋值（例如，使用 `<input type="checkbox" checked>` 而不是 `checked="checked"`）。

- **语义化标签 (Semantic Tags):**
  - 优先使用 HTML5 语义化标签（如 `<main>`, `<section>`, `<article>`, `<nav>`, `<header>`, `<footer>`），以提高文档结构的可读性和无障碍性。

- **示例:**
  ```html
  <!-- 正确的排版与语义化示例 -->
  <header class="main-header">
      <nav>
          <ul>
              <li><a href="/">首页</a></li>
              <li><a href="/about">关于</a></li>
          </ul>
      </nav>
  </header>
  ```

---

## 2. 注释规范

- **注释语言:**
  - 所有注释都必须使用 **中文** 编写。

- **注释格式:**
  - 统一使用 `<!-- 中文注释 -->` 格式。

- **注释位置:**
  - 对于一个独立的功能区域或复杂的代码块，应在其 **前后** 提供注释，明确标识该区域的 **开始** 和 **结束**。
  - **严禁** 行内注释。

- **示例:**
  ```html
  <!-- 用户信息卡片开始 -->
  <div class="user-profile">
      <img src="avatar.jpg" alt="用户头像">
      <h2>用户名</h2>
  </div>
  <!-- 用户信息卡片结束 -->
  ```

---

## 3. 项目特定规范

- **资源链接 (Resource Linking):**
  - **禁止** 在 HTML 文件中使用 `<link>` 或 `<script>` 标签引入 **项目内部** 的 CSS 和 JavaScript 文件。本项目的 Go 后端会自动处理这些本地资源的内联注入。
  - **允许** 使用 `<link>` 或 `<script>` 标签引入托管在 CDN 或其他外部服务器上的 **第三方** 样式库或 JavaScript 库（例如 Bootstrap, Google Fonts, htmx.org 等）。
