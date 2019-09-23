# wj-publish
upload local files to linux server and exec commands

## 使用说明

执行命令 生成配置文件

`wj-publish example config.json`

默认配置文件如下, 需按需修改对应配置
```json5
{
        "host": "192.168.1.1",  
        "port": 22,              
        "username": "home",     
        "privatekey": "/users/xxx/desktop/xxx/ssh/xxx",  
        "passphrase": "xxx",    
        "local": "/users/xxx/desktop/project/xxx",   
        "remote": "/home/xxx/",  
        "ignore": [              
            ".idea",
            ".git",
            "node_modules"
        ],
        "clear": true,           
        "cmds": [                
            "ls -al"
        ]
    }
```
配置文件说明

* host: 服务器 ip
* port: ssh 端口号
* username: 使用的用户名
* privatekey: 本地私钥绝对路径
* passphrase: 私钥密码
* local: 本地要发布的文件/目录绝对路径
* remote: 服务器保存的目录/文件路径
* ignore: 忽略的目录(相对于local)
* clear: 是否先清空服务端文件
* cmds: 文件发布完成后, 要执行的命令


修改对应配置后, 执行命令发布

`wj-publish config.json`
