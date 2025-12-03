FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache autoconf automake libtool make tiff jpeg zlib zlib-dev pkgconf nasm file gcc musl-dev

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ENV NODE_ENV=production
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
