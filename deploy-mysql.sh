#!/usr/bin/env bash
# 独立部署 MySQL 5.7，不加入 docker-compose。
set -euo pipefail

cd "$(dirname "$0")"

if docker ps -a --format '{{.Names}}' | grep -qx 'our-pact-mysql'; then
  echo "容器 our-pact-mysql 已存在。若要重建，请先执行: docker rm -f our-pact-mysql"
  exit 1
fi

docker run -d \
  --name our-pact-mysql \
  --restart unless-stopped \
  -p 3306:3306 \
  -v our_pact_mysql_data:/var/lib/mysql \
  -v ./docker/mysql-init:/docker-entrypoint-initdb.d \
  --memory=512m \
  --memory-swap=1g \
  -e MYSQL_ROOT_PASSWORD=ourpact123 \
  -e MYSQL_DATABASE=our_pact_db \
  -e TZ=Asia/Shanghai \
  mysql:5.7 \
  --innodb-buffer-pool-size=128M \
  --character-set-server=utf8mb4 \
  --collation-server=utf8mb4_unicode_ci

echo "MySQL 5.7 已启动：端口 3306，数据库 our_pact_db，root 密码 ourpact123"
echo "表结构由后端启动时的 Flyway 执行。"
