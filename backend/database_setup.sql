-- ============================================
-- SCRIPT DE INICIALIZACIÓN DE BASE DE DATOS
-- Sistema de Alquiler de Barcos - NAUTICA
-- ============================================

-- Paso 1: Crear la base de datos
CREATE DATABASE IF NOT EXISTS alquiler_barcos 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE alquiler_barcos;

-- Las tablas se crean automáticamente con SQLAlchemy cuando ejecutas app.py
-- Este script es solo para referencia de la estructura

-- ============================================
-- ESTRUCTURA DE TABLAS (Creadas por SQLAlchemy)
-- ============================================

-- Tabla: usuarios
-- Campos:
--   - id (INT, PK, AUTO_INCREMENT)
--   - nombre (VARCHAR(100), NOT NULL)
--   - email (VARCHAR(120), UNIQUE, NOT NULL)
--   - password_hash (VARCHAR(255), NOT NULL)
--   - telefono (VARCHAR(20))
--   - rol (VARCHAR(20), DEFAULT 'cliente')
--   - fecha_registro (DATETIME, DEFAULT NOW())

-- Tabla: embarcaciones
-- Campos:
--   - id (INT, PK, AUTO_INCREMENT)
--   - nombre (VARCHAR(100), NOT NULL)
--   - tipo (VARCHAR(50), NOT NULL)
--   - categoria (VARCHAR(50))
--   - capacidad (INT, NOT NULL)
--   - longitud (FLOAT)
--   - precio_dia (FLOAT, NOT NULL)
--   - descripcion (TEXT)
--   - imagen_url (VARCHAR(255))
--   - estado (VARCHAR(20), DEFAULT 'disponible')
--   - incluye_capitan (BOOLEAN, DEFAULT FALSE)
--   - incluye_tripulacion (BOOLEAN, DEFAULT FALSE)
--   - ubicacion (VARCHAR(100))
--   - rating (FLOAT, DEFAULT 0.0)
--   - fecha_creacion (DATETIME, DEFAULT NOW())

-- Tabla: reservas
-- Campos:
--   - id (INT, PK, AUTO_INCREMENT)
--   - usuario_id (INT, FK -> usuarios.id, NOT NULL)
--   - embarcacion_id (INT, FK -> embarcaciones.id, NOT NULL)
--   - fecha_inicio (DATETIME, NOT NULL)
--   - fecha_fin (DATETIME, NOT NULL)
--   - precio_total (FLOAT, NOT NULL)
--   - estado (VARCHAR(20), DEFAULT 'pendiente')
--   - tipo_evento (VARCHAR(50))
--   - notas (TEXT)
--   - fecha_creacion (DATETIME, DEFAULT NOW())

-- Tabla: mantenimientos
-- Campos:
--   - id (INT, PK, AUTO_INCREMENT)
--   - embarcacion_id (INT, FK -> embarcaciones.id, NOT NULL)
--   - tipo (VARCHAR(50), NOT NULL)
--   - descripcion (TEXT)
--   - fecha_programada (DATETIME, NOT NULL)
--   - fecha_completada (DATETIME)
--   - costo (FLOAT)
--   - estado (VARCHAR(20), DEFAULT 'programado')
--   - notas (TEXT)

-- ============================================
-- INSTRUCCIONES DE USO
-- ============================================

-- OPCIÓN 1: Crear solo la base de datos (Recomendado)
-- Ejecuta solo las primeras 3 líneas de este archivo
-- Las tablas se crearán automáticamente al ejecutar app.py

-- OPCIÓN 2: Desde phpMyAdmin (XAMPP)
-- 1. Abre http://localhost/phpmyadmin
-- 2. Click en "Nueva" para crear base de datos
-- 3. Nombre: alquiler_barcos
-- 4. Cotejamiento: utf8mb4_unicode_ci
-- 5. Click en "Crear"

-- OPCIÓN 3: Desde terminal MySQL
-- mysql -u root -p8326
-- Luego ejecuta las primeras 3 líneas de este archivo

-- ============================================
-- POBLAR CON DATOS DE EJEMPLO
-- ============================================

-- Después de crear la base de datos:
-- 1. cd backend
-- 2. venv\Scripts\activate
-- 3. python app.py  (Esto crea las tablas)
-- 4. Ctrl+C para detener
-- 5. python populate_db.py  (Esto inserta datos de ejemplo)

-- ============================================
-- VERIFICAR INSTALACIÓN
-- ============================================

-- Para verificar que todo está correcto:
-- SELECT * FROM usuarios;
-- SELECT * FROM embarcaciones;
-- SELECT * FROM reservas;
-- SELECT * FROM mantenimientos;

-- Deberías ver:
-- - 3 usuarios (1 admin, 2 clientes)
-- - 8 embarcaciones
-- - 4 reservas
-- - 3 mantenimientos

-- ============================================
-- CREDENCIALES DE ACCESO
-- ============================================

-- Admin:
--   Email: admin@nautica.com
--   Password: admin123

-- Cliente:
--   Email: john@example.com
--   Password: cliente123

-- ============================================
-- SOLUCIÓN DE PROBLEMAS
-- ============================================

-- Error: "Access denied for user 'root'@'localhost'"
-- Solución: Verifica la contraseña en backend/app.py línea 13
-- Por defecto usa: root:8326

-- Error: "Unknown database 'alquiler_barcos'"
-- Solución: Ejecuta las primeras 3 líneas de este archivo

-- Error: "Table doesn't exist"
-- Solución: Ejecuta python app.py para crear las tablas

-- ============================================
-- RESETEAR BASE DE DATOS
-- ============================================

-- Si necesitas empezar de cero:
DROP DATABASE IF EXISTS alquiler_barcos;
-- Luego ejecuta las primeras 3 líneas de este archivo
-- Y vuelve a ejecutar app.py y populate_db.py
