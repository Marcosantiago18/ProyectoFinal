import os
os.environ["PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION"] = "python"
import google.generativeai as genai
from dotenv import load_dotenv

# Importar app y db desde el backend
from app import app, db, Usuario, Embarcacion, Reserva, Mantenimiento, Amarre, socketio

load_dotenv()

# Configurar API Key de Gemini
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

# ---------- HERRAMIENTAS (Function Calling) ----------

def obtener_mis_barcos(telegram_id: str) -> str:
    """Delivers a list of boats/vessels owned by the current captain. Includes name, type and current status."""
    with app.app_context():
        usuario = Usuario.query.filter_by(telegram_id=telegram_id).first()
        if not usuario:
            return "Error: No se ha encontrado tu cuenta de usuario asociada a este Telegram."
        
        barcos = Embarcacion.query.filter_by(propietario_id=usuario.id).all()
        if not barcos:
            return "Actualmente no tienes embarcaciones registradas en el sistema."
        
        respuesta = "Tus embarcaciones son:\n"
        for b in barcos:
            respuesta += f"- {b.nombre} ({b.tipo}): Estado {b.estado}, Ubicación: {b.ubicacion}\n"
        return respuesta

def obtener_mis_reservas(telegram_id: str) -> str:
    """Delivers a list of reservations for the boats owned by the current captain."""
    with app.app_context():
        usuario = Usuario.query.filter_by(telegram_id=telegram_id).first()
        if not usuario:
            return "Error: No se ha encontrado tu cuenta de usuario."
            
        barcos_ids = [b.id for b in Embarcacion.query.filter_by(propietario_id=usuario.id).all()]
        if not barcos_ids:
            return "No tienes embarcaciones, por tanto no hay reservas."
            
        reservas = Reserva.query.filter(Reserva.embarcacion_id.in_(barcos_ids)).all()
        if not reservas:
            return "No tienes reservas registradas para tus embarcaciones."
            
        respuesta = "Reservas de tus embarcaciones:\n"
        for r in reservas:
            fecha_inicio = r.fecha_inicio.strftime("%Y-%m-%d")
            fecha_fin = r.fecha_fin.strftime("%Y-%m-%d")
            respuesta += f"- Barco {r.embarcacion.nombre}: {fecha_inicio} al {fecha_fin}. Estado: {r.estado}. Total: {r.precio_total}€\n"
        return respuesta

def crear_reserva(telegram_id: str, nombre_embarcacion: str, fecha_inicio: str, fecha_fin: str, nombre_cliente: str = "") -> str:
    """Creates a new reservation for a boat owned by the captain.
    Dates must be in ISO 8601 format (e.g., YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS), preferably with time if specified by the user.
    If nombre_cliente is provided, it tries to assign it; otherwise assigns it to the captain."""
    from datetime import datetime
    with app.app_context():
        usuario_capitan = Usuario.query.filter_by(telegram_id=telegram_id).first()
        if not usuario_capitan: return "Error: Usuario no encontrado."
        embarcacion = Embarcacion.query.filter(Embarcacion.propietario_id == usuario_capitan.id, Embarcacion.nombre.ilike(f"%{nombre_embarcacion}%")).first()
        if not embarcacion: return f"Error: No tienes una embarcación llamada {nombre_embarcacion}."
        
        try:
            inicio = datetime.fromisoformat(fecha_inicio.replace('Z', '+00:00'))
            fin = datetime.fromisoformat(fecha_fin.replace('Z', '+00:00'))
        except Exception:
            return "Error: Las fechas deben estar en formato ISO YYYY-MM-DDTHH:MM:SS."
            
        usuario_asignado = usuario_capitan
        notas = "Reserva creada desde asistente IA."
        if nombre_cliente:
            cliente = Usuario.query.filter(Usuario.nombre.ilike(f"%{nombre_cliente}%")).first()
            if cliente: usuario_asignado = cliente
            else: notas += f" (Reservado a nombre de cliente no registrado: {nombre_cliente})"
            
        # Calcular precio
        dias = max(1, (fin - inicio).days)
        precio_total = embarcacion.precio_dia * dias
        
        # Validar disponibilidad
        conflictos = Reserva.query.filter(
            Reserva.embarcacion_id == embarcacion.id,
            Reserva.estado.in_(['pendiente', 'confirmada', 'en_curso']),
            db.or_(
                db.and_(Reserva.fecha_inicio <= inicio, Reserva.fecha_fin >= inicio),
                db.and_(Reserva.fecha_inicio <= fin, Reserva.fecha_fin >= fin)
            )
        ).first()
        if conflictos: return "Error: La embarcación ya está ocupada en esas fechas."
        
        reserva = Reserva(
            usuario_id=usuario_asignado.id, embarcacion_id=embarcacion.id,
            fecha_inicio=inicio, fecha_fin=fin, precio_total=precio_total,
            estado='confirmada', tipo_evento='leisure', notas=notas
        )
        db.session.add(reserva)
        db.session.commit()
        
        # Emitir evento en tiempo real
        socketio.emit('nueva_actividad', {'tipo': 'reserva', 'mensaje': f'Nueva reserva para el barco {embarcacion.nombre} asignada a {usuario_asignado.nombre}.'}, namespace='/')
        
        return f"¡Reserva confirmada con éxito! Costo estimado: {precio_total} euros. Asignada a: {usuario_asignado.nombre}"

def programar_mantenimiento(telegram_id: str, nombre_embarcacion: str, tipo_mantenimiento: str, fecha_programada: str, descripcion: str) -> str:
    """Schedules a maintenance task for a boat.
    fecha_programada must be ISO 8601 (e.g. YYYY-MM-DDTHH:MM:SS). If the user didn't specify time, set the time to 09:00:00.
    tipo_mantenimiento must be one of: preventivo, correctivo, revision."""
    from datetime import datetime
    with app.app_context():
        usuario_capitan = Usuario.query.filter_by(telegram_id=telegram_id).first()
        if not usuario_capitan: return "Error: Usuario no encontrado."
        embarcacion = Embarcacion.query.filter(Embarcacion.propietario_id == usuario_capitan.id, Embarcacion.nombre.ilike(f"%{nombre_embarcacion}%")).first()
        if not embarcacion: return f"Error: No tienes una embarcación llamada {nombre_embarcacion}."
        
        try:
            if 'T' not in fecha_programada:
                fecha = datetime.fromisoformat(fecha_programada.replace('Z', '+00:00') + "T09:00:00")
            else:
                fecha = datetime.fromisoformat(fecha_programada.replace('Z', '+00:00'))
        except Exception:
            return "Error: Formato de fecha inválido."
            
        mantenimiento = Mantenimiento(
            embarcacion_id=embarcacion.id, tipo=tipo_mantenimiento.lower(),
            descripcion=descripcion, fecha_programada=fecha,
            costo=0.0, estado='programado', notas='Programado vía IA'
        )
        db.session.add(mantenimiento)
        db.session.commit()
        
        socketio.emit('nueva_actividad', {'tipo': 'mantenimiento', 'mensaje': f'Mantenimiento programado para el barco {embarcacion.nombre}.'}, namespace='/')
        
        return f"Mantenimiento '{tipo_mantenimiento}' programado para {nombre_embarcacion} el día {fecha.strftime('%Y-%m-%d a las %H:%M')}."

def reservar_amarre(telegram_id: str, nombre_embarcacion: str, codigo_amarre: str, meses: int = 1) -> str:
    """Books a mooring (amarre) for a given boat code (e.g. A-01, B-03)."""
    import datetime as dt
    with app.app_context():
        usuario_capitan = Usuario.query.filter_by(telegram_id=telegram_id).first()
        if not usuario_capitan: return "Error: Usuario no encontrado."
        embarcacion = Embarcacion.query.filter(Embarcacion.propietario_id == usuario_capitan.id, Embarcacion.nombre.ilike(f"%{nombre_embarcacion}%")).first()
        if not embarcacion: return f"Error: No tienes una embarcación llamada {nombre_embarcacion}."
        
        amarre = Amarre.query.filter_by(codigo=codigo_amarre.upper()).first()
        if not amarre: return f"Error: No existe el amarre {codigo_amarre}."
        if amarre.estado != 'disponible': return f"Error: El amarre {codigo_amarre} ya está ocupado."
        
        fecha_fin = dt.datetime.utcnow() + dt.timedelta(days=30*meses)

        amarre.estado = 'ocupado'
        amarre.embarcacion_id = embarcacion.id
        amarre.propietario_id = usuario_capitan.id
        amarre.fecha_fin_alquiler = fecha_fin
        
        db.session.commit()
        
        socketio.emit('nueva_actividad', {'tipo': 'amarre', 'mensaje': f'Amarre {codigo_amarre.upper()} vinculado al barco {embarcacion.nombre}.'}, namespace='/')
        
        return f"Éxito: Amarre {codigo_amarre.upper()} reservado para el barco {embarcacion.nombre} por {meses} meses."

# ---------- CONFIGURACIÓN DEL MODELO ----------

# El prompt del sistema le da la identidad a Gemini
system_instruction = (
    "Eres el asistente virtual VIP para capitanes DUEÑOS de barcos de alquiler. "
    "Tu objetivo es ayudarles a consultar su flota, ver reservas existentes, PERO TAMBIÉN PUEDES escribir. "
    "AHORA TIENES LA CAPACIDAD de crear nuevas reservas, programar mantenimientos, y rentar/reservar amarres (atraques). "
    "Si te hace falta información para usar una herramienta, PRÉGUNTALA de manera cordial. "
    "Trata siempre a los dueños como a personas muy importantes. Responde en español."
)

tools = [obtener_mis_barcos, obtener_mis_reservas, crear_reserva, programar_mantenimiento, reservar_amarre]

try:
    model = genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        tools=tools,
        system_instruction=system_instruction
    )
except Exception as e:
    # Fallback in case the new genai version requires a slightly different param
    model = genai.GenerativeModel("gemini-2.5-flash", tools=tools)

# Diccionario para mantener el historial por usuario de Telegram
chats_activos = {}

def procesar_mensaje(telegram_id: str, texto: str) -> str:
    """Toma el mensaje del usuario y devuelve la respuesta de la IA."""
    if telegram_id not in chats_activos:
        chats_activos[telegram_id] = model.start_chat(enable_automatic_function_calling=True)
    
    chat = chats_activos[telegram_id]
    
    # OPTIMIZACIÓN: Las cuotas gratuitas ("prueba gratuita") se agotan rápido si el payload es muy grande.
    # Almacenar todo el chat consume "Tokens Por Minuto" (TPM) y hace las requests muy pesadas.
    # Además, si la IA hace llamadas a herramientas, cada turno son 2-3 peticiones.
    # Reiniciar la memoria cuando es muy larga previene el error "429 Resource Exhausted".
    if len(chat.history) > 8:
        chats_activos[telegram_id] = model.start_chat(enable_automatic_function_calling=True)
        chat = chats_activos[telegram_id]
    
    # Inyectamos el ID internamente en el contexto del prompt para que él sepa de quién hablar 
    prompt_enriquecido = f"(Contexto oculto: el ID de telegram de este usuario es '{telegram_id}'. Usa este valor textual al llamar a las funciones.)\n\nMensaje del usuario: {texto}"
    
    try:
        response = chat.send_message(prompt_enriquecido)
        return response.text
    except Exception as e:
        import traceback
        import sys
        print(f"Error comunicando con Gemini:\n{traceback.format_exc()}", file=sys.stderr, flush=True)
        return "Lo siento capitán, hubo un error conectando con el sistema de navegación (IA). Inténtalo más tarde."
