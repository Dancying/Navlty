# Navlty

一个基于 Go 语言编写的轻量化 WEB 导航面板。  


## 功能特性

✅ 本项目使用 Go 语言编写应用后端，体积小、占用低、响应快  
✅ 本项目提供主面板、副面板两种风格面板，区分高低频链接收藏  
✅ 本项目允许注入自定义 CSS 、 JS 代码，可以高度自定义面板  

> [!TIP]  
> 本项目使用 Github Actions 自动构建 docker 镜像，镜像目前仅在 [GHCR](https://github.com/Dancying/Navlty/pkgs/container/navlty) 上托管。  


## 容器运行

```sh
docker run -d \
  --name navlty \
  -p 10400:10400 \
  -v /opt/navlty/config:/config \
  -e NAVLTY_DATA_DIR="/config" \
  -e NAVLTY_SERVICE_PORT=10400 \
  -e NAVLTY_ENABLE_COMPRESSION=false \
  ghcr.io/dancying/navlty:latest
```

> [!IMPORTANT]  
> 请阅读此文档以获取最新的环境变量参数说明和对应使用场景：[docs/env.md](docs/env.md)  


## 开源协议

本项目使用 MIT 开源协议。  

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

