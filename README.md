# 你我约定（our-pact）

前后端分离的全栈项目。Web 管理端、H5 和共享请求层放在同一个前端工作区，Spring Boot 后端独立构建。MySQL 单独部署，不进入 `docker-compose.yml`。

## 技术栈

- 后端：Spring Boot 3.3、JDK 17、MyBatis-Plus、Sa-Token、Lombok
- Web：Vue 3、Vite、Element Plus、Vue Router、Pinia
- H5：Vue 3、Vite、Vant 4、Vue Router、Pinia
- 共享层：axios 请求实例、登录 API、类型和工具函数
- 部署：Nginx 托管前端并反代 `/api`，MySQL 5.7 用独立容器

## 目录结构

```text
our-pact/
├── backend/                 # Spring Boot 后端
├── frontend/                # pnpm workspace
│   ├── web/                 # 管理端，开发端口 3000
│   ├── h5/                  # 移动端，开发端口 3001
│   └── shared/              # 两端共用的请求层
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
pnpm dev:h5
```

两个命令需要各开一个终端。

- 管理端：http://localhost:3000
- H5：http://localhost:3001

Vite 已把 `/api` 代理到 `http://localhost:8080`。

### 示例账号

用户名 `admin`，密码 `123456`。密码按明文保存在示例表里，只用于演示登录。

登录后管理端和 H5 都会请求 `GET /api/auth/me`，用 Sa-Token 校验当前用户。

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/auth/login` | 登录，返回令牌 |
| GET | `/api/auth/me` | 当前用户，需要请求头 `Authorization` |
| POST | `/api/auth/logout` | 注销 |

## 独立部署 MySQL

在 Linux 服务器的项目根目录执行：

```bash
bash deploy-mysql.sh
```

脚本会启动 `mysql:5.7`，映射 `3306`，数据放在卷 `our_pact_mysql_data`，并把 `docker/mysql-init` 挂到初始化目录。内存限制为 `--memory=512m --memory-swap=1g`，InnoDB 缓冲池 `128M`，字符集 `utf8mb4`。

初始化脚本只在数据卷第一次创建时执行。容器已存在时脚本会退出，重建前先执行 `docker rm -f our-pact-mysql`。删容器不会删数据卷。

## 用 docker-compose 部署应用

先启动 MySQL，再打包后端和前端。`docker-compose.yml` 里没有 MySQL。

```bash
cd backend
mvn package -DskipTests

cd ../frontend
pnpm install
pnpm build

cd ..
docker compose up -d --build
```

- 管理端：http://服务器IP/
- H5：http://服务器IP/h5/
- 后端与 MySQL 在同一台机器，容器使用宿主机网络，数据库地址是 `127.0.0.1:3306`
- Nginx 把 `/api` 反代到宿主机 `8080`

数据库不在本机时，再通过环境变量 `MYSQL_HOST`、`MYSQL_PORT` 覆盖。

## 2G 内存服务器注意事项

- MySQL 已限制在 512MB，交换上限 1GB，`innodb_buffer_pool_size=128M`。不要再把缓冲池调大。
- 当前 Dockerfile 的 JVM 参数是 `-Xms1024m -Xmx2048m`。2G 机器上再叠加 MySQL 512MB、Nginx 和系统占用，堆上限 2G 会把内存打满。部署到 2G 服务器时，把启动参数改成大约 `-Xms256m -Xmx768m`，并确认机器有交换分区。
- 不要在同一台 2G 机器上再跑 Redis 或其他数据库。本项目也没有引入 Redis。
- 数据卷 `our_pact_mysql_data` 会持续占用磁盘，留意磁盘剩余空间。
- 上线后用 `docker stats` 看 backend 和 MySQL 的实际占用，出现频繁 OOM 时先降 JVM 堆，不要先加大 MySQL 内存。
