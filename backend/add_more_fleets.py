from app import app, db, Usuario, Embarcacion
from datetime import datetime

def seed_more_fleets():
    with app.app_context():
        # 1. Definir nuevos Capitanes
        capitanes_data = [
            {'nombre': 'Amelia Earhart', 'email': 'amelia@nautica.com', 'telefono': '+1-555-0301'},
            {'nombre': 'Captain Haddock', 'email': 'haddock@nautica.com', 'telefono': '+1-555-0302'},
            {'nombre': 'Will Turner', 'email': 'will@nautica.com', 'telefono': '+1-555-0303'},
            {'nombre': 'Hector Barbossa', 'email': 'hector@nautica.com', 'telefono': '+1-555-0304'},
        ]
        
        capitanes_obj = []
        for data in capitanes_data:
            cap = Usuario.query.filter_by(email=data['email']).first()
            if not cap:
                cap = Usuario(nombre=data['nombre'], email=data['email'], telefono=data['telefono'], rol='capitan')
                cap.set_password('capitan123')
                db.session.add(cap)
            capitanes_obj.append(cap)
            
        db.session.commit()
        
        # We also have capitanes from before, let's get Jack Sparrow and Lucas Marino
        jack = Usuario.query.filter_by(email='jack@sparrow.com').first()
        lucas = Usuario.query.filter_by(email='lucas@marino.com').first()
        if jack and jack not in capitanes_obj:
            capitanes_obj.append(jack)
        if lucas and lucas not in capitanes_obj:
            capitanes_obj.append(lucas)

        # 2. Add Ships/Jetskis to Captains
        new_vessels = [
            # ==== AMELIA EARHART ====
            {
                'propietario_id': capitanes_obj[0].id,
                'nombre': 'Skyrider Jetski',
                'tipo': 'watercraft',
                'categoria': 'jet_ski',
                'capacidad': 2,
                'longitud': 11,
                'precio_dia': 250.00,
                'descripcion': 'Moto de agua rápida y ligera, ideal para recorrer las costas a alta velocidad.',
                'imagen_url': 'https://images.unsplash.com/photo-1549480119-0ed1e57a41aa?w=800', # Jetski
                'estado': 'disponible',
                'incluye_capitan': False,
                'incluye_tripulacion': False,
                'ubicacion': 'Ibiza',
                'rating': 4.8
            },
            {
                'propietario_id': capitanes_obj[0].id,
                'nombre': 'Amelia Explorer',
                'tipo': 'yacht',
                'categoria': 'super_yacht',
                'capacidad': 10,
                'longitud': 75,
                'precio_dia': 5200.00,
                'descripcion': 'Yate de exploración con equipamiento de lujo para travesías largas.',
                'imagen_url': 'https://images.unsplash.com/photo-1579737119782-411db103a3d2?w=800', # Yate
                'estado': 'disponible',
                'incluye_capitan': True,
                'incluye_tripulacion': True,
                'ubicacion': 'Ibiza',
                'rating': 5.0
            },
            # ==== CAPTAIN HADDOCK ====
            {
                'propietario_id': capitanes_obj[1].id,
                'nombre': 'Marlin Cruiser',
                'tipo': 'yacht',
                'categoria': 'sport_yacht',
                'capacidad': 8,
                'longitud': 55,
                'precio_dia': 3100.00,
                'descripcion': 'Crusero deportivo perfecto para pescar y navegar cómodamente.',
                'imagen_url': 'https://images.unsplash.com/photo-1563604313271-89e47766b96e?w=800', # Sport yacht
                'estado': 'disponible',
                'incluye_capitan': True,
                'incluye_tripulacion': False,
                'ubicacion': 'Mallorca',
                'rating': 4.6
            },
            {
                'propietario_id': capitanes_obj[1].id,
                'nombre': 'SeaDoo GTX',
                'tipo': 'watercraft',
                'categoria': 'jet_ski',
                'capacidad': 3,
                'longitud': 12,
                'precio_dia': 400.00,
                'descripcion': 'Moto de agua de altísimas prestaciones y 3 plazas.',
                'imagen_url': 'https://images.unsplash.com/photo-1621271109961-75217ea2a336?w=800', # Jetski in water
                'estado': 'disponible',
                'incluye_capitan': False,
                'incluye_tripulacion': False,
                'ubicacion': 'Mallorca',
                'rating': 4.7
            },
            # ==== WILL TURNER ====
            {
                'propietario_id': capitanes_obj[2].id,
                'nombre': 'Dutchman Sailing',
                'tipo': 'sailboat',
                'categoria': 'catamaran',
                'capacidad': 12,
                'longitud': 65,
                'precio_dia': 4800.00,
                'descripcion': 'Catamarán de lujo, silencioso y perfecto para fiestas y atardeceres.',
                'imagen_url': 'https://images.unsplash.com/photo-1570560868297-b08bc4443905?w=800', # Catamaran/sailboat
                'estado': 'disponible',
                'incluye_capitan': True,
                'incluye_tripulacion': True,
                'ubicacion': 'Marbella',
                'rating': 4.9
            },
            {
                'propietario_id': capitanes_obj[2].id,
                'nombre': 'Yamaha WaveRunner',
                'tipo': 'watercraft',
                'categoria': 'jet_ski',
                'capacidad': 2,
                'longitud': 10,
                'precio_dia': 300.00,
                'descripcion': 'Agilidad y velocidad aseguradas con esta compacta moto de agua.',
                'imagen_url': 'https://images.unsplash.com/photo-1634629452811-db6de2f518e9?w=800', # Jetski
                'estado': 'disponible',
                'incluye_capitan': False,
                'incluye_tripulacion': False,
                'ubicacion': 'Marbella',
                'rating': 4.6
            },
            # ==== HECTOR BARBOSSA ====
            {
                'propietario_id': capitanes_obj[3].id,
                'nombre': 'Black Pearl Mega Yacht',
                'tipo': 'yacht',
                'categoria': 'super_yacht',
                'capacidad': 20,
                'longitud': 120,
                'precio_dia': 15000.00,
                'descripcion': 'Mega yate con jacuzzi, helipuerto y el máximo lujo que el dinero puede pagar.',
                'imagen_url': 'https://images.unsplash.com/photo-1548119044-0baddaeccdd0?w=800', # Mega Yacht
                'estado': 'disponible',
                'incluye_capitan': True,
                'incluye_tripulacion': True,
                'ubicacion': 'Monaco',
                'rating': 5.0
            },
            {
                'propietario_id': capitanes_obj[3].id,
                'nombre': 'Barbossa Turbo Jet',
                'tipo': 'watercraft',
                'categoria': 'jet_ski',
                'capacidad': 1,
                'longitud': 9,
                'precio_dia': 280.00,
                'descripcion': 'Moto de agua monoplaza de competición.',
                'imagen_url': 'https://images.unsplash.com/photo-1596766735513-3b4dfc4a1622?w=800', # Jetski
                'estado': 'disponible',
                'incluye_capitan': False,
                'incluye_tripulacion': False,
                'ubicacion': 'Monaco',
                'rating': 4.7
            },
            # ==== CAPITANES ANTIGUOS ====
            # Jack Sparrow (index 4 or later if they existed)
        ]
        
        if jack:
            new_vessels.extend([
                {
                    'propietario_id': jack.id,
                    'nombre': 'Sparrow Spark',
                    'tipo': 'watercraft',
                    'categoria': 'jet_ski',
                    'capacidad': 2,
                    'longitud': 11,
                    'precio_dia': 320.00,
                    'descripcion': 'Moto acuática ideal para sortear olas y disfrutar el horizonte.',
                    'imagen_url': 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800', # Jetski
                    'estado': 'disponible',
                    'incluye_capitan': False,
                    'incluye_tripulacion': False,
                    'ubicacion': 'Caribbean',
                    'rating': 4.5
                }
            ])

        if lucas:
            new_vessels.extend([
                {
                    'propietario_id': lucas.id,
                    'nombre': 'Lucas Racer',
                    'tipo': 'watercraft',
                    'categoria': 'jet_ski',
                    'capacidad': 2,
                    'longitud': 10,
                    'precio_dia': 290.00,
                    'descripcion': 'Paseos a alta velocidad llenos de adrenalina.',
                    'imagen_url': 'https://images.unsplash.com/photo-1554605963-c35beee78a5b?w=800', # Watercraft
                    'estado': 'disponible',
                    'incluye_capitan': False,
                    'incluye_tripulacion': False,
                    'ubicacion': 'Santorini',
                    'rating': 4.4
                }
            ])
            
        embarcaciones = [Embarcacion(**v) for v in new_vessels]
        db.session.add_all(embarcaciones)
        db.session.commit()
        
        print(f"✅ Agregados {len(capitanes_data)} nuevos capitanes y {len(new_vessels)} nuevas embarcaciones/motos.")

if __name__ == '__main__':
    seed_more_fleets()
