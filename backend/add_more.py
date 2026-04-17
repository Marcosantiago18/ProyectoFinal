from app import app, db, Embarcacion, Usuario
import random

# OK ones + new local ones
local_base = "http://localhost:5000/static/uploads/"

# These are verified beautiful ones
yacht_photos = [
    local_base + "yacht_1.png",
    local_base + "yacht_2.png",
    local_base + "yacht_3.png",
    "https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?w=1200", # Azimut Grande 27 - OK
    "https://images.unsplash.com/photo-1605281317010-fe5ffe798166?w=1200"  # Sunseeker Predator - OK
]

sailboat_photos = [
    local_base + "sailboat_1.png",
    "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200", # Lagoon Seventy 7 - OK
]

watercraft_photos = [
    local_base + "jetski_1.png",
    local_base + "jetski_2.png",
    local_base + "jetski_3.png",
    local_base + "jetski_4.png",
    "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200" # Kawasaki Jet Ski Ultra 160 - OK
]

new_vessels = [
    {
        'nombre': 'Luxury Dream Mega Yacht',
        'tipo': 'yacht',
        'categoria': 'super_yacht',
        'capacidad': 18,
        'longitud': 95,
        'precio_dia': 12000.00,
        'descripcion': 'El sueño hecho realidad con helipuerto y jacuzzi privado en cubierta.',
        'imagen_url': local_base + 'yacht_3.png',
        'estado': 'disponible',
        'incluye_capitan': True,
        'incluye_tripulacion': True,
        'ubicacion': 'Ibiza',
        'rating': 5.0
    },
    {
        'nombre': 'Fast Cruising Sport',
        'tipo': 'yacht',
        'categoria': 'sport_yacht',
        'capacidad': 10,
        'longitud': 45,
        'precio_dia': 2500.00,
        'descripcion': 'Velocidad y agresividad en un modelo deportivo que cruza las olas.',
        'imagen_url': local_base + 'yacht_2.png',
        'estado': 'disponible',
        'incluye_capitan': True,
        'incluye_tripulacion': False,
        'ubicacion': 'Mallorca',
        'rating': 4.7
    },
    {
        'nombre': 'Ocean Whisper Catamaran',
        'tipo': 'sailboat',
        'categoria': 'catamaran',
        'capacidad': 14,
        'longitud': 60,
        'precio_dia': 4500.00,
        'descripcion': 'El mejor catamarán para relajarse al atardecer, mucho espacio e interiores de diseño.',
        'imagen_url': local_base + 'sailboat_1.png',
        'estado': 'disponible',
        'incluye_capitan': True,
        'incluye_tripulacion': True,
        'ubicacion': 'Marbella',
        'rating': 4.9
    },
    {
        'nombre': 'Yamaha GP1800R SVHO',
        'tipo': 'watercraft',
        'categoria': 'jet_ski',
        'capacidad': 2,
        'longitud': 3.3,
        'precio_dia': 250.00,
        'descripcion': 'La campeona de las carreras de motos acuáticas, manejo ultra preciso.',
        'imagen_url': local_base + 'jetski_1.png',
        'estado': 'disponible',
        'incluye_capitan': False,
        'incluye_tripulacion': False,
        'ubicacion': 'Ibiza',
        'rating': 4.8
    },
    {
        'nombre': 'Sea-Doo RXP-X 300',
        'tipo': 'watercraft',
        'categoria': 'jet_ski',
        'capacidad': 2,
        'longitud': 3.31,
        'precio_dia': 270.00,
        'descripcion': 'Aceleración de 0 a 80 km/h en segundos. Para amantes de la velocidad.',
        'imagen_url': local_base + 'jetski_2.png',
        'estado': 'disponible',
        'incluye_capitan': False,
        'incluye_tripulacion': False,
        'ubicacion': 'Mallorca',
        'rating': 4.9
    },
    {
        'nombre': 'Kawasaki STX 160LX',
        'tipo': 'watercraft',
        'categoria': 'jet_ski',
        'capacidad': 3,
        'longitud': 3.15,
        'precio_dia': 180.00,
        'descripcion': 'Confort y sonido integrado para disfrutar horas en el agua sin fatiga.',
        'imagen_url': local_base + 'jetski_3.png',
        'estado': 'disponible',
        'incluye_capitan': False,
        'incluye_tripulacion': False,
        'ubicacion': 'Miami Beach',
        'rating': 4.5
    }
]

with app.app_context():
    # 1. Update existing broken URLs
    embarcaciones = Embarcacion.query.all()
    yi, si, wi = 0, 0, 0
    for e in embarcaciones:
        if e.tipo == 'yacht':
            e.imagen_url = yacht_photos[yi % len(yacht_photos)]
            yi += 1
        elif e.tipo == 'sailboat':
            e.imagen_url = sailboat_photos[si % len(sailboat_photos)]
            si += 1
        elif e.tipo == 'watercraft':
            e.imagen_url = watercraft_photos[wi % len(watercraft_photos)]
            wi += 1
    db.session.commit()
    print("Fixed existing photos.")
    
    # 2. Add new boats
    admin = Usuario.query.filter_by(rol='admin').first()
    prop_id = admin.id if admin else 1
    
    added = 0
    for data in new_vessels:
        existing = Embarcacion.query.filter_by(nombre=data['nombre']).first()
        if not existing:
            emb = Embarcacion(**data)
            emb.propietario_id = prop_id
            db.session.add(emb)
            added += 1
    db.session.commit()
    print(f"Added {added} new vessels.")
