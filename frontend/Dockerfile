# Etapa 1: Construcción (Build)
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar configuración de paquetes
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copiar el código fuente
COPY . .

# Compilar la aplicación React
RUN npm run build

# Etapa 2: Nginx para servir la aplicación
FROM nginx:alpine

# Copiar la configuración principal de Nginx (forzando 1 solo worker process)
COPY nginx_main.conf /etc/nginx/nginx.conf

# Copiar el template de configuración secundaria (sitio default)
COPY nginx.conf.template /etc/nginx/conf.d/nginx.conf.template

# Copiar los assets de la etapa de construcción anterior
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar el script de arranque y darle permisos
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Usar el script como punto de entrada
ENTRYPOINT ["/entrypoint.sh"]
