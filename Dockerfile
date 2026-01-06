# =========================
# 1) Build (Vite)
# =========================
FROM node:22-alpine AS build

WORKDIR /app

# Copia apenas o package.json primeiro (melhor cache)
COPY package.json ./

# Como não há package-lock.json no seu projeto, usamos npm install
RUN npm install

# Copia o restante do projeto e faz o build
COPY . .
RUN npm run build


# =========================
# 2) Runtime (Nginx)
# =========================
FROM nginx:alpine

# Remove config padrão e adiciona a nossa (SPA fallback)
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia o build do Vite (dist) para o Nginx
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
