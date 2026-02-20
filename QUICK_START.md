# 🚀 Guía de Inicio Rápido - Nautica

## ⚡ Instalación en 5 Pasos

### 1️⃣ Preparar la Base de Datos

```bash
# Opción A: Con XAMPP
# 1. Abre XAMPP Control Panel
# 2. Inicia Apache y MySQL
# 3. Abre phpMyAdmin (http://localhost/phpmyadmin)
# 4. Crea una base de datos llamada "alquiler_barcos"

# Opción B: Desde terminal
mysql -u root -p8326 -e "CREATE DATABASE alquiler_barcos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### 2️⃣ Configurar Backend

```bash
cd backend

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Inicializar y poblar la base de datos
python app.py  # Esto crea las tablas
# Ctrl+C para detener

python populate_db.py  # Esto inserta datos de ejemplo
```

### 3️⃣ Configurar Frontend

```bash
cd frontend

# Instalar dependencias
npm install
```

### 4️⃣ Iniciar el Proyecto

**Opción A: Script automático (Recomendado)**
```bash
# Desde la raíz del proyecto
start.bat
```

**Opción B: Manual**
```bash
# Terminal 1 - Backend
cd backend
venv\Scripts\activate
python app.py

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 5️⃣ Acceder a la Aplicación

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000
- **Credenciales Admin:** admin@nautica.com / admin123

## 🎯 Funcionalidades Principales

### Para Usuarios (Clientes)
1. **Explorar Embarcaciones** - Navega por el catálogo
2. **Buscar y Filtrar** - Usa el buscador de la página principal
3. **Ver Detalles** - Click en cualquier embarcación
4. **Hacer Reserva** - Selecciona fechas y reserva

### Para Administradores
1. **Login** - Usa las credenciales de admin
2. **Dashboard** - Vista general de estadísticas
3. **My Fleet** - Gestiona tus embarcaciones
4. **Bookings** - Administra reservas
5. **Analytics** - Revisa métricas

## 🔧 Solución de Problemas Comunes

### ❌ Error: "No module named 'flask'"
```bash
# Asegúrate de estar en el entorno virtual
cd backend
venv\Scripts\activate
pip install -r requirements.txt
```

### ❌ Error: "Can't connect to MySQL server"
```bash
# Verifica que MySQL esté corriendo
# En XAMPP: Inicia el servicio MySQL
# Verifica la contraseña en backend/app.py línea 13
```

### ❌ Error: "Port 5000 is already in use"
```bash
# Cambia el puerto en backend/app.py última línea:
# app.run(debug=True, port=5001)
```

### ❌ Error: "npm ERR! code ENOENT"
```bash
cd frontend
npm install
```

## 📱 Estructura de URLs

### Frontend
- `/` - Página principal
- `/search` - Resultados de búsqueda
- `/vessel/:id` - Detalle de embarcación
- `/login` - Inicio de sesión
- `/register` - Registro
- `/dashboard` - Panel de administración (requiere login admin)

### Backend API
- `GET /api/embarcaciones` - Listar embarcaciones
- `GET /api/embarcaciones/:id` - Detalle de embarcación
- `POST /api/reservas` - Crear reserva
- `GET /api/dashboard/stats` - Estadísticas (requiere auth)

## 🎨 Personalización

### Cambiar Colores
Edita `frontend/src/index.css` líneas 4-14:
```css
:root {
  --color-ocean-dark: #0a1628;
  --color-gold: #d4af37;
  /* ... más colores */
}
```

### Cambiar Imágenes
Las URLs de imágenes están en `backend/populate_db.py`

### Agregar Embarcaciones
Usa el panel de administración o edita `populate_db.py`

## 📊 Datos de Ejemplo

El script `populate_db.py` crea:
- ✅ 3 usuarios (1 admin, 2 clientes)
- ✅ 8 embarcaciones (yachts, sailboats, watercraft)
- ✅ 4 reservas (diferentes estados)
- ✅ 3 mantenimientos programados

## 🚀 Despliegue en Producción

### Backend (Flask)
- Usar Gunicorn como servidor WSGI
- Configurar variables de entorno
- Usar PostgreSQL en lugar de MySQL (opcional)

### Frontend (React)
```bash
cd frontend
npm run build
# Los archivos estarán en dist/
```

## 📞 Soporte

Si encuentras algún problema:
1. Revisa esta guía
2. Verifica los logs en la consola
3. Consulta el README.md principal

---

**¡Disfruta navegando con Nautica! ⛵**
