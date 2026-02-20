"""
Script para poblar la base de datos con datos de ejemplo
Ejecutar después de inicializar la base de datos
"""
from app import app, db, Usuario, Embarcacion, Reserva, Mantenimiento
from datetime import datetime, timedelta

def populate_database():
    with app.app_context():
        # Limpiar datos existentes
        print("🗑️  Limpiando datos existentes...")
        Mantenimiento.query.delete()
        Reserva.query.delete()
        Embarcacion.query.delete()
        Usuario.query.delete()
        db.session.commit()

        # Crear usuarios
        print("👥 Creando usuarios...")
        admin = Usuario(
            nombre='Captain Reynolds',
            email='admin@nautica.com',
            telefono='+1-555-0100',
            rol='admin'
        )
        admin.set_password('admin123')

        cliente1 = Usuario(
            nombre='John Smith',
            email='john@example.com',
            telefono='+1-555-0101',
            rol='cliente'
        )
        cliente1.set_password('cliente123')

        cliente2 = Usuario(
            nombre='Elena Fisher',
            email='elena@example.com',
            telefono='+1-555-0102',
            rol='cliente'
        )
        cliente2.set_password('cliente123')

        db.session.add_all([admin, cliente1, cliente2])
        db.session.commit()
        print(f"✅ Creados {Usuario.query.count()} usuarios")

        # Crear embarcaciones
        print("🚢 Creando embarcaciones...")
        embarcaciones_data = [
            {
                'nombre': 'Azimut Grande 27',
                'tipo': 'yacht',
                'categoria': 'super_yacht',
                'capacidad': 12,
                'longitud': 88,
                'precio_dia': 8500.00,
                'descripcion': 'Lujoso super yate con todas las comodidades. Perfecto para eventos corporativos y celebraciones especiales.',
                'imagen_url': 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800',
                'estado': 'disponible',
                'incluye_capitan': True,
                'incluye_tripulacion': False,
                'ubicacion': 'French Riviera',
                'rating': 4.9
            },
            {
                'nombre': 'Sunseeker Predator',
                'tipo': 'yacht',
                'categoria': 'sport_yacht',
                'capacidad': 8,
                'longitud': 68,
                'precio_dia': 3200.00,
                'descripcion': 'Yate deportivo de alto rendimiento. Ideal para aventuras en el mar con estilo.',
                'imagen_url': 'https://images.unsplash.com/photo-1605281317010-fe5ffe798166?w=800',
                'estado': 'en_charter',
                'incluye_capitan': False,
                'incluye_tripulacion': False,
                'ubicacion': 'Mykonos',
                'rating': 4.8
            },
            {
                'nombre': 'Lagoon Seventy 7',
                'tipo': 'sailboat',
                'categoria': 'catamaran',
                'capacidad': 12,
                'longitud': 77,
                'precio_dia': 6000.00,
                'descripcion': 'Catamarán de lujo con tripulación incluida. Experiencia de navegación incomparable.',
                'imagen_url': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
                'estado': 'disponible',
                'incluye_capitan': True,
                'incluye_tripulacion': True,
                'ubicacion': 'Caribbean',
                'rating': 5.0
            },
            {
                'nombre': 'SeaDoo Spark 1',
                'tipo': 'watercraft',
                'categoria': 'jet_ski',
                'capacidad': 2,
                'longitud': 10,
                'precio_dia': 350.00,
                'descripcion': 'Moto de agua moderna y ágil. Diversión garantizada en el agua.',
                'imagen_url': 'https://images.unsplash.com/photo-1626297852194-a2f8c3a59e45?w=800',
                'estado': 'mantenimiento',
                'incluye_capitan': False,
                'incluye_tripulacion': False,
                'ubicacion': 'Miami Beach',
                'rating': 4.5
            },
            {
                'nombre': "Ocean's Whisper",
                'tipo': 'yacht',
                'categoria': 'sport_yacht',
                'capacidad': 6,
                'longitud': 50,
                'precio_dia': 2800.00,
                'descripcion': 'Elegante yate deportivo para escapadas románticas o pequeños grupos.',
                'imagen_url': 'https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?w=800',
                'estado': 'disponible',
                'incluye_capitan': False,
                'incluye_tripulacion': False,
                'ubicacion': 'Ibiza',
                'rating': 4.7
            },
            {
                'nombre': 'The Golden Horizon',
                'tipo': 'yacht',
                'categoria': 'super_yacht',
                'capacidad': 16,
                'longitud': 65,
                'precio_dia': 5600.00,
                'descripcion': 'Super yate con capitán incluido. Lujo y confort en alta mar.',
                'imagen_url': 'https://images.unsplash.com/photo-1540946485063-a40da27545f8?w=800',
                'estado': 'en_charter',
                'incluye_capitan': True,
                'incluye_tripulacion': False,
                'ubicacion': 'Monaco',
                'rating': 4.9
            },
            {
                'nombre': 'Blue Horizon',
                'tipo': 'sailboat',
                'categoria': 'sailing_yacht',
                'capacidad': 8,
                'longitud': 55,
                'precio_dia': 2500.00,
                'descripcion': 'Velero clásico para una experiencia auténtica de navegación.',
                'imagen_url': 'https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?w=800',
                'estado': 'disponible',
                'incluye_capitan': True,
                'incluye_tripulacion': False,
                'ubicacion': 'Santorini',
                'rating': 4.6
            },
            {
                'nombre': 'Wave Runner Pro',
                'tipo': 'watercraft',
                'categoria': 'jet_ski',
                'capacidad': 3,
                'longitud': 12,
                'precio_dia': 450.00,
                'descripcion': 'Moto de agua de alta potencia para los amantes de la velocidad.',
                'imagen_url': 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
                'estado': 'disponible',
                'incluye_capitan': False,
                'incluye_tripulacion': False,
                'ubicacion': 'Dubai',
                'rating': 4.4
            }
        ]

        embarcaciones = [Embarcacion(**data) for data in embarcaciones_data]
        db.session.add_all(embarcaciones)
        db.session.commit()
        print(f"✅ Creadas {Embarcacion.query.count()} embarcaciones")

        # Crear reservas
        print("📅 Creando reservas...")
        reservas_data = [
            {
                'usuario_id': cliente1.id,
                'embarcacion_id': embarcaciones[0].id,
                'fecha_inicio': datetime.now() + timedelta(days=7),
                'fecha_fin': datetime.now() + timedelta(days=9),
                'precio_total': 17000.00,
                'estado': 'confirmada',
                'tipo_evento': 'wedding',
                'notas': 'Evento de boda, requiere decoración especial'
            },
            {
                'usuario_id': cliente2.id,
                'embarcacion_id': embarcaciones[1].id,
                'fecha_inicio': datetime.now() + timedelta(days=1),
                'fecha_fin': datetime.now() + timedelta(days=3),
                'precio_total': 6400.00,
                'estado': 'en_curso',
                'tipo_evento': 'leisure',
                'notas': 'Cliente VIP'
            },
            {
                'usuario_id': cliente1.id,
                'embarcacion_id': embarcaciones[4].id,
                'fecha_inicio': datetime.now() + timedelta(days=14),
                'fecha_fin': datetime.now() + timedelta(days=17),
                'precio_total': 8400.00,
                'estado': 'pendiente',
                'tipo_evento': 'corporate',
                'notas': 'Evento corporativo para 6 personas'
            },
            {
                'usuario_id': cliente2.id,
                'embarcacion_id': embarcaciones[2].id,
                'fecha_inicio': datetime.now() + timedelta(days=21),
                'fecha_fin': datetime.now() + timedelta(days=28),
                'precio_total': 42000.00,
                'estado': 'confirmada',
                'tipo_evento': 'leisure',
                'notas': 'Vacaciones familiares'
            }
        ]

        reservas = [Reserva(**data) for data in reservas_data]
        db.session.add_all(reservas)
        db.session.commit()
        print(f"✅ Creadas {Reserva.query.count()} reservas")

        # Crear mantenimientos
        print("🔧 Creando mantenimientos...")
        mantenimientos_data = [
            {
                'embarcacion_id': embarcaciones[3].id,
                'tipo': 'preventivo',
                'descripcion': 'Revisión de motor y sistema eléctrico',
                'fecha_programada': datetime.now() + timedelta(days=5),
                'costo': 450.00,
                'estado': 'programado',
                'notas': 'Mantenimiento trimestral'
            },
            {
                'embarcacion_id': embarcaciones[0].id,
                'tipo': 'revision',
                'descripcion': 'Inspección anual completa',
                'fecha_programada': datetime.now() + timedelta(days=30),
                'costo': 2500.00,
                'estado': 'programado',
                'notas': 'Revisión obligatoria anual'
            },
            {
                'embarcacion_id': embarcaciones[5].id,
                'tipo': 'correctivo',
                'descripcion': 'Reparación de sistema de navegación',
                'fecha_programada': datetime.now() + timedelta(days=2),
                'costo': 800.00,
                'estado': 'programado',
                'notas': 'Urgente'
            }
        ]

        mantenimientos = [Mantenimiento(**data) for data in mantenimientos_data]
        db.session.add_all(mantenimientos)
        db.session.commit()
        print(f"✅ Creados {Mantenimiento.query.count()} mantenimientos")

        print("\n✨ Base de datos poblada exitosamente!")
        print("\n📊 Resumen:")
        print(f"   - Usuarios: {Usuario.query.count()}")
        print(f"   - Embarcaciones: {Embarcacion.query.count()}")
        print(f"   - Reservas: {Reserva.query.count()}")
        print(f"   - Mantenimientos: {Mantenimiento.query.count()}")
        print("\n👤 Credenciales de acceso:")
        print("   Admin: admin@nautica.com / admin123")
        print("   Cliente: john@example.com / cliente123")

if __name__ == '__main__':
    populate_database()
