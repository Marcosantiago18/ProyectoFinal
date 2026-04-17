import os
from dotenv import load_dotenv

load_dotenv()

from gemini_agent import procesar_mensaje

print("Starting locally...")
# Usa el telegram_id del usuario (podemos usar cualquier string porque el test conectará a la DB, 
# la base de datos ya tiene al "admin" asignado a un telegram_id si el usuario lo vinculó. 
# En DB el admin era usuario_id = 1. Si no sabemos su telegram_id, pongamos uno dummy, 
# pero el error de IA debería reproducirse igual o quejarse de "Usuario no encontrado").
# Busquemos el telegram_id del admin en la base de datos primero.
from app import app, db, Usuario
with app.app_context():
    admin = Usuario.query.first()
    tid = admin.telegram_id if admin.telegram_id else "test_id"
    if not admin.telegram_id:
        admin.telegram_id = "test_id"
        db.session.commit()

print(f"Probando con telegram id: {tid}")

resultado = procesar_mensaje(tid, "Hola, quiero que bloquees o hagas una reserva en el barco Sunseeker Predator para el 30 de abril hasta el 2 de mayo por favor, para una familia VIP.")

print("RESULTADO:")
print(resultado)
