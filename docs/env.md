# 环境变量


## NAVLTY_DATA_DIR

数据储存位置，默认 `NAVLTY_DATA_DIR=/config` 。  


## NAVLTY_SERVICE_PORT

后端服务监听端口，默认 `NAVLTY_SERVICE_PORT=10400` 。  


## NAVLTY_ENABLE_COMPRESSION

是否开启 HTTP 层压缩，默认 `NAVLTY_ENABLE_COMPRESSION=false` 。  

此功能与 Nginx 等软件的 gzip/brotli 压缩冲突，不建议两者同时使用。  

