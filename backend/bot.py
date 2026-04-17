import os
os.environ["PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION"] = "python"
import telebot
from dotenv import load_dotenv

from app import app, db, Usuario
from gemini_agent import procesar_mensaje

# Cargar variables de entorno
load_dotenv()

TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")
if not TOKEN:
    raise ValueError("Error: TELEGRAM_BOT_TOKEN no se ha configurado en el archivo .env")

bot = telebot.TeleBot(TOKEN)

@bot.message_handler(commands=['start', 'ayuda', 'help'])
def send_welcome(message):
    telegram_id = str(message.chat.id)
    
    with app.app_context():
        usuario = Usuario.query.filter_by(telegram_id=telegram_id).first()
        
        if usuario:
            bot.reply_to(message, f"¡Hola de nuevo capitán {usuario.nombre}! Estoy aquí para ayudarte a administrar tus embarcaciones y revisar las reservas.\n\nSimplemente pregúntame lo que necesites, por ejemplo: '¿qué barcos tengo?' o 'dime mis reservas de esta semana'.")
        else:
            bot.reply_to(message, "¡Bienvenido a Nautica IA! Soy el asistente virtual para propietarios.\n\nPara empezar, necesito vincular tú cuenta de usuario. Por favor, usa el comando `/vincular <tu_email>` con el correo que usas en el sistema web.")

@bot.message_handler(commands=['vincular'])
def vincular_cuenta(message):
    telegram_id = str(message.chat.id)
    email = message.text.replace("/vincular", "").strip()
    
    if not email:
        bot.reply_to(message, "Debes proporcionar tu email registrado. Ejemplo:\n/vincular juan@ejemplo.com")
        return
        
    with app.app_context():
        # Verificamos si alguien más tiene este telegram id vinculado (por si acaso cambió de cuenta)
        anterior = Usuario.query.filter_by(telegram_id=telegram_id).first()
        if anterior:
            anterior.telegram_id = None
            
        # Buscamos al usuario por correo
        usuario = Usuario.query.filter_by(email=email).first()
        if not usuario:
            bot.reply_to(message, f"No existe ninguna cuenta registrada con el email '{email}' en nuestro sistema.")
            return
            
        usuario.telegram_id = telegram_id
        db.session.commit()
        bot.reply_to(message, f"¡Excelente! He vinculado tu cuenta de Telegram al usuario *{usuario.nombre}* exitosamente.\n\nAhora puedes preguntarme sobre tus barcos o reservas en cualquier momento.", parse_mode="Markdown")

@bot.message_handler(func=lambda message: True)
def procesar_texto(message):
    telegram_id = str(message.chat.id)
    
    with app.app_context():
        usuario = Usuario.query.filter_by(telegram_id=telegram_id).first()
        if not usuario:
            bot.reply_to(message, "No te conozco. Por favor, vincula tu cuenta primero enviando `/vincular tu@email.com`.")
            return
            
    bot.send_chat_action(message.chat.id, 'typing')
    
    try:
        # Llamar a Gemini enviándole el ID del chat y el texto del usuario
        respuesta_ia = procesar_mensaje(telegram_id, message.text)
        bot.reply_to(message, respuesta_ia)
    except Exception as e:
        print(f"Error en bot.py: {e}")
        bot.reply_to(message, "Mis circuitos (IA) están experimentando una ligera tormenta. Por favor, intenta de nuevo en unos momentos.")

if __name__ == "__main__":
    print("Iniciando el Bot IA de Telegram para Capitanes...")
    print("Esperando mensajes...")
    bot.infinity_polling()
