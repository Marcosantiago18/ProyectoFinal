from app import app, db, Usuario, Embarcacion, Reserva, Mantenimiento, Review, Amarre
import random
from datetime import datetime, timedelta

def seed_extra_data():
    with app.app_context():
        capitanes = Usuario.query.filter_by(rol='capitan').all()
        clientes = Usuario.query.filter_by(rol='cliente').all()
        embarcaciones = Embarcacion.query.all()
        amarres = Amarre.query.filter_by(estado='disponible').all()

        if not clientes:
            print("Faltan clientes, usando admin como cliente suplente.")
            clientes = [Usuario.query.first()]
            
        print("Añadiendo reviews y asignando amarres...")

        # Asignar amarres a embarcaciones
        for i, barco in enumerate(embarcaciones):
            if i < len(amarres):
                amarre = amarres[i]
                amarre.estado = 'ocupado'
                amarre.embarcacion_id = barco.id
                amarre.propietario_id = barco.propietario_id
                db.session.add(amarre)

        # Crear reviews aleatorias creíbles
        comentarios = [
            "Excelente servicio, muy recomendado.",
            "El barco estaba impecable y el capitán fue muy amable.",
            "Una experiencia inolvidable. Repetiremos sin duda.",
            "Todo fue perfecto, desde la reserva hasta el final del día.",
            "El yate es espectacular. Las fotos no le hacen justicia.",
            "Día perfecto en el agua, la pasamos genial con la familia."
        ]
        
        for barco in embarcaciones:
            num_reviews = random.randint(1, 4)
            for _ in range(num_reviews):
                cliente = random.choice(clientes)
                review = Review(
                    usuario_id=cliente.id,
                    embarcacion_id=barco.id,
                    rating=random.randint(4, 5),
                    comentario=random.choice(comentarios)
                )
                db.session.add(review)
            
            db.session.flush()
            todas_reviews = Review.query.filter_by(embarcacion_id=barco.id).all()
            if todas_reviews:
                promedio = sum(r.rating for r in todas_reviews) / len(todas_reviews)
                barco.rating = round(promedio, 1)

        db.session.commit()
        print("Página rellenada completamente con datos muy reales!")

if __name__ == '__main__':
    seed_extra_data()
