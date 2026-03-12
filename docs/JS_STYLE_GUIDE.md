# JavaScript 编码与注释规范

本文档旨在统一项目中的 JavaScript 代码风格，确保代码的可读性、可维护性和团队协作的一致性。所有 JS 代码都应遵循以下规范。

---

## 1. 代码排版规范

所有 JavaScript 代码的格式化应严格遵循主流的编码规范（如 Google JavaScript Style Guide），以保证代码的整洁与统一。

- **缩进 (Indentation):**
  - 每个缩进层级统一使用 **4 个空格**。

- **分号 (Semicolons):**
  - 所有语句结束后都必须使用分号 `;`。

- **换行 (Line Breaks):**
  - 在函数或独立的逻辑块之间保留 **一个空行**。
  - 每个独立的语句都应 **独占一行**。

- **空格 (Spacing):**
  - 在操作符（如 `+`, `-`, `=`）前后保留 **一个空格**。
  - 在函数名和左括号 `(` 之间 **无空格**。
  - 在代码块的左大括号 `{` 前保留 **一个空格**。

- **示例:**
  '''javascript
  // 正确的排版示例
  function calculateSum(a, b) {
      const result = a + b;
      return result;
  }
  '''

---

## 2. 注释规范

清晰、统一的注释是代码可读性的关键。

- **注释语言:**
  - 所有注释都必须使用 **中文** 编写。

- **注释格式:**
  - 统一使用双斜杠 `//` 进行单行注释。
  - 对于函数或类的复杂说明，可以使用 JSDoc 格式 `/** ... */`。

- **注释位置:**
  - 注释必须 **独占一行**，并放置在所描述的 **函数、方法或逻辑块** 的 **正上方**。
  - **严禁** 将注释写在代码行的末尾（行内注释）。

- **正确示例:**
  '''javascript
  // 初始化用户设置
  function initializeSettings(user) {
      if (!user.settings) {
          user.settings = getDefaultSettings();
      }
  }
  '''

- **错误示例:**
  '''javascript
  function initializeSettings(user) { // 错误的行内注释
      if (!user.settings) {
          user.settings = getDefaultSettings(); // 也不应在这里注释
      }
  }
  '''
