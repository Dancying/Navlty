# Go 语言编码与注释规范

本文档旨在统一项目中的 Go 代码风格，确保代码的可读性、可维护性和团队协作的一致性。所有 Go 代码都应遵循以下规范。

---

## 1. 代码排版规范

Go 语言拥有强大的官方工具来保证代码风格的统一。所有代码在提交前都必须经过格式化。

- **代码格式化 (Formatting):**
  - 所有 Go 代码都必须使用 `go fmt` 或等效的 IDE 工具（如 `gopls`）进行自动格式化。这是强制性要求，可以解决绝大部分关于缩进、空格和换行的问题。

- **命名约定 (Naming Conventions):**
  - **公开 (Exported):** 使用 `PascalCase` 命名法（首字母大写）来暴露包外的变量、函数、类型和方法。
  - **私有 (Internal):** 使用 `camelCase` 命名法（首字母小写）用于包内私有的元素。
  - **缩略词 (Acronyms):** 诸如 `URL`, `ID`, `HTTP` 等缩略词应保持全大写（例如 `URL` 或 `httpURL`）。

- **行长度 (Line Length):**
  - 遵循 Go 社区的习惯，尽量保持每行代码不超过 80-120 个字符，以增强可读性。

- **示例:**
  '''go
  // 正确的排版与命名示例

  // CalculateTotalAmount 计算订单的总金额（公开函数）
  func CalculateTotalAmount(orderID string) (int, error) {
      // getOrderDetails 是一个包内私有函数
      details, err := getOrderDetails(orderID)
      if err != nil {
          return 0, err
      }
      return details.Price * details.Quantity, nil
  }
  '''

---

## 2. 注释规范

清晰、统一的注释是理解代码逻辑的关键，尤其是在 Go 这样的强类型语言中。

- **注释语言:**
  - 所有注释都必须使用 **中文** 编写。

- **注释格式:**
  - 统一使用双斜杠 `//` 进行单行注释。

- **注释位置:**
  - 注释必须 **独占一行**，并放置在所描述的 **函数、类型、方法或逻辑块** 的 **正上方**。
  - **严禁** 将注释写在代码行的末尾（行内注释）。

- **公开 API 注释:**
  - 对于所有公开的（`PascalCase`）函数、类型或变量，其注释都应该以被注释的元素名称开头。

- **正确示例:**
  '''go
  // User 代表系统中的一个用户实体。
  type User struct {
      ID   string
      Name string
  }

  // GetDefaultSettings 返回一套默认的系统设置。
  func GetDefaultSettings() *Settings {
      // 内部逻辑的简短说明
      return &Settings{
          Theme: "dark",
          PerPage: 20,
      }
  }
  '''

- **错误示例:**
  '''go
  func GetDefaultSettings() *Settings { // 错误的行内注释
      return &Settings{}
  }
  '''
