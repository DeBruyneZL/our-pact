# 编译 Web 管理端，再交给 Nginx。构建上下文是项目根目录。
FROM node:20-alpine AS frontend
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.30.3 --activate

COPY frontend/package.json frontend/pnpm-lock.yaml frontend/pnpm-workspace.yaml frontend/tsconfig.base.json ./
COPY frontend/web/package.json web/package.json
COPY frontend/mp/package.json mp/package.json
COPY frontend/shared/package.json shared/package.json
RUN pnpm install --frozen-lockfile --filter @our-pact/web...

COPY frontend/web web
COPY frontend/shared shared
RUN pnpm --filter @our-pact/web build

FROM nginx:alpine
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY --from=frontend /app/web/dist /usr/share/nginx/html/web
