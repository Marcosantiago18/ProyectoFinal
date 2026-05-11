from app import db, Usuario, Embarcacion, Experiencia
from datetime import datetime

def seed_all():
    print("Iniciando mega-seeder en Railway...")
    
    # 1. Crear Admin por defecto si no existe
    admin = Usuario.query.filter_by(rol='admin').first()
    if not admin:
        admin = Usuario(nombre='Administrador SeaHive', email='admin@seahive.com', telefono='+34 600 000 000', rol='admin')
        admin.set_password('admin123')
        db.session.add(admin)
        db.session.commit()
        print("Admin creado.")
    
    # 2. Crear Capitanes Estrella
    capitanes_data = [
        {'nombre': 'Jack Sparrow', 'email': 'jack@sparrow.com', 'telefono': '+1 999 888 777'},
        {'nombre': 'Amelia Earhart', 'email': 'amelia@seahive.com', 'telefono': '+1-555-0301'},
        {'nombre': 'Captain Haddock', 'email': 'haddock@seahive.com', 'telefono': '+1-555-0302'},
        {'nombre': 'Will Turner', 'email': 'will@seahive.com', 'telefono': '+1-555-0303'},
        {'nombre': 'Hector Barbossa', 'email': 'hector@seahive.com', 'telefono': '+1-555-0304'},
        {'nombre': 'Lucas Marino', 'email': 'lucas@marino.com', 'telefono': '+34 666 555 444'},
    ]
    
    caps_by_email = {}
    for data in capitanes_data:
        cap = Usuario.query.filter_by(email=data['email']).first()
        if not cap:
            cap = Usuario(nombre=data['nombre'], email=data['email'], telefono=data['telefono'], rol='capitan')
            cap.set_password('capitan123')
            db.session.add(cap)
        caps_by_email[data['email']] = cap
    db.session.commit()
    print("Capitanes creados.")

    # Recargar objetos para tener IDs válidos
    for k in list(caps_by_email.keys()):
        caps_by_email[k] = Usuario.query.filter_by(email=k).first()

    # 3. Embarcaciones de Lujo
    vessels = [
        # YACHTS
        {
            'propietario_id': caps_by_email['hector@seahive.com'].id,
            'nombre': 'The Black Pearl',
            'tipo': 'yacht',
            'categoria': 'super_yacht',
            'capacidad': 25,
            'longitud': 125,
            'precio_dia': 18000.00,
            'descripcion': 'La perla de nuestra flota. El mega yate de lujo definitivo para reyes y leyendas.',
            'imagen_url': 'https://images.unsplash.com/photo-1548119044-0baddaeccdd0?w=1200',
            'estado': 'disponible',
            'incluye_capitan': True,
            'incluye_tripulacion': True,
            'ubicacion': 'Monaco',
            'rating': 5.0
        },
        {
            'propietario_id': caps_by_email['amelia@seahive.com'].id,
            'nombre': 'Skyrider Explorer',
            'tipo': 'yacht',
            'categoria': 'sport_yacht',
            'capacidad': 10,
            'longitud': 65,
            'precio_dia': 4200.00,
            'descripcion': 'Velocidad y vistas infinitas en este yate explorador de última generación.',
            'imagen_url': 'https://images.unsplash.com/photo-1579737119782-411db103a3d2?w=1200',
            'estado': 'disponible',
            'incluye_capitan': True,
            'incluye_tripulacion': False,
            'ubicacion': 'Ibiza',
            'rating': 4.9
        },
        {
            'propietario_id': caps_by_email['haddock@seahive.com'].id,
            'nombre': 'Marlin Luxury',
            'tipo': 'yacht',
            'categoria': 'sport_yacht',
            'capacidad': 12,
            'longitud': 55,
            'precio_dia': 3500.00,
            'descripcion': 'Crucero de pesca y relax familiar con camarotes cinco estrellas.',
            'imagen_url': 'https://images.unsplash.com/photo-1563604313271-89e47766b96e?w=1200',
            'estado': 'disponible',
            'incluye_capitan': True,
            'incluye_tripulacion': False,
            'ubicacion': 'Mallorca',
            'rating': 4.7
        },
        # VELEROS / CATAMARANES
        {
            'propietario_id': caps_by_email['will@seahive.com'].id,
            'nombre': 'Flying Dutchman Cat',
            'tipo': 'sailboat',
            'categoria': 'catamaran',
            'capacidad': 14,
            'longitud': 70,
            'precio_dia': 5200.00,
            'descripcion': 'Navegación silenciosa y majestuosa a bordo del catamarán más lujoso del Mediterráneo.',
            'imagen_url': 'https://images.unsplash.com/photo-1570560868297-b08bc4443905?w=1200',
            'estado': 'disponible',
            'incluye_capitan': True,
            'incluye_tripulacion': True,
            'ubicacion': 'Marbella',
            'rating': 4.9
        },
        {
            'propietario_id': caps_by_email['jack@sparrow.com'].id,
            'nombre': 'Wicked Wench Sailboat',
            'tipo': 'sailboat',
            'categoria': 'monohull',
            'capacidad': 8,
            'longitud': 50,
            'precio_dia': 2800.00,
            'descripcion': 'Velero clásico totalmente restaurado. Siente el viento puro y el olor a mar.',
            'imagen_url': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200',
            'estado': 'disponible',
            'incluye_capitan': True,
            'incluye_tripulacion': False,
            'ubicacion': 'Caribe',
            'rating': 4.8
        },
        # MOTOS DE AGUA
        {
            'propietario_id': caps_by_email['lucas@marino.com'].id,
            'nombre': 'SeaDoo Apex Racer',
            'tipo': 'watercraft',
            'categoria': 'jet_ski',
            'capacidad': 2,
            'longitud': 10,
            'precio_dia': 450.00,
            'descripcion': 'La moto de agua más rápida del mercado. Adrenalina 100% pura.',
            'imagen_url': 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200',
            'estado': 'disponible',
            'incluye_capitan': False,
            'incluye_tripulacion': False,
            'ubicacion': 'Ibiza',
            'rating': 4.8
        },
        {
            'propietario_id': caps_by_email['amelia@seahive.com'].id,
            'nombre': 'Yamaha WaveRunner Pro',
            'tipo': 'watercraft',
            'categoria': 'jet_ski',
            'capacidad': 3,
            'longitud': 12,
            'precio_dia': 350.00,
            'descripcion': 'Estabilidad y diversión aseguradas para ti y tus amigos en las calas.',
            'imagen_url': 'https://images.unsplash.com/photo-1626297852194-a2f8c3a59e45?w=1200',
            'estado': 'disponible',
            'incluye_capitan': False,
            'incluye_tripulacion': False,
            'ubicacion': 'Santorini',
            'rating': 4.6
        }
    ]
    
    emb_added = 0
    for data in vessels:
        exists = Embarcacion.query.filter_by(nombre=data['nombre']).first()
        if not exists:
            e = Embarcacion(**data)
            db.session.add(e)
            emb_added += 1
    db.session.commit()
    print(f"Embarcaciones añadidas: {emb_added}")

    # 4. Experiencias Premium
    exp_data = [
        {
            'titulo': 'Avistamiento de Delfines',
            'subtitulo': 'Magia en el Mediterráneo',
            'descripcion': 'Embárcate en una aventura única para observar delfines en su hábitat natural.',
            'precio': 95.0, 'duracion': '3 horas', 'capacidad': '12 personas', 'emoji': '🐬',
            'gradient': 'from-cyan-500/20 to-blue-600/20',
            'highlights': 'Guía marino experto,Binoculares incluidos,Snacks y bebidas',
            'tipo_barco_compatible': 'yacht,sailboat,catamaran',
            'imagen_url': 'https://images.unsplash.com/photo-1518110203043-30ce0930a382?w=1200'
        },
        {
            'titulo': 'Paseo al Atardecer',
            'subtitulo': 'Cena romántica en el mar',
            'descripcion': 'Disfruta de los colores más impresionantes del cielo con música y champán.',
            'precio': 140.0, 'duracion': '2.5 horas', 'capacidad': '10 personas', 'emoji': '🌅',
            'gradient': 'from-orange-500/20 to-amber-600/20',
            'highlights': 'Botella de cava,Música en vivo,Reportaje fotográfico',
            'tipo_barco_compatible': 'yacht,sailboat,catamaran',
            'imagen_url': 'https://images.unsplash.com/photo-1570560868297-b08bc4443905?w=1200'
        },
        {
            'titulo': 'Ruta Extrema Motos de Agua',
            'subtitulo': 'Velocidad sin límites',
            'descripcion': 'Recorrido guiado a toda velocidad bordeando las cuevas secretas de la costa.',
            'precio': 180.0, 'duracion': '1.5 horas', 'capacidad': '4 motos', 'emoji': '🚀',
            'gradient': 'from-red-500/20 to-yellow-600/20',
            'highlights': 'Monitor experto,Traje de neopreno,Vídeo GoPro',
            'tipo_barco_compatible': 'watercraft,jet_ski',
            'imagen_url': 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200'
        }
    ]
    
    exp_added = 0
    for data in exp_data:
        exists = Experiencia.query.filter_by(titulo=data['titulo']).first()
        if not exists:
            ex = Experiencia(**data)
            db.session.add(ex)
            exp_added += 1
    db.session.commit()
    print(f"Experiencias añadidas: {exp_added}")
    
    return f"Éxito: {emb_added} barcos y {exp_added} experiencias añadidas correctamente a la nube."
