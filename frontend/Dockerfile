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

# Copiar el template de configuración
COPY nginx.conf.template /etc/nginx/conf.d/nginx.conf.template

# Copiar los assets de la etapa de construcción anterior
COPY --from=builder /app/dist /usr/share/nginx/html

# Comando de inicio: reemplaza la variable de entorno del host y el puerto en runtime, y arranca Nginx
CMD sh -c "sed -e 's/BACKEND_HOST_PLACEHOLDER/'\"${BACKEND_HOST}\"'/g' -e 's/listen 80;/listen '\"${PORT:-80}\"';/g' /etc/nginx/conf.d/nginx.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"
