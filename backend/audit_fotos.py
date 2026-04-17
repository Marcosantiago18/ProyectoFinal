from app import app, db, Embarcacion
with app.app_context():
    embarcaciones = Embarcacion.query.order_by(Embarcacion.tipo).all()
    for e in embarcaciones:
        foto = e.imagen_url or "SIN FOTO"
        print(f"{e.tipo:<12} | {e.id:<4} | {e.nombre:<40} | {foto}")
