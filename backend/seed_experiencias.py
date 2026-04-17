from app import app, db, Experiencia
import os

experiences_data = [
    {
        'titulo': 'Avistamiento de Delfines',
        'subtitulo': 'Magia en el Mediterráneo',
        'descripcion': 'Embárcate en una aventura única para observar delfines en su hábitat natural. Nuestros expertos guías conocen los mejores puntos del litoral donde las manadas juegan entre las olas.',
        'precio': 95.0,
        'duracion': '3 horas',
        'capacidad': '12 personas',
        'emoji': '🐬',
        'gradient': 'from-cyan-500/20 to-blue-600/20',
        'highlights': 'Guía marino experto,Binoculares incluidos,Snacks y bebidas,Fotografía profesional',
        'tipo_barco_compatible': 'yacht,sailboat,catamaran',
        'imagen_url': 'https://images.unsplash.com/photo-1518110203043-30ce0930a382?w=1200'
    },
    {
        'titulo': 'Paseo al Atardecer',
        'subtitulo': 'El Mediterráneo en todo su esplendor',
        'descripcion': 'Disfruta de los colores más impresionantes del cielo mientras navegas por aguas cristalinas. Con champán, música suave y la brisa del mar como protagonistas.',
        'precio': 120.0,
        'duracion': '2 horas',
        'capacidad': '20 personas',
        'emoji': '🌅',
        'gradient': 'from-orange-500/20 to-amber-600/20',
        'highlights': 'Champán & canapés de bienvenida,Música en vivo opcional,Decoración romántica,Foto grupal incluida',
        'tipo_barco_compatible': 'yacht,sailboat,catamaran',
        'imagen_url': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200'
    },
    {
        'titulo': 'Buceo y Snorkel',
        'subtitulo': 'Descubre el mundo submarino',
        'descripcion': 'Sumérgete en las profundidades turquesas del Mediterráneo. Explorarás arrecifes, cuevas marinas y una fauna submarina espectacular acompañado de instructores certificados.',
        'precio': 85.0,
        'duracion': '4 horas',
        'capacidad': '10 personas',
        'emoji': '🤿',
        'gradient': 'from-blue-500/20 to-teal-600/20',
        'highlights': 'Equipo completo incluido,Instructor certificado PADI,Botiquín de primeros auxilios,Apto para principiantes',
        'tipo_barco_compatible': 'yacht,sailboat,catamaran',
        'imagen_url': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200'
    },
    {
        'titulo': 'Wakeboard & Deportes Acuáticos',
        'subtitulo': 'Adrenalina a flor de agua',
        'descripcion': 'Siente la emoción del wakeboard, esquí acuático y colchonetas de arrastre. Una experiencia llena de diversión y adrenalina para toda la familia y grupos de amigos.',
        'precio': 75.0,
        'duracion': '2 horas',
        'capacidad': '8 personas',
        'emoji': '🏄',
        'gradient': 'from-purple-500/20 to-pink-600/20',
        'highlights': 'Colchonetas de arrastre,Tablas de wakeboard,Chaleco salvavidas incluido,Instructor de beach water sports',
        'tipo_barco_compatible': 'watercraft,jet_ski',
        'imagen_url': 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200'
    },
    {
        'titulo': 'Ruta por Cuevas Marinas',
        'subtitulo': 'Aventura y naturaleza salvaje',
        'descripcion': 'Explora en barco las impresionantes cuevas y calas vírgenes de la costa. Paramos en calas secretas para nadar en aguas cristalinas donde ningún turista ordinario llega.',
        'precio': 110.0,
        'duracion': '5 horas',
        'capacidad': '15 personas',
        'emoji': '🏝️',
        'gradient': 'from-emerald-500/20 to-green-600/20',
        'highlights': 'Calas secretas exclusivas,Almuerzo mediterráneo,Equipo de snorkel,Fotografía submarina',
        'tipo_barco_compatible': 'sailboat,yacht,catamaran',
        'imagen_url': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200'
    },
    {
        'titulo': 'Yoga Flotante y Paddle Surf',
        'subtitulo': 'Relax y bienestar en el mar',
        'descripcion': 'Combina el yoga con la experiencia única de practicarlo sobre el agua. Después, paddle surf al amanecer con vistas únicas a la costa. Experiencia de mindfulness en el mar.',
        'precio': 65.0,
        'duracion': '3 horas',
        'capacidad': '8 personas',
        'emoji': '🧘',
        'gradient': 'from-rose-500/20 to-pink-600/20',
        'highlights': 'Instructor certificado,Tablas SUP incluidas,Sesión de meditación,Agua y fruta fresca',
        'tipo_barco_compatible': 'sailboat,catamaran',
        'imagen_url': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200'
    }
]

def seed():
    with app.app_context():
        # First ensure tables are created (just in case)
        db.create_all()
        
        # Clear existing experiences to avoid duplicates if re-run (optional)
        # Experiencia.query.delete()
        
        added = 0
        for data in experiences_data:
            exists = Experiencia.query.filter_by(titulo=data['titulo']).first()
            if not exists:
                exp = Experiencia(**data)
                db.session.add(exp)
                added += 1
        
        db.session.commit()
        print(f"Added {added} new experiences to the database.")

if __name__ == '__main__':
    seed()
