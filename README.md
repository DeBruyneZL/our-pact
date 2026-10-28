# 饭否（our-pact）

前后端分离的全栈项目。Web 管理端、微信小程序和共享请求层放在同一个前端工作区，Spring Boot 后端独立构建。MySQL 单独部署，不进入 `docker-compose.yml`。

## 技术栈

- 后端：Spring Boot 3.3、JDK 17、MyBatis-Plus、Sa-Token、Lombok
- Web 管理端：Vue 3、Vite、Element Plus、Vue Router、Pinia
- 小程序：uni-app、Vue 3、Pinia，微信静默登录
- 共享层：axios 请求实例、登录 API、类型和工具函数。小程序复用类型和纯函数
- 部署：Nginx 托管前端并反代 `/api`，MySQL 5.7 用独立容器

## 目录结构

```text
our-pact/
├── backend/                 # Spring Boot 后端
├── frontend/                # pnpm workspace
│   ├── web/                 # 管理端，开发端口 3000
│   ├── mp/                  # 微信小程序
│   └── shared/              # Web 与小程序共用的类型和请求层
├── docker/
│   ├── nginx.conf
│   └── mysql-init/          # 仅独立部署 MySQL 时挂载
├── docker-compose.yml       # 只有 backend 和 nginx
├── deploy-mysql.sh
└── README.md
```

## 本地开发

需要 JDK 17、Maven、Node.js 20+、pnpm、MySQL 5.7。

### 1. 准备数据库

先用下面的独立容器部署 MySQL，或在本机 MySQL 中建好库 `our_pact_db`。账号 `root`，密码 `ourpact123`。服务和数据库在同一台机器时，`application.yml` 默认连接 `127.0.0.1:3306`。表结构不靠手工导入，后端启动时由 Flyway 执行 `backend/src/main/resources/db/migration/`。

### 2. 启动后端

```bash
cd backend
mvn spring-boot:run
```

服务地址：`http://localhost:8080`。

### 3. 启动前端

```bash
cd frontend
pnpm install
pnpm dev:web
pnpm dev:mp
```

`dev:web` 与 `dev:mp` 需要各开一个终端。小程序还要在微信开发者工具中导入 `frontend/mp/dist/dev/mp-weixin`。

- 管理端：http://localhost:3000
- 小程序：微信开发者工具

Vite 已把管理端的 `/api` 代理到 `http://localhost:8080`。小程序请求地址在 `frontend/mp/src/config.ts`。

### 示例账号

超级管理员：用户名 `admin` 或手机号 `13800000000`，密码 `123456`。
普通用户：用户名 `user` 或手机号 `13900000000`，密码 `123456`。
示例密码是 `123456`，库里按 BCrypt 保存，只用于演示登录。

Web 就是管理端，登录入口在 `/login`。超级管理员登录后直接进入菜单维护。普通用户不能登录管理端，点菜使用小程序，打开即微信静默登录。个人中心默认只读，点「编辑资料」后才能改昵称和手机号；头像单独更换。用户名和超级管理员标记不可改。手机号唯一，也能用来登录。

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/auth/login` | 用户名或手机号登录，返回令牌 |
| POST | `/api/auth/wxapp` | 小程序静默登录，`wx.login` 的 code 换令牌，未注册自动开户 |
| GET | `/api/auth/me` | 当前用户，需要请求头 `Authorization` |
| POST | `/api/auth/profile` | 修改昵称和手机号 |
| POST | `/api/auth/avatar` | 上传头像，表单字段 `file` |
| GET | `/api/files/avatars/{文件名}` | 读取头像，不需要登录 |
| POST | `/api/auth/logout` | 注销 |

## 独立部署 MySQL

在 Linux 服务器的项目根目录执行：

```bash
bash deploy-mysql.sh
```

脚本会启动 `mysql:5.7`，映射 `3306`，数据放在卷 `our_pact_mysql_data`，并把 `docker/mysql-init` 挂到初始化目录。内存限制为 `--memory=512m --memory-swap=1g`，InnoDB 缓冲池 `128M`，字符集 `utf8mb4`。

初始化脚本只在数据卷第一次创建时执行。容器已存在时脚本会退出，重建前先执行 `docker rm -f our-pact-mysql`。删容器不会删数据卷。

## 用 docker-compose 部署应用

MySQL 已经启动后，在项目根目录执行一条命令即可。镜像内会编译后端和 Web 管理端，不用先在服务器上执行 `mvn package` 或 `pnpm build`。`docker-compose.yml` 里没有 MySQL。小程序单独用微信开发者工具发布。

```bash
docker compose up -d --build
```

- 管理端：http://服务器IP/login ，登录后进入菜单维护
- 小程序不由 Nginx 托管，用微信开发者工具上传 `frontend/mp` 的构建产物
- 后端与 MySQL 在同一台机器，容器使用宿主机网络，数据库地址是 `127.0.0.1:3306`
- Nginx 把 `/api` 反代到宿主机 `8080`
- 头像、菜品图、活动照片分别在宿主机 `/data/our-pact/avatars`、`/data/our-pact/dishes`、`/data/our-pact/activities`，挂进后端容器同一路径。`network_mode: host` 不影响这些卷。重建容器不会删这些目录；删掉项目源码目录（如 `our-pact-main/`）也不会影响它们
- 小程序登录读 `WX_APP_ID`、`WX_APP_SECRET`。在项目根目录建 `.env`（已被 git 忽略）写入这两项，再 `docker compose up -d`。只改环境变量不用 `--build`

数据库不在本机时，再通过环境变量 `MYSQL_HOST`、`MYSQL_PORT` 覆盖。

## 2G 内存服务器注意事项

- MySQL 已限制在 512MB，交换上限 1GB，`innodb_buffer_pool_size=128M`。不要再把缓冲池调大。
- 后端默认堆是 `-Xms256m -Xmx768m`，避免和 MySQL 512MB 叠在 2G 机器上把内存打满。内存更大时用环境变量 `JAVA_OPTS` 覆盖，并确认机器有交换分区。
- 不要在同一台 2G 机器上再跑 Redis 或其他数据库。本项目也没有引入 Redis。
- 数据卷 `our_pact_mysql_data` 会持续占用磁盘，留意磁盘剩余空间。
- 上线后用 `docker stats` 看 backend 和 MySQL 的实际占用，出现频繁 OOM 时先降 JVM 堆，不要先加大 MySQL 内存。
