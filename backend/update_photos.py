"""
Script para actualizar fotos de embarcaciones con URLs verificadas de Unsplash
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, db, Embarcacion

# Mapeo de IDs o Nombres a nuevas URLs
# Usamos nombres para mayor seguridad si los IDs cambiaron en el docker
updates = {
    # Yates
    "Azimut Grande 27": "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=1200",
    "Sunseeker Predator": "https://images.unsplash.com/photo-1621275476539-7034c4f039d9?w=1200",
    "Ocean's Whisper": "https://images.unsplash.com/photo-1569263979104-a2a3b46f9095?w=1200", 
    "The Golden Horizon": "https://images.unsplash.com/photo-1540946485063-a40da27545f8?w=1200",
    
    # Sailboats/Catamarans
    "Lagoon Seventy 7": "https://images.unsplash.com/photo-1517055729445-fa0d373848aa?w=1200",
    
    # Motos de Agua (Watercraft)
    "Sea-Doo Spark 90": "https://images.unsplash.com/photo-1530870110042-98b2cb110834?w=1200",
    "Yamaha WaveRunner FX HO": "https://images.unsplash.com/photo-1521404092419-72c0506e76d9?w=1200",
    "Kawasaki Jet Ski Ultra 160": "https://images.unsplash.com/photo-1568200676450-934c2ab1eeb2?w=1200",
    "Sea-Doo GTX Limited 300": "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200",
    "SeaDoo Spark 1": "https://images.unsplash.com/photo-1545657879-110058e39031?w=1200",
}

with app.app_context():
    print("Iniciando actualización de fotos...")
    count = 0
    for nombre, url in updates.items():
        vessels = Embarcacion.query.filter(Embarcacion.nombre.like(f"%{nombre}%")).all()
        for v in vessels:
            v.imagen_url = url
            count += 1
            print(f"  [OK] Actualizada foto para: {v.nombre} ({v.tipo})")
    
    # También asegurar que no haya fotos corruptas generales
    # Por ejemplo, cualquier watercraft que aún sea 404
    watercrafts = Embarcacion.query.filter_by(tipo='watercraft').all()
    for w in watercrafts:
        if not w.imagen_url or "404" in w.imagen_url:
            w.imagen_url = "https://images.unsplash.com/photo-1530870110042-98b2cb110834?w=1200"
            count += 1
            print(f"  [FIX] Foto genérica para moto de agua: {w.nombre}")

    db.session.commit()
    print(f"\nFinalizado. Total actualizaciones: {count}")
