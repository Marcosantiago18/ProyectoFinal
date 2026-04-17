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

# Sobrescribir la configuración default de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los assets de la etapa de construcción anterior
COPY --from=builder /app/dist /usr/share/nginx/html

# Exponer el puerto 80 del Nginx
EXPOSE 80

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
