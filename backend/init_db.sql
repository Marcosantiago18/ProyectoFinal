-- Script de inicialización de la base de datos
-- Sistema de Alquiler de Barcos

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS alquiler_barcos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE alquiler_barcos;

-- Las tablas se crearán automáticamente con SQLAlchemy
-- Este script es solo para datos de ejemplo

-- Insertar usuario administrador
INSERT INTO usuarios (nombre, email, password_hash, telefono, rol, fecha_registro) VALUES
('Captain Reynolds', 'admin@nautica.com', 'scrypt:32768:8:1$YourHashHere', '+1-555-0100', 'admin', NOW()),
('John Smith', 'john@example.com', 'scrypt:32768:8:1$YourHashHere', '+1-555-0101', 'cliente', NOW()),
('Elena Fisher', 'elena@example.com', 'scrypt:32768:8:1$YourHashHere', '+1-555-0102', 'cliente', NOW());

-- Insertar embarcaciones de ejemplo
INSERT INTO embarcaciones (nombre, tipo, categoria, capacidad, longitud, precio_dia, descripcion, imagen_url, estado, incluye_capitan, incluye_tripulacion, ubicacion, rating) VALUES
('Azimut Grande 27', 'yacht', 'super_yacht', 12, 88, 8500.00, 'Lujoso super yate con todas las comodidades. Perfecto para eventos corporativos y celebraciones especiales.', 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800', 'disponible', TRUE, FALSE, 'French Riviera', 4.9),
('Sunseeker Predator', 'yacht', 'sport_yacht', 8, 68, 3200.00, 'Yate deportivo de alto rendimiento. Ideal para aventuras en el mar con estilo.', 'https://images.unsplash.com/photo-1605281317010-fe5ffe798166?w=800', 'en_charter', FALSE, FALSE, 'Mykonos', 4.8),
('Lagoon Seventy 7', 'sailboat', 'catamaran', 12, 77, 6000.00, 'Catamarán de lujo con tripulación incluida. Experiencia de navegación incomparable.', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800', 'disponible', TRUE, TRUE, 'Caribbean', 5.0),
('SeaDoo Spark 1', 'watercraft', 'jet_ski', 2, 10, 350.00, 'Moto de agua moderna y ágil. Diversión garantizada en el agua.', 'https://images.unsplash.com/photo-1626297852194-a2f8c3a59e45?w=800', 'mantenimiento', FALSE, FALSE, 'Miami Beach', 4.5),
('Ocean\'s Whisper', 'yacht', 'sport_yacht', 6, 50, 2800.00, 'Elegante yate deportivo para escapadas románticas o pequeños grupos.', 'https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?w=800', 'disponible', FALSE, FALSE, 'Ibiza', 4.7),
('The Golden Horizon', 'yacht', 'super_yacht', 16, 65, 5600.00, 'Super yate con capitán incluido. Lujo y confort en alta mar.', 'https://images.unsplash.com/photo-1540946485063-a40da27545f8?w=800', 'en_charter', TRUE, FALSE, 'Monaco', 4.9);

-- Insertar reservas de ejemplo
INSERT INTO reservas (usuario_id, embarcacion_id, fecha_inicio, fecha_fin, precio_total, estado, tipo_evento, notas) VALUES
(2, 1, '2023-10-24 10:00:00', '2023-10-26 18:00:00', 17000.00, 'confirmada', 'wedding', 'Evento de boda, requiere decoración especial'),
(3, 2, DATE_ADD(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 3 DAY), 6400.00, 'en_curso', 'leisure', 'Cliente VIP'),
(2, 5, DATE_ADD(NOW(), INTERVAL 7 DAY), DATE_ADD(NOW(), INTERVAL 10 DAY), 8400.00, 'pendiente', 'corporate', 'Evento corporativo para 6 personas');

-- Insertar mantenimientos de ejemplo
INSERT INTO mantenimientos (embarcacion_id, tipo, descripcion, fecha_programada, costo, estado, notas) VALUES
(4, 'preventivo', 'Revisión de motor y sistema eléctrico', '2023-11-01 09:00:00', 450.00, 'programado', 'Mantenimiento trimestral'),
(1, 'revision', 'Inspección anual completa', '2023-10-28 08:00:00', 2500.00, 'programado', 'Revisión obligatoria anual'),
(6, 'correctivo', 'Reparación de sistema de navegación', DATE_ADD(NOW(), INTERVAL 2 DAY), 800.00, 'programado', 'Urgente');
