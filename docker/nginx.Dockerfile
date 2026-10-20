# 编译 web 与 h5，再交给 Nginx。构建上下文是项目根目录。
FROM node:20-alpine AS frontend
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

COPY frontend/package.json frontend/pnpm-lock.yaml frontend/pnpm-workspace.yaml frontend/tsconfig.base.json ./
COPY frontend/web/package.json web/package.json
COPY frontend/h5/package.json h5/package.json
COPY frontend/shared/package.json shared/package.json
RUN pnpm install --frozen-lockfile

COPY frontend/web web
COPY frontend/h5 h5
COPY frontend/shared shared
RUN pnpm build

FROM nginx:alpine
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY --from=frontend /app/web/dist /usr/share/nginx/html/web
COPY --from=frontend /app/h5/dist /usr/share/nginx/html/h5
