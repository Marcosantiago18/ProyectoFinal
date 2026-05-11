#!/bin/sh
# Forzar reconstrucción total en Railway - Hash: 9923
set -e

echo "🚀 Configurando Nginx para escuchar en puerto: ${PORT:-80}"
echo "📡 Apuntando backend proxy a: ${BACKEND_HOST}"

# Reemplaza los placeholders en la plantilla y guarda en el archivo de configuración final de nginx
sed -e "s|BACKEND_HOST_PLACEHOLDER|${BACKEND_HOST}|g" \
    -e "s|listen 80;|listen ${PORT:-80};|g" \
    /etc/nginx/conf.d/nginx.conf.template > /etc/nginx/conf.d/default.conf

echo "✅ Configuración generada exitosamente:"
cat /etc/nginx/conf.d/default.conf | grep "proxy_pass"

# Ejecuta el comando original de Nginx
exec nginx -g "daemon off;"
