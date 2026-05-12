from datetime import datetime

def seed_all(db, Usuario, Embarcacion, Experiencia):
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
            'imagen_url': '/images/fleet/black_pearl.png',
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
            'imagen_url': '/images/fleet/amelia_explorer.png',
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
            'imagen_url': '/images/fleet/marlin_cruiser.png',
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
            'imagen_url': '/images/fleet/dutchman_sailing.png',
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
            'imagen_url': '/images/fleet/sparrow_spark.png',
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
            'imagen_url': '/images/fleet/seadoo_gtx.png',
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
            'imagen_url': '/images/fleet/yamaha_waverunner.png',
            'estado': 'disponible',
            'incluye_capitan': False,
            'incluye_tripulacion': False,
            'ubicacion': 'Santorini',
            'rating': 4.6
        },
        # -- NUEVAS EMBARCACIONES PARA RELLENAR LA APLICACIÓN --
        {
            'propietario_id': caps_by_email['jack@sparrow.com'].id,
            'nombre': 'Ocean Sovereign',
            'tipo': 'yacht',
            'categoria': 'super_yacht',
            'capacidad': 20,
            'longitud': 140,
            'precio_dia': 22000.00,
            'descripcion': 'El epítome del lujo naval. Disfruta de la máxima privacidad, cine a bordo y piscina infinita en este superyate espectacular.',
            'imagen_url': 'https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?w=1200',
            'estado': 'disponible',
            'incluye_capitan': True,
            'incluye_tripulacion': True,
            'ubicacion': 'Mónaco',
            'rating': 5.0
        },
        {
            'propietario_id': caps_by_email['haddock@seahive.com'].id,
            'nombre': 'Azure Dreamer',
            'tipo': 'yacht',
            'categoria': 'sport_yacht',
            'capacidad': 12,
            'longitud': 75,
            'precio_dia': 5500.00,
            'descripcion': 'Diseño moderno y elegante con amplias zonas al aire libre para disfrutar del sol mediterráneo. Excelente rendimiento.',
            'imagen_url': 'https://images.unsplash.com/photo-1605281317010-fe5ffe798166?w=1200',
            'estado': 'disponible',
            'incluye_capitan': True,
            'incluye_tripulacion': True,
            'ubicacion': 'Ibiza',
            'rating': 4.9
        },
        {
            'propietario_id': caps_by_email['hector@seahive.com'].id,
            'nombre': 'Eclipse Voyager',
            'tipo': 'yacht',
            'categoria': 'sport_yacht',
            'capacidad': 15,
            'longitud': 90,
            'precio_dia': 8500.00,
            'descripcion': 'Yate de alto rendimiento con interiores de diseñador. Perfecto para fiestas exclusivas y eventos corporativos.',
            'imagen_url': 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=1200',
            'estado': 'disponible',
            'incluye_capitan': True,
            'incluye_tripulacion': True,
            'ubicacion': 'Mallorca',
            'rating': 4.8
        },
        {
            'propietario_id': caps_by_email['will@seahive.com'].id,
            'nombre': 'Wind Chaser',
            'tipo': 'sailboat',
            'categoria': 'monohull',
            'capacidad': 10,
            'longitud': 60,
            'precio_dia': 3200.00,
            'descripcion': 'Un velero clásico que combina la elegancia tradicional con la tecnología de navegación más moderna.',
            'imagen_url': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200',
            'estado': 'disponible',
            'incluye_capitan': True,
            'incluye_tripulacion': False,
            'ubicacion': 'Santorini',
            'rating': 4.7
        },
        {
            'propietario_id': caps_by_email['amelia@seahive.com'].id,
            'nombre': 'Coral Reef Cat',
            'tipo': 'sailboat',
            'categoria': 'catamaran',
            'capacidad': 16,
            'longitud': 65,
            'precio_dia': 4800.00,
            'descripcion': 'Catamarán súper espacioso ideal para familias. Cuenta con redes en proa para tomar el sol y un salón panorámico.',
            'imagen_url': 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200',
            'estado': 'disponible',
            'incluye_capitan': True,
            'incluye_tripulacion': True,
            'ubicacion': 'Bahamas',
            'rating': 4.9
        },
        {
            'propietario_id': caps_by_email['lucas@marino.com'].id,
            'nombre': 'Kawasaki Ultra 310LX',
            'tipo': 'watercraft',
            'categoria': 'jet_ski',
            'capacidad': 3,
            'longitud': 3.37,
            'precio_dia': 350.00,
            'descripcion': 'La moto de agua más potente de la serie Ultra con sistema de audio integrado. Confort y velocidad extremos.',
            'imagen_url': 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200',
            'estado': 'disponible',
            'incluye_capitan': False,
            'incluye_tripulacion': False,
            'ubicacion': 'Miami',
            'rating': 4.8
        },
        {
            'propietario_id': caps_by_email['lucas@marino.com'].id,
            'nombre': 'Sea-Doo Wake Pro 230',
            'tipo': 'watercraft',
            'categoria': 'jet_ski',
            'capacidad': 3,
            'longitud': 3.45,
            'precio_dia': 320.00,
            'descripcion': 'Especialmente diseñada para deportes acuáticos, con un pilón de esquí retráctil y modo de velocidad exclusivo.',
            'imagen_url': 'https://images.unsplash.com/photo-1502680630713-3fc8c03c5eb5?w=1200',
            'estado': 'disponible',
            'incluye_capitan': False,
            'incluye_tripulacion': False,
            'ubicacion': 'Ibiza',
            'rating': 4.7
        }
    ]
    
    emb_added = 0
    emb_updated = 0
    for data in vessels:
        exists = Embarcacion.query.filter_by(nombre=data['nombre']).first()
        if not exists:
            e = Embarcacion(**data)
            db.session.add(e)
            emb_added += 1
        else:
            # Auto-upgrade existing ones to local paths if they currently use unsplash OR dead static uploads
            current_url = str(exists.imagen_url).lower() if exists.imagen_url else ""
            if not exists.imagen_url or 'unsplash' in current_url or '/static/uploads/' in current_url:
                exists.imagen_url = data['imagen_url']
                emb_updated += 1
    db.session.commit()
    print(f"Embarcaciones añadidas: {emb_added}, actualizadas: {emb_updated}")

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
    
    # 5. Fallback Global Mapping for generic naming collisions
    fuzzy_mappings = {
        'barbossa': '/images/fleet/barbossa_turbo_jet.png',
        'lucas': '/images/fleet/lucas_racer.png',
    }
    fuzzy_count = 0
    all_vessels = Embarcacion.query.all()
    for v in all_vessels:
        curr = str(v.imagen_url).lower() if v.imagen_url else ""
        if not v.imagen_url or 'unsplash' in curr or '/static/uploads/' in curr:
            for key, url in fuzzy_mappings.items():
                if key in v.nombre.lower():
                    v.imagen_url = url
                    fuzzy_count += 1
                    break
    db.session.commit()

    return f"Éxito: {emb_added} barcos nuevos, {emb_updated} actualizados, y {fuzzy_count} mapeos difusos completados."
