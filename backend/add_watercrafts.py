"""
Script para añadir motos de agua (watercraft) a la base de datos
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, db, Embarcacion, Usuario

watercrafts = [
    {
        "nombre": "Sea-Doo Spark 90",
        "tipo": "watercraft",
        "capacidad": 2,
        "longitud": 3.3,
        "precio_dia": 150.0,
        "ubicacion": "Marina del Este",
        "estado": "disponible",
        "descripcion": "Moto de agua compacta y ágil, perfecta para dos personas. Ideal para principiantes.",
        "incluye_capitan": False,
        "incluye_tripulacion": False,
        "imagen_url": "https://images.unsplash.com/photo-1554605963-c35beee78a5b?w=1200",
        "caracteristicas": "Motor 900cc, máx 50 km/h, estabilizador de popa",
    },
    {
        "nombre": "Yamaha WaveRunner FX HO",
        "tipo": "watercraft",
        "capacidad": 3,
        "longitud": 3.6,
        "precio_dia": 195.0,
        "ubicacion": "Puerto Banús",
        "estado": "disponible",
        "descripcion": "La moto de agua más potente de la gama Yamaha. Perfecta para experiencias de alta adrenalina.",
        "incluye_capitan": False,
        "incluye_tripulacion": False,
        "imagen_url": "https://images.unsplash.com/photo-1634629452811-db6de2f518e9?w=1200",
        "caracteristicas": "Motor 1.8L Yamaha, GPS, modo ECO/Sport",
    },
    {
        "nombre": "Kawasaki Jet Ski Ultra 160",
        "tipo": "watercraft",
        "capacidad": 3,
        "longitud": 3.4,
        "precio_dia": 175.0,
        "ubicacion": "Marbella",
        "estado": "disponible",
        "descripcion": "Clásica jet ski Kawasaki con potencia superior y excelente maniobrabilidad. ¡Adrenalina garantizada!",
        "incluye_capitan": False,
        "incluye_tripulacion": False,
        "imagen_url": "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200",
        "caracteristicas": "Motor 4T 1498cc, Freno inteligente, Estabilizador electrónico",
    },
    {
        "nombre": "Sea-Doo GTX Limited 300",
        "tipo": "watercraft",
        "capacidad": 3,
        "longitud": 3.5,
        "precio_dia": 220.0,
        "ubicacion": "Puerto Sherry",
        "estado": "disponible",
        "descripcion": "La moto de agua premium de Sea-Doo. Con asiento ergonómico de lujo y tecnología de punta para la máxima experiencia.",
        "incluye_capitan": False,
        "incluye_tripulacion": False,
        "imagen_url": "https://images.unsplash.com/photo-1596766735513-3b4dfc4a1622?w=1200",
        "caracteristicas": "Motor Rotax 1630cc, BRP Connect GPS, Control de tracción",
    },
]

with app.app_context():
    # Aseguramos que existe el propietario admin (id=1)
    admin = Usuario.query.get(1)
    propietario_id = admin.id if admin else None

    added = 0
    for wc_data in watercrafts:
        # Evitar duplicados por nombre
        existing = Embarcacion.query.filter_by(nombre=wc_data["nombre"]).first()
        if existing:
            print(f"  Ya existe: {wc_data['nombre']}, omitiendo.")
            continue

        emb = Embarcacion(
            nombre=wc_data["nombre"],
            tipo=wc_data["tipo"],
            capacidad=wc_data["capacidad"],
            longitud=wc_data["longitud"],
            precio_dia=wc_data["precio_dia"],
            ubicacion=wc_data["ubicacion"],
            estado=wc_data["estado"],
            descripcion=wc_data["descripcion"],
            incluye_capitan=wc_data.get("incluye_capitan", False),
            incluye_tripulacion=wc_data.get("incluye_tripulacion", False),
            imagen_url=wc_data.get("imagen_url"),
            propietario_id=propietario_id,
        )
        db.session.add(emb)
        added += 1
        print(f"  ✅ Añadida: {wc_data['nombre']}")

    db.session.commit()
    print(f"\n✅ Total motos añadidas: {added}")
    print(f"   Total watercraft en BD: {Embarcacion.query.filter_by(tipo='watercraft').count()}")
