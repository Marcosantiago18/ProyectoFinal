from app import app, db, Embarcacion

yacht_photos = [
    "https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?w=1200",
    "https://images.unsplash.com/photo-1605281317010-fe5ffe798166?w=1200",
    "https://images.unsplash.com/photo-1548119044-0baddaeccdd0?w=1200",
    "https://images.unsplash.com/photo-1579737119782-411db103a3d2?w=1200",
    "https://images.unsplash.com/photo-1563604313271-89e47766b96e?w=1200",
    "https://images.unsplash.com/photo-1540946485063-a40da27545f8?w=1200"
]

sailboat_photos = [
    "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200",
    "https://images.unsplash.com/photo-1517055729445-fa0d373848aa?w=1200",
    "https://images.unsplash.com/photo-1570560868297-b08bc4443905?w=1200",
]

watercraft_photos = [
    "https://images.unsplash.com/photo-1626297852194-a2f8c3a59e45?w=1200",
    "https://images.unsplash.com/photo-1554605963-c35beee78a5b?w=1200",
    "https://images.unsplash.com/photo-1634629452811-db6de2f518e9?w=1200",
    "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200",
    "https://images.unsplash.com/photo-1596766735513-3b4dfc4a1622?w=1200",
    "https://images.unsplash.com/photo-1504551954177-a2a3b46f9095?w=1200",
    "https://images.unsplash.com/photo-1568052686294-0e7b7c0cb52a?w=1200",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200"
]

with app.app_context():
    embarcaciones = Embarcacion.query.order_by(Embarcacion.id).all()
    yi = 0
    si = 0
    wi = 0
    
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
            
        print(f"Updated {e.tipo}: {e.nombre} -> {e.imagen_url}")
        
    db.session.commit()
    print("Done!")
