# 🚢 Nautica - Sistema de Alquiler de Barcos

Sistema completo de alquiler de embarcaciones con panel de administración para empresas náuticas.

## 🎯 Características

### Frontend (React + TypeScript + Tailwind)
- ✅ **Página Principal** - Hero section con buscador funcional
- ✅ **Catálogo de Embarcaciones** - Grid con filtros avanzados
- ✅ **Página de Detalle** - Información completa y sistema de reservas
- ✅ **Dashboard de Administración** - Panel completo para gestión de flota
- ✅ **Autenticación** - Login/Register con persistencia
- ✅ **Diseño Premium** - Basado en los diseños de Stitch (Nautica/EliteFleet)

### Backend (Flask + MariaDB)
- ✅ **API REST** - Endpoints para todas las operaciones CRUD
- ✅ **Autenticación** - Sistema de usuarios con roles
- ✅ **Gestión de Embarcaciones** - CRUD completo
- ✅ **Sistema de Reservas** - Con validación de disponibilidad
- ✅ **Mantenimientos** - Programación y seguimiento
- ✅ **Dashboard Stats** - Estadísticas en tiempo real

## 📋 Requisitos Previos

- Node.js 18+ y npm
- Python 3.8+
- MariaDB/MySQL
- XAMPP (recomendado para Windows)

## 🚀 Instalación

### 1. Base de Datos

```bash
# Iniciar MySQL/MariaDB (con XAMPP o directamente)
# Crear la base de datos
mysql -u root -p8326 < backend/init_db.sql
```

### 2. Backend

```bash
cd backend

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Iniciar servidor
python app.py
```

El backend estará disponible en `http://localhost:5000`

### 3. Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

El frontend estará disponible en `http://localhost:5173`

## 👤 Credenciales de Prueba

### Administrador
- **Email:** admin@nautica.com
- **Password:** admin123

### Cliente
- **Email:** john@example.com
- **Password:** cliente123

## 📁 Estructura del Proyecto

```
alquilerbarcos/
├── backend/
│   ├── app.py                 # Aplicación Flask principal
│   ├── requirements.txt       # Dependencias Python
│   └── init_db.sql           # Script de inicialización DB
│
└── frontend/
    ├── src/
    │   ├── components/       # Componentes reutilizables
    │   │   └── shared/      # Navbar, Footer
    │   ├── contex/          # Context API (Auth)
    │   ├── pages/           # Páginas principales
    │   │   ├── Home.tsx
    │   │   ├── Dashboard.tsx
    │   │   ├── VesselDetail.tsx
    │   │   ├── SearchResults.tsx
    │   │   ├── Login.tsx
    │   │   └── Register.tsx
    │   ├── types/           # Definiciones TypeScript
    │   ├── utils/           # Utilidades (API client)
    │   ├── App.tsx          # Componente principal
    │   └── index.css        # Estilos globales
    │
    └── package.json
```

## 🎨 Funcionalidades Principales

### Página Principal
- Hero section con imagen de fondo
- Buscador funcional (ubicación, fechas, tipo)
- Fleet destacada con cards premium
- Sección "About" con estadísticas

### Panel de Administración
- **Dashboard:** Estadísticas, ingresos, charters activos
- **My Fleet:** Gestión completa de embarcaciones
- **Bookings:** Listado y gestión de reservas
- **Analytics:** Métricas y reportes
- **Messages:** Sistema de mensajería
- **Calendar:** Vista de calendario con reservas

### Página de Detalle
- Galería de imágenes
- Especificaciones técnicas
- Amenidades y características
- Formulario de reserva con cálculo automático
- Validación de disponibilidad

### Sistema de Búsqueda
- Filtros por ubicación, tipo, precio
- Grid responsive de resultados
- Ordenamiento y paginación

## 🔧 Tecnologías Utilizadas

### Frontend
- **React 19** - Framework UI
- **TypeScript** - Tipado estático
- **Tailwind CSS 4** - Estilos utility-first
- **React Router** - Navegación
- **Sonner** - Notificaciones toast

### Backend
- **Flask** - Framework web
- **SQLAlchemy** - ORM
- **Flask-CORS** - CORS handling
- **PyMySQL** - Conector MySQL
- **Werkzeug** - Seguridad (hashing passwords)

## 📊 Modelos de Datos

### Usuario
- id, nombre, email, password_hash, telefono, rol, fecha_registro

### Embarcacion
- id, nombre, tipo, categoria, capacidad, longitud, precio_dia, descripcion, imagen_url, estado, incluye_capitan, incluye_tripulacion, ubicacion, rating

### Reserva
- id, usuario_id, embarcacion_id, fecha_inicio, fecha_fin, precio_total, estado, tipo_evento, notas

### Mantenimiento
- id, embarcacion_id, tipo, descripcion, fecha_programada, fecha_completada, costo, estado, notas

## 🎯 Próximas Mejoras

- [ ] Sistema de pagos (Stripe)
- [ ] Chat en tiempo real
- [ ] Notificaciones push
- [ ] Galería de imágenes múltiples
- [ ] Sistema de reviews
- [ ] Exportación de reportes PDF
- [ ] Integración con calendario externo
- [ ] Modo oscuro/claro

## 📝 Notas de Desarrollo

- El proyecto sigue los principios **DRY** y **KISS**
- Código limpio y autodocumentado
- Type hints en Python
- Interfaces TypeScript estrictas
- Componentes funcionales React con Hooks
- Separación clara de responsabilidades

## 🐛 Solución de Problemas

### Error de conexión a la base de datos
```bash
# Verificar que MySQL esté corriendo
# Verificar credenciales en app.py (línea 13)
# Por defecto: root:8326@localhost/alquiler_barcos
```

### Error CORS
```bash
# Verificar que Flask-CORS esté instalado
# Verificar configuración en app.py (línea 16)
```

### Puerto ya en uso
```bash
# Backend: Cambiar puerto en app.py (última línea)
# Frontend: Cambiar puerto en vite.config.ts
```

## 📄 Licencia

Proyecto educativo - DWEC 2025/2026

## 👨‍💻 Autor

Marco Santiago - Desarrollo Web en Entorno Cliente
