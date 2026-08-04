# Navlty

基于 Go 编写的轻量级导航仪表盘，开箱即用、快速部署、安全可靠，集链接管理、站点自定义与安全认证于一体，资源占用极低。  

## 特性

- **安全认证**：后台网站管理支持登录、登出、密码管理，会话令牌机制  
- **链接管理**：支持双面板链接、分类管理、增删改查、批量操作、拖拽排序  
- **灵活设置**：站点名称、图标、标题、头像、背景图、卡片布局均可自定义  
- **极速加载**：单一 Go 二进制，资源本地化，静态资源自动合并与压缩  
- **易于部署**：支持 Docker/Podman 容器化部署，体积小、占用低  
- **浏览器管理**：所有操作直接在 Web 界面完成，即改即存，无需重启服务  
- **自定义扩展**：支持自定义 CSS、注入外部 JS、页首/页脚 HTML 内容  

## 快速开始

使用官方容器镜像（GHCR）：  

```sh
podman run -d \
  --name navlty \
  --restart always \
  -p 8080:8080 \
  -v ./config:/config:Z \
  -e NAVLTY_SERVICE_PORT=8080 \
  -e NAVLTY_ENABLE_COMPRESSION=false \
  ghcr.io/dancying/navlty:latest
```

> 启动后浏览器访问 `http://localhost:8080` 即可。  
> 首次访问设置页面时需要新增访问密码，之后凭密码进入管理界面。  

## 环境变量说明

| 环境变量 | 默认值 | 说明 |
|---------|--------|------|
| `NAVLTY_SERVICE_PORT` | `8080` | 服务监听端口 |
| `NAVLTY_ENABLE_COMPRESSION` | `false` | 是否启用 HTTP 层响应压缩 |

> 若使用 nginx 反向代理并开启 gzip/brotli 压缩，则不建议设置 `NAVLTY_ENABLE_COMPRESSION` 变量，避免数据被双重压缩。  

## 项目结构

```
├── main.go                 # 程序入口，读取环境变量，启动服务
├── internal/
│   ├── auth.go             # 认证：密码哈希、会话创建/校验
│   ├── compress.go         # HTTP 压缩中间件（gzip/brotli，环境变量控制）
│   ├── files.go            # 文件读写、静态资源加载与压缩
│   ├── handlers.go         # HTTP 处理器：页面渲染、设置、链接、认证
│   ├── models.go           # 数据模型定义
│   ├── router.go           # 路由注册与中间件编排
│   ├── services.go         # 业务逻辑：数据加载/保存
│   └── utils.go            # 工具函数
└── web/
    ├── index.html          # 页面模板（Go 模板语法）
    ├── css/                # 样式（public 公开 / auth 认证）
    └── js/                 # 脚本（public 公开 / auth 认证）
```

## 设计理念

1. **极简后端，智能压缩**
   - 单一 Go 编译二进制，无外部依赖，极低 CPU 与内存占用
   - 静态资源输出前自动压缩，显著减少传输体积，页面加载更快

2. **自包含，按需加载**
   - 不依赖任何外部 CDN，所有 CSS/JS 均由应用自身提供，离线可用
   - 资源按认证状态划分，公开页仅加载 public 资源，管理页额外加载 auth 资源

3. **自管理，即改即生效**
   - 链接的增删改查全部在浏览器内完成，即时保存即时生效
   - 无需编辑配置文件、无需重启服务，所有操作即改即存


## 开源协议

本项目使用 MIT 许可证。

```
MIT License

Copyright (c) 2026 Dancying

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

