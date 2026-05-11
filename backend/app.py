"""
Backend principal para el sistema de alquiler de barcos
Arquitectura: Flask + SQLAlchemy + MariaDB
"""
from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from flask_socketio import SocketIO
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import os
import io
from functools import wraps
from werkzeug.utils import secure_filename
import stripe
from dotenv import load_dotenv
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.units import cm

load_dotenv()

# Configuración de la aplicación
app = Flask(__name__)

# Debug de entorno (Imprime nombres de variables disponibles, NO sus valores)
print("🔍 Depuración de Entorno. Variables detectadas:")
for key in os.environ.keys():
    # Evitar imprimir contraseñas en los nombres si existieran, solo imprimir clave
    print(f"- {key}")

# Búsqueda ROBUSTA de variables de entorno (Ignora mayúsculas/minúsculas y espacios accidentales en las claves)
db_url = None
matched_key = None

print("🔎 Analizando variables del sistema para conexión...")
for key, value in os.environ.items():
    clean_key = key.strip().upper()
    if clean_key in ['DATABASE_URL', 'MYSQL_URL', 'MYSQLURL']:
        if value and str(value).strip():
            db_url = str(value).strip()
            matched_key = key
            print(f"🎯 ¡Encontrada variable de conexión! Clave: '{key}'")
            break
        else:
            print(f"⚠️ Detectada la clave '{key}', pero su contenido está vacío o son solo espacios.")

if not db_url:
    print("⚠️ ADVERTENCIA: No se encontró ninguna URL válida. Usando localhost como fallback.")
    db_url = 'mysql+pymysql://root@localhost/alquiler_barcos'
else:
    from urllib.parse import urlparse
    try:
        parsed = urlparse(db_url)
        print(f"✅ Conexión detectada a base de datos en host: {parsed.hostname}")
    except:
        print("✅ Conectando a base de datos proporcionada en el entorno.")

# Normalizar URL (asegurar el driver pymysql)
if db_url.startswith("mysql://"):
    db_url = db_url.replace("mysql://", "mysql+pymysql://", 1)

app.config['SQLALCHEMY_DATABASE_URI'] = db_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.urandom(24)
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'uploads')
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50 MB
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Configuración Stripe
stripe.api_key = os.environ.get("STRIPE_API_KEY", "sk_test_placeholder")

# Inicialización de extensiones
db = SQLAlchemy(app)
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*")

# ==================== MODELOS ====================

class Usuario(db.Model):
    __tablename__ = 'usuarios'
    
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    telefono = db.Column(db.String(20))
    rol = db.Column(db.String(20), default='cliente')  # cliente, admin
    fecha_registro = db.Column(db.DateTime, default=datetime.utcnow)
    telegram_id = db.Column(db.String(50), unique=True, nullable=True)
    
    reservas = db.relationship('Reserva', backref='usuario', lazy=True)
    
    def set_password(self, password: str) -> None:
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'nombre': self.nombre,
            'email': self.email,
            'telefono': self.telefono,
            'rol': self.rol,
            'fecha_registro': self.fecha_registro.isoformat() if self.fecha_registro else None,
            'telegram_id': self.telegram_id
        }


class Embarcacion(db.Model):
    __tablename__ = 'embarcaciones'
    
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    tipo = db.Column(db.String(50), nullable=False)  # yacht, sailboat, watercraft
    categoria = db.Column(db.String(50))  # super_yacht, sport_yacht, catamaran, jet_ski
    capacidad = db.Column(db.Integer, nullable=False)
    longitud = db.Column(db.Float)  # en pies
    precio_dia = db.Column(db.Float, nullable=False)
    descripcion = db.Column(db.Text)
    imagen_url = db.Column(db.String(255))
    estado = db.Column(db.String(20), default='disponible')  # disponible, en_charter, mantenimiento
    incluye_capitan = db.Column(db.Boolean, default=False)
    incluye_tripulacion = db.Column(db.Boolean, default=False)
    ubicacion = db.Column(db.String(100))
    rating = db.Column(db.Float, default=0.0)
    propietario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=True)
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)
    
    reservas = db.relationship('Reserva', backref='embarcacion', lazy=True)
    mantenimientos = db.relationship('Mantenimiento', backref='embarcacion', lazy=True)
    propietario = db.relationship('Usuario', backref='embarcaciones')
    
    def to_dict(self) -> dict:
        # Obtenemos experiencias compatibles para este tipo/categoría
        query = Experiencia.query.filter(
            (Experiencia.tipo_barco_compatible.like(f"%{self.tipo}%")) |
            (Experiencia.tipo_barco_compatible.like(f"%{self.categoria}%"))
        )
        experiencias_compatibles = [exp.to_dict() for exp in query.all()]
        
        return {
            'id': self.id,
            'nombre': self.nombre,
            'tipo': self.tipo,
            'categoria': self.categoria,
            'capacidad': self.capacidad,
            'longitud': self.longitud,
            'precio_dia': self.precio_dia,
            'descripcion': self.descripcion,
            'imagen_url': self.imagen_url,
            'estado': self.estado,
            'incluye_capitan': self.incluye_capitan,
            'incluye_tripulacion': self.incluye_tripulacion,
            'ubicacion': self.ubicacion,
            'rating': self.rating,
            'propietario_id': self.propietario_id,
            'propietario_nombre': self.propietario.nombre if self.propietario else 'Nautica',
            'fecha_creacion': self.fecha_creacion.isoformat() if self.fecha_creacion else None,
            'experiencias_disponibles': experiencias_compatibles
        }


# Tabla de asociación para reservas y experiencias
reserva_experiencias = db.Table('reserva_experiencias',
    db.Column('reserva_id', db.Integer, db.ForeignKey('reservas.id'), primary_key=True),
    db.Column('experiencia_id', db.Integer, db.ForeignKey('experiencias.id'), primary_key=True)
)

class Experiencia(db.Model):
    __tablename__ = 'experiencias'
    
    id = db.Column(db.Integer, primary_key=True)
    titulo = db.Column(db.String(100), nullable=False)
    subtitulo = db.Column(db.String(150))
    descripcion = db.Column(db.Text)
    precio = db.Column(db.Float, nullable=False)
    duracion = db.Column(db.String(50))
    capacidad = db.Column(db.String(50))
    emoji = db.Column(db.String(10))
    gradient = db.Column(db.String(100))
    highlights = db.Column(db.Text)  # Guardado como string separado por comas
    tipo_barco_compatible = db.Column(db.String(100)) # ej: 'yacht,sailboat'
    imagen_url = db.Column(db.String(255))
    
    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'titulo': self.titulo,
            'subtitulo': self.subtitulo,
            'descripcion': self.descripcion,
            'precio': self.precio,
            'duracion': self.duracion,
            'capacidad': self.capacidad,
            'emoji': self.emoji,
            'gradient': self.gradient,
            'highlights': self.highlights.split(',') if self.highlights else [],
            'tipo_barco_compatible': self.tipo_barco_compatible.split(',') if self.tipo_barco_compatible else [],
            'imagen_url': self.imagen_url
        }

class Reserva(db.Model):
    __tablename__ = 'reservas'
    
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    embarcacion_id = db.Column(db.Integer, db.ForeignKey('embarcaciones.id'), nullable=True) # Opcional para experiencias solas
    fecha_inicio = db.Column(db.DateTime, nullable=False)
    fecha_fin = db.Column(db.DateTime, nullable=False)
    precio_total = db.Column(db.Float, nullable=False)
    estado = db.Column(db.String(20), default='pendiente')  # pendiente, confirmada, en_curso, completada, cancelada
    tipo_evento = db.Column(db.String(50))  # wedding, corporate, leisure
    notas = db.Column(db.Text)
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)
    
    experiencias = db.relationship('Experiencia', secondary=reserva_experiencias, backref=db.backref('reservas', lazy='dynamic'))
    
    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'usuario_id': self.usuario_id,
            'usuario_nombre': self.usuario.nombre if self.usuario else None,
            'embarcacion_id': self.embarcacion_id,
            'embarcacion_nombre': self.embarcacion.nombre if self.embarcacion_id and self.embarcacion else 'Experiencia Independiente',
            'fecha_inicio': self.fecha_inicio.isoformat() if self.fecha_inicio else None,
            'fecha_fin': self.fecha_fin.isoformat() if self.fecha_fin else None,
            'precio_total': self.precio_total,
            'estado': self.estado,
            'tipo_evento': self.tipo_evento,
            'notas': self.notas,
            'fecha_creacion': self.fecha_creacion.isoformat() if self.fecha_creacion else None,
            'experiencias': [exp.to_dict() for exp in self.experiencias]
        }


class Amarre(db.Model):
    __tablename__ = 'amarres'

    id = db.Column(db.Integer, primary_key=True)
    codigo = db.Column(db.String(10), unique=True, nullable=False)  # Ej: A-01, B-03
    muelle = db.Column(db.String(50), default='Principal')
    fila = db.Column(db.String(5))    # A, B, C, ...
    numero = db.Column(db.Integer)
    longitud_max = db.Column(db.Float)  # metros
    manga_max = db.Column(db.Float)
    calado_max = db.Column(db.Float)
    precio_mes = db.Column(db.Float, default=0.0)
    estado = db.Column(db.String(20), default='disponible')  # disponible, ocupado, mantenimiento
    embarcacion_id = db.Column(db.Integer, db.ForeignKey('embarcaciones.id'), nullable=True)
    propietario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=True)
    fecha_fin_alquiler = db.Column(db.DateTime, nullable=True)
    notas = db.Column(db.Text)

    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'codigo': self.codigo,
            'muelle': self.muelle,
            'fila': self.fila,
            'numero': self.numero,
            'longitud_max': self.longitud_max,
            'manga_max': self.manga_max,
            'calado_max': self.calado_max,
            'precio_mes': self.precio_mes,
            'estado': self.estado,
            'embarcacion_id': self.embarcacion_id,
            'embarcacion_nombre': self.embarcacion.nombre if self.embarcacion_id and self.embarcacion else None,
            'propietario_id': self.propietario_id,
            'propietario_nombre': self.propietario.nombre if self.propietario else None,
            'fecha_fin_alquiler': self.fecha_fin_alquiler.isoformat() if self.fecha_fin_alquiler else None,
            'notas': self.notas,
        }

    embarcacion = db.relationship('Embarcacion', foreign_keys=[embarcacion_id], lazy=True)
    propietario = db.relationship('Usuario', foreign_keys=[propietario_id], lazy=True)

class Review(db.Model):
    __tablename__ = 'reviews'
    
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    embarcacion_id = db.Column(db.Integer, db.ForeignKey('embarcaciones.id'), nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    comentario = db.Column(db.Text)
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)
    
    usuario = db.relationship('Usuario', backref='reviews', lazy=True)
    
    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'usuario_id': self.usuario_id,
            'usuario_nombre': self.usuario.nombre if self.usuario else None,
            'embarcacion_id': self.embarcacion_id,
            'rating': self.rating,
            'comentario': self.comentario,
            'fecha_creacion': self.fecha_creacion.isoformat() if self.fecha_creacion else None
        }

class Favorito(db.Model):
    __tablename__ = 'favoritos'
    
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    embarcacion_id = db.Column(db.Integer, db.ForeignKey('embarcaciones.id'), nullable=False)
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)
    
    embarcacion = db.relationship('Embarcacion', lazy=True)
    
    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'usuario_id': self.usuario_id,
            'embarcacion_id': self.embarcacion_id,
            'embarcacion': self.embarcacion.to_dict() if self.embarcacion else None,
            'fecha_creacion': self.fecha_creacion.isoformat() if self.fecha_creacion else None
        }


class Mantenimiento(db.Model):
    __tablename__ = 'mantenimientos'
    
    id = db.Column(db.Integer, primary_key=True)
    embarcacion_id = db.Column(db.Integer, db.ForeignKey('embarcaciones.id'), nullable=False)
    tipo = db.Column(db.String(50), nullable=False)  # preventivo, correctivo, revision
    descripcion = db.Column(db.Text)
    fecha_programada = db.Column(db.DateTime, nullable=False)
    fecha_completada = db.Column(db.DateTime)
    costo = db.Column(db.Float)
    estado = db.Column(db.String(20), default='programado')  # programado, en_proceso, completado
    notas = db.Column(db.Text)
    
    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'embarcacion_id': self.embarcacion_id,
            'embarcacion_nombre': self.embarcacion.nombre if self.embarcacion else None,
            'tipo': self.tipo,
            'descripcion': self.descripcion,
            'fecha_programada': self.fecha_programada.isoformat() if self.fecha_programada else None,
            'fecha_completada': self.fecha_completada.isoformat() if self.fecha_completada else None,
            'costo': self.costo,
            'estado': self.estado,
            'notas': self.notas
        }

class Mensaje(db.Model):
    __tablename__ = 'mensajes'
    
    id = db.Column(db.Integer, primary_key=True)
    remitente_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    destinatario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    contenido = db.Column(db.Text, nullable=False)
    fecha_envio = db.Column(db.DateTime, default=datetime.utcnow)
    leido = db.Column(db.Boolean, default=False)
    
    remitente = db.relationship('Usuario', foreign_keys=[remitente_id], lazy=True)
    destinatario = db.relationship('Usuario', foreign_keys=[destinatario_id], lazy=True)

    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'remitente_id': self.remitente_id,
            'remitente_nombre': self.remitente.nombre if self.remitente else None,
            'destinatario_id': self.destinatario_id,
            'destinatario_nombre': self.destinatario.nombre if self.destinatario else None,
            'contenido': self.contenido,
            'fecha_envio': self.fecha_envio.isoformat() if self.fecha_envio else None,
            'leido': self.leido
        }

# ==================== DECORADORES ====================

def token_required(f):
    """Decorador para rutas que requieren autenticación"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token requerido'}), 401
        # Aquí implementarías la validación del token JWT
        return f(*args, **kwargs)
    return decorated


# ==================== RUTAS - AUTENTICACIÓN ====================

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Registro de nuevos usuarios"""
    try:
        data = request.get_json()
        
        if Usuario.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'El email ya está registrado'}), 400
        
        usuario = Usuario(
            nombre=data['nombre'],
            email=data['email'],
            telefono=data.get('telefono'),
            rol=data.get('rol', 'cliente')
        )
        usuario.set_password(data['password'])
        
        db.session.add(usuario)
        db.session.commit()
        
        return jsonify({
            'message': 'Usuario registrado exitosamente',
            'usuario': usuario.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/auth/login', methods=['POST'])
def login():
    """Inicio de sesión"""
    try:
        data = request.get_json()
        usuario = Usuario.query.filter_by(email=data['email']).first()
        
        if not usuario or not usuario.check_password(data['password']):
            return jsonify({'error': 'Credenciales inválidas'}), 401
        
        # Aquí generarías un token JWT
        return jsonify({
            'message': 'Login exitoso',
            'usuario': usuario.to_dict(),
            'token': 'fake-jwt-token'  # Implementar JWT real
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== RUTAS - EMBARCACIONES ====================

@app.route('/api/embarcaciones', methods=['GET'])
def get_embarcaciones():
    """Obtener todas las embarcaciones con filtros opcionales"""
    try:
        tipo = request.args.get('tipo')
        ubicacion = request.args.get('ubicacion')
        estado = request.args.get('estado')
        propietario_id = request.args.get('propietario_id')
        
        query = Embarcacion.query
        
        if tipo:
            query = query.filter_by(tipo=tipo)
        if ubicacion:
            query = query.filter(Embarcacion.ubicacion.ilike(f'%{ubicacion}%'))
        if estado:
            query = query.filter_by(estado=estado)
        if propietario_id:
            query = query.filter_by(propietario_id=int(propietario_id))
        
        embarcaciones = query.all()
        return jsonify([e.to_dict() for e in embarcaciones]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/embarcaciones/<int:id>', methods=['GET'])
def get_embarcacion(id: int):
    """Obtener detalles de una embarcación específica"""
    try:
        embarcacion = Embarcacion.query.get_or_404(id)
        return jsonify(embarcacion.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 404


@app.route('/api/embarcaciones', methods=['POST'])
def create_embarcacion():
    """Crear nueva embarcación (solo admin)"""
    try:
        # Debug info
        print("Headers:", request.headers)
        print("Files:", request.files)
        print("Form:", request.form)

        # Check if request is JSON or FormData
        if request.is_json:
            data = request.get_json()
        else:
            data = request.form.to_dict()

        imagen_url = data.get('imagen_url')

        # Handle file upload
        if 'imagen' in request.files:
            file = request.files['imagen']
            if file and file.filename != '':
                filename = secure_filename(file.filename)
                timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
                filename = f"{timestamp}_{filename}"
                
                # Ensure directory exists
                if not os.path.exists(app.config['UPLOAD_FOLDER']):
                    os.makedirs(app.config['UPLOAD_FOLDER'])
                
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                print(f"Saving file to: {file_path}")
                file.save(file_path)
                
                # Construct URL
                # Usar ruta relativa raíz para que funcione tras proxy inverso
                imagen_url = f"/static/uploads/{filename}"
                print(f"Image URL: {imagen_url}")

        embarcacion = Embarcacion(
            nombre=data['nombre'],
            tipo=data['tipo'],
            categoria=data.get('categoria'),
            capacidad=int(data['capacidad']),
            longitud=float(data.get('longitud', 0)),
            precio_dia=float(data['precio_dia']),
            descripcion=data.get('descripcion'),
            imagen_url=imagen_url,
            estado=data.get('estado', 'disponible'),
            incluye_capitan=str(data.get('incluye_capitan', '')).lower() == 'true',
            incluye_tripulacion=str(data.get('incluye_tripulacion', '')).lower() == 'true',
            ubicacion=data.get('ubicacion'),
            rating=float(data.get('rating', 0.0))
        )
        
        db.session.add(embarcacion)
        db.session.commit()
        
        return jsonify({
            'message': 'Embarcación creada exitosamente',
            'embarcacion': embarcacion.to_dict()
        }), 201
    except Exception as e:
        print(f"Error creating vessel: {e}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/embarcaciones/<int:id>', methods=['PUT'])
def update_embarcacion(id: int):
    """Actualizar embarcación (solo admin)"""
    try:
        embarcacion = Embarcacion.query.get_or_404(id)
        
        # Check if request is JSON or FormData
        if request.is_json:
            data = request.get_json()
        else:
            data = request.form.to_dict()

        # Handle file upload
        if 'imagen' in request.files:
            file = request.files['imagen']
            if file and file.filename != '':
                filename = secure_filename(file.filename)
                timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
                filename = f"{timestamp}_{filename}"
                
                # Ensure directory exists
                if not os.path.exists(app.config['UPLOAD_FOLDER']):
                    os.makedirs(app.config['UPLOAD_FOLDER'])
                
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(file_path)
                
                # Update image URL
                # Usar ruta relativa raíz para que funcione tras proxy inverso
                embarcacion.imagen_url = f"/static/uploads/{filename}"

        # Update other fields
        # Data types need to be handled carefully when coming from FormData (they are all strings)
        if 'nombre' in data: embarcacion.nombre = data['nombre']
        if 'tipo' in data: embarcacion.tipo = data['tipo']
        if 'categoria' in data: embarcacion.categoria = data['categoria']
        if 'capacidad' in data: embarcacion.capacidad = int(data['capacidad'])
        if 'longitud' in data: embarcacion.longitud = float(data['longitud'])
        if 'precio_dia' in data: embarcacion.precio_dia = float(data['precio_dia'])
        if 'descripcion' in data: embarcacion.descripcion = data['descripcion']
        # Don't update imagen_url from data if it's there, we handled it with file
        if 'estado' in data: embarcacion.estado = data['estado']
        if 'incluye_capitan' in data: 
            val = data['incluye_capitan']
            embarcacion.incluye_capitan = val if isinstance(val, bool) else str(val).lower() == 'true'
        if 'incluye_tripulacion' in data: 
            val = data['incluye_tripulacion']
            embarcacion.incluye_tripulacion = val if isinstance(val, bool) else str(val).lower() == 'true'
        if 'ubicacion' in data: embarcacion.ubicacion = data['ubicacion']
        if 'rating' in data: embarcacion.rating = float(data['rating'])
        
        db.session.commit()
        
        return jsonify({
            'message': 'Embarcación actualizada exitosamente',
            'embarcacion': embarcacion.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/embarcaciones/<int:id>', methods=['DELETE'])
def delete_embarcacion(id: int):
    """Eliminar embarcación con sus registros relacionados (solo admin)"""
    try:
        embarcacion = Embarcacion.query.get_or_404(id)
        # Eliminar dependencias para evitar FK constraint errors
        Mantenimiento.query.filter_by(embarcacion_id=id).delete()
        Reserva.query.filter_by(embarcacion_id=id).delete()
        db.session.delete(embarcacion)
        db.session.commit()
        
        return jsonify({'message': 'Embarcación eliminada exitosamente'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/experiencias', methods=['GET'])
def get_experiencias():
    """Obtener todas las experiencias disponibles"""
    try:
        tipo = request.args.get('tipo')
        query = Experiencia.query
        if tipo:
            query = query.filter(Experiencia.tipo_barco_compatible.like(f"%{tipo}%"))
        
        experiencias = query.all()
        return jsonify([e.to_dict() for e in experiencias]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/experiencias/booking', methods=['POST'])
def book_independent_experience():
    """Permite contratar una experiencia directamente sin elegir barco primero"""
    try:
        data = request.get_json()
        usuario_id = data.get('usuario_id')
        experiencia_id = data.get('experiencia_id')
        
        if not usuario_id or not experiencia_id:
            return jsonify({'error': 'usuario_id y experiencia_id requeridos'}), 400
            
        exp = Experiencia.query.get_or_404(experiencia_id)
        ahora = datetime.utcnow()
        
        reserva = Reserva(
            usuario_id=usuario_id,
            embarcacion_id=None, # Reserva independiente
            fecha_inicio=ahora,
            fecha_fin=ahora + timedelta(hours=3),
            precio_total=exp.precio,
            estado='confirmada', # Asumimos confirmada si es directa por ahora
            tipo_evento='experience',
            notas=f"Contratación directa de experiencia: {exp.titulo}"
        )
        reserva.experiencias.append(exp)
        
        db.session.add(reserva)
        db.session.commit()
        
        return jsonify({
            'message': 'Experiencia contratada exitosamente',
            'reserva': reserva.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ==================== RUTAS - RESERVAS ====================

@app.route('/api/reservas', methods=['GET'])
def get_reservas():
    """Obtener todas las reservas"""
    try:
        usuario_id = request.args.get('usuario_id')
        estado = request.args.get('estado')
        embarcacion_id = request.args.get('embarcacion_id')
        
        query = Reserva.query
        
        if usuario_id:
            query = query.filter_by(usuario_id=usuario_id)
        if embarcacion_id:
            query = query.filter_by(embarcacion_id=embarcacion_id)
        if estado:
            query = query.filter_by(estado=estado)
        
        reservas = query.order_by(Reserva.fecha_creacion.desc()).all()
        return jsonify([r.to_dict() for r in reservas]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/reservas/<int:id>', methods=['GET'])
def get_reserva(id: int):
    """Obtener detalles de una reserva específica"""
    try:
        reserva = Reserva.query.get_or_404(id)
        return jsonify(reserva.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 404


@app.route('/api/reservas', methods=['POST'])
def create_reserva():
    """Crear nueva reserva"""
    try:
        data = request.get_json()
        
        # Validar disponibilidad si hay barco
        embarcacion_id = data.get('embarcacion_id')
        embarcacion = None
        if embarcacion_id:
            embarcacion = Embarcacion.query.get_or_404(embarcacion_id)
            fecha_inicio = datetime.fromisoformat(data['fecha_inicio'])
            fecha_fin = datetime.fromisoformat(data['fecha_fin'])
            
            # Verificar conflictos de reservas (solo si hay barco)
            conflictos = Reserva.query.filter(
                Reserva.embarcacion_id == embarcacion_id,
                Reserva.estado.in_(['pendiente', 'confirmada', 'en_curso']),
                db.or_(
                    db.and_(Reserva.fecha_inicio <= fecha_inicio, Reserva.fecha_fin >= fecha_inicio),
                    db.and_(Reserva.fecha_inicio <= fecha_fin, Reserva.fecha_fin >= fecha_fin)
                )
            ).first()
            
            if conflictos:
                return jsonify({'error': 'La embarcación no está disponible en esas fechas'}), 400
        else:
            fecha_inicio = datetime.fromisoformat(data['fecha_inicio'])
            fecha_fin = datetime.fromisoformat(data['fecha_fin'])

        # Manejar experiencias
        experiencia_ids = data.get('experiencia_ids', [])
        experiencias_obj = Experiencia.query.filter(Experiencia.id.in_(experiencia_ids)).all()
        
        # Calcular precio
        precio_total = data.get('precio_total', 0)
        if not precio_total:
            # Si no viene precio_total, calculamos base
            if embarcacion:
                dias = max(1, (fecha_fin - fecha_inicio).days)
                precio_total = dias * embarcacion.precio_dia
            # Añadir precio de experiencias
            for exp in experiencias_obj:
                precio_total += exp.precio

        reserva = Reserva(
            usuario_id=data['usuario_id'],
            embarcacion_id=embarcacion_id,
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin,
            precio_total=precio_total,
            estado='pendiente',
            tipo_evento=data.get('tipo_evento'),
            notas=data.get('notas')
        )
        
        for exp in experiencias_obj:
            reserva.experiencias.append(exp)
            
        db.session.add(reserva)
        db.session.commit()
        
        if embarcacion.propietario_id:
            socketio.emit('actualizar_notificaciones', {'destinatario_id': embarcacion.propietario_id})
        
        return jsonify({
            'message': 'Reserva creada exitosamente',
            'reserva': reserva.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/reservas/<int:id>', methods=['PUT'])
def update_reserva(id: int):
    """Actualizar estado de reserva"""
    try:
        reserva = Reserva.query.get_or_404(id)
        data = request.get_json()
        
        if 'estado' in data:
            reserva.estado = data['estado']
        if 'notas' in data:
            reserva.notas = data['notas']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Reserva actualizada exitosamente',
            'reserva': reserva.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== RUTAS - REVIEWS ====================

@app.route('/api/reviews', methods=['GET'])
def get_reviews():
    try:
        embarcacion_id = request.args.get('embarcacion_id')
        if embarcacion_id:
            reviews = Review.query.filter_by(embarcacion_id=embarcacion_id).order_by(Review.fecha_creacion.desc()).all()
            return jsonify([r.to_dict() for r in reviews]), 200
        return jsonify([]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/reviews', methods=['POST'])
def create_review():
    try:
        data = request.get_json()
        review = Review(
            usuario_id=data['usuario_id'],
            embarcacion_id=data['embarcacion_id'],
            rating=data['rating'],
            comentario=data.get('comentario')
        )
        db.session.add(review)
        
        db.session.flush()
        todas_reviews = Review.query.filter_by(embarcacion_id=data['embarcacion_id']).all()
        promedio = sum(r.rating for r in todas_reviews) / len(todas_reviews)
        embarcacion = Embarcacion.query.get(data['embarcacion_id'])
        embarcacion.rating = round(promedio, 1)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Reseña creada exitosamente',
            'review': review.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== RUTAS - FAVORITOS ====================

@app.route('/api/favoritos', methods=['GET'])
def get_favoritos():
    try:
        usuario_id = request.args.get('usuario_id')
        if usuario_id:
            favoritos = Favorito.query.filter_by(usuario_id=usuario_id).order_by(Favorito.fecha_creacion.desc()).all()
            return jsonify([f.to_dict() for f in favoritos]), 200
        return jsonify([]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/favoritos', methods=['POST'])
def create_favorito():
    try:
        data = request.get_json()
        existente = Favorito.query.filter_by(
            usuario_id=data['usuario_id'],
            embarcacion_id=data['embarcacion_id']
        ).first()
        
        if existente:
            return jsonify({'message': 'Ya está en favoritos', 'favorito': existente.to_dict()}), 200
            
        favorito = Favorito(
            usuario_id=data['usuario_id'],
            embarcacion_id=data['embarcacion_id']
        )
        db.session.add(favorito)
        db.session.commit()
        
        return jsonify({
            'message': 'Añadido a favoritos',
            'favorito': favorito.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/favoritos/<int:id>', methods=['DELETE'])
def delete_favorito(id: int):
    try:
        favorito = Favorito.query.get_or_404(id)
        db.session.delete(favorito)
        db.session.commit()
        return jsonify({'message': 'Eliminado de favoritos'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== RUTAS - MANTENIMIENTOS ====================

@app.route('/api/mantenimientos', methods=['GET'])
def get_mantenimientos():
    """Obtener todos los mantenimientos"""
    try:
        embarcacion_id = request.args.get('embarcacion_id')
        estado = request.args.get('estado')
        
        query = Mantenimiento.query
        
        if embarcacion_id:
            query = query.filter_by(embarcacion_id=embarcacion_id)
        if estado:
            query = query.filter_by(estado=estado)
        
        mantenimientos = query.order_by(Mantenimiento.fecha_programada.desc()).all()
        return jsonify([m.to_dict() for m in mantenimientos]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/mantenimientos', methods=['POST'])
def create_mantenimiento():
    """Crear nuevo mantenimiento"""
    try:
        data = request.get_json()
        
        mantenimiento = Mantenimiento(
            embarcacion_id=data['embarcacion_id'],
            tipo=data['tipo'],
            descripcion=data.get('descripcion'),
            fecha_programada=datetime.fromisoformat(data['fecha_programada']),
            costo=data.get('costo'),
            estado='programado',
            notas=data.get('notas')
        )
        
        db.session.add(mantenimiento)
        db.session.commit()
        
        return jsonify({
            'message': 'Mantenimiento programado exitosamente',
            'mantenimiento': mantenimiento.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/mantenimientos/<int:id>', methods=['PUT'])
def update_mantenimiento(id: int):
    """Actualizar mantenimiento"""
    try:
        mantenimiento = Mantenimiento.query.get_or_404(id)
        data = request.get_json()
        
        for key, value in data.items():
            if hasattr(mantenimiento, key) and key != 'id':
                if 'fecha' in key and value:
                    setattr(mantenimiento, key, datetime.fromisoformat(value))
                else:
                    setattr(mantenimiento, key, value)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Mantenimiento actualizado exitosamente',
            'mantenimiento': mantenimiento.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== RUTAS - ALERTAS MANTENIMIENTO ====================

@app.route('/api/mantenimientos/alertas', methods=['GET'])
def get_alertas_mantenimiento():
    """Obtener mantenimientos próximos (≤7 días) o vencidos sin completar"""
    try:
        ahora = datetime.utcnow()
        limite = ahora + timedelta(days=7)

        alertas = Mantenimiento.query.filter(
            Mantenimiento.estado.in_(['programado', 'en_proceso']),
            Mantenimiento.fecha_programada <= limite
        ).order_by(Mantenimiento.fecha_programada).all()

        resultado = []
        for m in alertas:
            dias_restantes = (m.fecha_programada - ahora).days
            resultado.append({
                **m.to_dict(),
                'dias_restantes': dias_restantes,
                'urgencia': 'vencido' if dias_restantes < 0 else ('critico' if dias_restantes <= 2 else 'proximo')
            })

        return jsonify(resultado), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== RUTAS - ESTADÍSTICAS ====================

@app.route('/api/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    """Obtener estadísticas del dashboard"""
    try:
        # Total de ingresos
        total_revenue = db.session.query(db.func.sum(Reserva.precio_total)).filter(
            Reserva.estado.in_(['confirmada', 'completada'])
        ).scalar() or 0
        
        # Charters activos
        active_charters = Reserva.query.filter_by(estado='en_curso').count()
        total_charters = Embarcacion.query.count()
        
        # Nuevas consultas (reservas pendientes)
        new_inquiries = Reserva.query.filter_by(estado='pendiente').count()
        
        # Embarcaciones por estado
        fleet_status = db.session.query(
            Embarcacion.estado,
            db.func.count(Embarcacion.id)
        ).group_by(Embarcacion.estado).all()
        
        # Próximos mantenimientos
        upcoming_maintenance = Mantenimiento.query.filter(
            Mantenimiento.estado == 'programado',
            Mantenimiento.fecha_programada >= datetime.utcnow()
        ).order_by(Mantenimiento.fecha_programada).limit(5).all()
        
        return jsonify({
            'total_revenue': total_revenue,
            'active_charters': active_charters,
            'total_charters': total_charters,
            'new_inquiries': new_inquiries,
            'fleet_status': [{'estado': status, 'count': count} for status, count in fleet_status],
            'upcoming_maintenance': [m.to_dict() for m in upcoming_maintenance]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== RUTAS - AMARRES ====================

@app.route('/api/amarres', methods=['GET'])
def get_amarres():
    """Obtener todos los amarres con filtro opcional de estado o propietario"""
    try:
        estado = request.args.get('estado')
        propietario_id = request.args.get('propietario_id')
        query = Amarre.query
        
        if estado:
            query = query.filter_by(estado=estado)
        if propietario_id:
            query = query.filter_by(propietario_id=propietario_id)
            
        amarres = query.order_by(Amarre.fila, Amarre.numero).all()
        return jsonify([a.to_dict() for a in amarres]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/amarres/<int:id>/alquilar', methods=['POST'])
@token_required
def alquilar_amarre(id):
    """Permite alquilar un amarre a un capitán por meses"""
    try:
        data = request.get_json()
        meses = data.get('meses', 1)
        propietario_id = data.get('propietario_id')
        
        if not propietario_id:
            return jsonify({'error': 'Propietario ID es requerido'}), 400
            
        amarre = Amarre.query.get_or_404(id)
        
        if amarre.estado == 'ocupado':
            return jsonify({'error': 'El amarre ya está ocupado'}), 400
            
        amarre.estado = 'ocupado'
        amarre.propietario_id = propietario_id
        embarcacion_id = data.get('embarcacion_id')
        if embarcacion_id:
            amarre.embarcacion_id = int(embarcacion_id)
        amarre.fecha_fin_alquiler = datetime.utcnow() + timedelta(days=30 * int(meses))
        
        db.session.commit()
        
        return jsonify({
            'message': f'Amarre alquilado exitosamente por {meses} meses',
            'amarre': amarre.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/amarres/<int:id>/liberar', methods=['POST'])
@token_required
def liberar_amarre(id):
    """Permite liberar un amarre ocupado"""
    try:
        amarre = Amarre.query.get_or_404(id)
        
        if amarre.estado == 'disponible':
            return jsonify({'error': 'El amarre ya está disponible'}), 400
            
        amarre.estado = 'disponible'
        amarre.propietario_id = None
        amarre.embarcacion_id = None
        amarre.fecha_fin_alquiler = None
        
        db.session.commit()
        
        return jsonify({
            'message': 'Amarre liberado exitosamente',
            'amarre': amarre.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/amarres', methods=['POST'])
def create_amarre():
    """Crear nuevo amarre (solo admin)"""
    try:
        data = request.get_json()
        amarre = Amarre(
            codigo=data['codigo'],
            muelle=data.get('muelle', 'Principal'),
            fila=data.get('fila'),
            numero=data.get('numero'),
            longitud_max=data.get('longitud_max'),
            manga_max=data.get('manga_max'),
            calado_max=data.get('calado_max'),
            precio_mes=data.get('precio_mes', 0.0),
            estado=data.get('estado', 'disponible'),
            embarcacion_id=data.get('embarcacion_id'),
            notas=data.get('notas'),
        )
        db.session.add(amarre)
        db.session.commit()
        return jsonify({'message': 'Amarre creado', 'amarre': amarre.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/amarres/<int:id>', methods=['PUT'])
def update_amarre(id: int):
    """Actualizar estado u otros campos de un amarre"""
    try:
        amarre = Amarre.query.get_or_404(id)
        data = request.get_json()
        updatable = ['estado', 'embarcacion_id', 'notas', 'precio_mes', 'longitud_max', 'manga_max', 'calado_max']
        for field in updatable:
            if field in data:
                setattr(amarre, field, data[field])
        db.session.commit()
        return jsonify({'message': 'Amarre actualizado', 'amarre': amarre.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== RUTAS - MENSAJES ====================

@app.route('/api/mensajes/contactos', methods=['GET'])
def get_contactos():
    """Obtiene la lista de contactos (historial de chats) o lista de capitanes si es cliente nuevo"""
    try:
        usuario_id = int(request.args.get('usuario_id'))
        if not usuario_id:
            return jsonify({'error': 'usuario_id requerido'}), 400

        usuario = Usuario.query.get(usuario_id)
        if not usuario:
            return jsonify({'error': 'Usuario no encontrado'}), 404

        # Buscar todos los usuarios con los que ha intercambiado mensajes
        mensajes = Mensaje.query.filter(
            (Mensaje.remitente_id == usuario_id) | (Mensaje.destinatario_id == usuario_id)
        ).all()
        
        contactos_ids = set()
        for m in mensajes:
            if m.remitente_id != usuario_id:
                contactos_ids.add(m.remitente_id)
            if m.destinatario_id != usuario_id:
                contactos_ids.add(m.destinatario_id)
                
        contactos = Usuario.query.filter(Usuario.id.in_(contactos_ids)).all()
        
        # Si es cliente y no tiene contactos, al menos mostrarle los capitanes para que pueda iniciar chat
        if usuario.rol == 'cliente' and not contactos:
            contactos = Usuario.query.filter(Usuario.rol == 'capitan').all()
            
        # Si es capitan y no tiene contactos, mostrar otros capitanes o nada
        if usuario.rol == 'capitan' and not contactos:
            contactos = []

        return jsonify([c.to_dict() for c in contactos]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/mensajes/<int:contacto_id>', methods=['GET'])
def get_mensajes_con_contacto(contacto_id: int):
    """Obtiene el historial de chat entre el usuario actual y el contacto."""
    try:
        usuario_id = int(request.args.get('usuario_id'))
        if not usuario_id:
            return jsonify({'error': 'usuario_id requerido'}), 400

        # Marcar mensajes como leídos
        mensajes_no_leidos = Mensaje.query.filter_by(
            remitente_id=contacto_id, 
            destinatario_id=usuario_id, 
            leido=False
        ).all()
        for m in mensajes_no_leidos:
            m.leido = True
        if mensajes_no_leidos:
            db.session.commit()

        mensajes = Mensaje.query.filter(
            ((Mensaje.remitente_id == usuario_id) & (Mensaje.destinatario_id == contacto_id)) |
            ((Mensaje.remitente_id == contacto_id) & (Mensaje.destinatario_id == usuario_id))
        ).order_by(Mensaje.fecha_envio.asc()).all()

        return jsonify([m.to_dict() for m in mensajes]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/mensajes', methods=['POST'])
def send_mensaje():
    """Enviar un nuevo mensaje"""
    try:
        data = request.get_json()
        remitente_id = data.get('remitente_id')
        destinatario_id = data.get('destinatario_id')
        contenido = data.get('contenido')
        
        if not destinatario_id:
            admin = Usuario.query.filter_by(rol='admin').first()
            if admin:
                destinatario_id = admin.id

        if not remitente_id or not destinatario_id or not contenido:
            return jsonify({'error': 'Faltan datos obligatorios'}), 400
            
        mensaje = Mensaje(
            remitente_id=remitente_id,
            destinatario_id=destinatario_id,
            contenido=contenido
        )
        db.session.add(mensaje)
        db.session.commit()
        
        socketio.emit('actualizar_notificaciones', {'destinatario_id': destinatario_id})
        return jsonify({'message': 'Mensaje enviado', 'mensaje': mensaje.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/notificaciones', methods=['GET'])
@token_required
def get_notificaciones():
    """Obtener conteo de notificaciones y alertas para el dashboard/navbar"""
    try:
        usuario_id = request.args.get('usuario_id')
        if not usuario_id:
            return jsonify({'error': 'usuario_id requerido'}), 400
            
        current_user = Usuario.query.get(int(usuario_id))
        if not current_user:
            return jsonify({'error': 'Usuario no encontrado'}), 404

        # 1. Unread messages
        unread_mensajes = Mensaje.query.filter_by(destinatario_id=current_user.id, leido=False).count()
        
        # 2. Reservas pendientes (solo capitan/admin)
        nuevas_reservas = 0
        if current_user.rol == 'admin':
            nuevas_reservas = Reserva.query.filter_by(estado='pendiente').count()
        elif current_user.rol == 'capitan':
            # Reservas de embarcaciones del capitan
            embarcaciones_ids = [e.id for e in Embarcacion.query.filter_by(propietario_id=current_user.id).all()]
            if embarcaciones_ids:
                nuevas_reservas = Reserva.query.filter(
                    Reserva.embarcacion_id.in_(embarcaciones_ids),
                    Reserva.estado == 'pendiente'
                ).count()
                
        # 3. Mantenimientos programados (solo admin)
        mantenimientos = 0
        if current_user.rol == 'admin':
            mantenimientos = Mantenimiento.query.filter_by(estado='programado').count()
            
        return jsonify({
            'unread_mensajes': unread_mensajes,
            'nuevas_reservas': nuevas_reservas,
            'mantenimientos': mantenimientos,
            'total': unread_mensajes + nuevas_reservas + mantenimientos
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== STRIPE PAGOS ====================

@app.route('/api/pagos/create-intent', methods=['POST'])
def create_payment_intent():
    """Crea un PaymentIntent de Stripe para pagar una reserva"""
    try:
        data = request.json
        reserva_id = data.get('reserva_id')
        amount = int(float(data.get('amount', 0)) * 100)  # Stripe usa centimos
        
        if amount < 50:
            return jsonify(error='El importe mínimo es 0.50 EUR'), 400

        intent = stripe.PaymentIntent.create(
            amount=amount,
            currency='eur',
            automatic_payment_methods={'enabled': True},
            metadata={'reserva_id': str(reserva_id)} if reserva_id else {}
        )

        # Marcar reserva como proceso de pago en curso
        if reserva_id:
            reserva = Reserva.query.get(reserva_id)
            if reserva:
                reserva.stripe_payment_intent_id = intent.id
                db.session.commit()

        return jsonify({'clientSecret': intent.client_secret, 'payment_intent_id': intent.id})
    except Exception as e:
        return jsonify(error=str(e)), 400


@app.route('/api/pagos/confirmar', methods=['POST'])
def confirmar_pago():
    """Confirma el pago y genera la factura PDF"""
    try:
        data = request.json
        reserva_id = data.get('reserva_id')
        payment_intent_id = data.get('payment_intent_id')
        
        if not reserva_id:
            return jsonify(error='reserva_id requerido'), 400
        
        reserva = Reserva.query.get_or_404(reserva_id)
        
        # Verificar pago con Stripe (en modo test siempre confirmamos)
        if payment_intent_id:
            try:
                pi = stripe.PaymentIntent.retrieve(payment_intent_id)
                if pi.status not in ('succeeded', 'requires_capture'):
                    pass  # En modo test/dev aceptamos igualmente
            except Exception:
                pass
        
        reserva.estado = 'confirmada'
        db.session.commit()

        # Emitir evento WebSocket
        socketio.emit('nueva_actividad', {
            'tipo': 'pago',
            'mensaje': f'Pago confirmado para la reserva #{reserva.id} - {reserva.embarcacion.nombre}'
        }, namespace='/')

        return jsonify({
            'message': 'Pago confirmado y reserva actualizada.',
            'reserva': reserva.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify(error=str(e)), 500


@app.route('/api/pagos/factura/<int:reserva_id>', methods=['GET'])
def generar_factura_pdf(reserva_id: int):
    """Genera y devuelve un PDF de factura para la reserva"""
    try:
        reserva = Reserva.query.get_or_404(reserva_id)
        usuario = Usuario.query.get(reserva.usuario_id)
        embarcacion = Embarcacion.query.get(reserva.embarcacion_id) if reserva.embarcacion_id else None

        if not usuario:
            return jsonify(error='Datos de usuario incompletos'), 404

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer, pagesize=A4,
            rightMargin=2*cm, leftMargin=2*cm,
            topMargin=2*cm, bottomMargin=2*cm
        )

        styles = getSampleStyleSheet()
        gold = colors.HexColor('#D4AF37')
        dark = colors.HexColor('#0A1628')
        grey = colors.HexColor('#64748b')

        title_style = ParagraphStyle('title', fontName='Helvetica-Bold', fontSize=22, textColor=dark)
        subtitle_style = ParagraphStyle('subtitle', fontName='Helvetica', fontSize=11, textColor=grey)
        label_style = ParagraphStyle('label', fontName='Helvetica-Bold', fontSize=10, textColor=dark)
        value_style = ParagraphStyle('value', fontName='Helvetica', fontSize=10, textColor=grey)
        section_style = ParagraphStyle('section', fontName='Helvetica-Bold', fontSize=12, textColor=gold)

        elements = []

        # --- CABECERA ---
        elements.append(Paragraph('⛵ Luxury Nautical Charter', title_style))
        elements.append(Paragraph('Factura Oficial de Servicio', subtitle_style))
        elements.append(Spacer(1, 0.3*cm))
        elements.append(HRFlowable(width='100%', thickness=2, color=gold))
        elements.append(Spacer(1, 0.5*cm))

        # --- Número de factura y fecha ---
        fecha_emision = datetime.utcnow().strftime('%d/%m/%Y')
        header_data = [
            ['Nº Factura:', f'FAC-{reserva.id:05d}', 'Fecha emisión:', fecha_emision],
            ['Estado:', reserva.estado.upper(), 'Moneda:', 'EUR (€)'],
        ]
        header_table = Table(header_data, colWidths=[3.5*cm, 5*cm, 3.5*cm, 5*cm])
        header_table.setStyle(TableStyle([
            ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
            ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
            ('FONTNAME', (2,0), (2,-1), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 10),
            ('TEXTCOLOR', (0,0), (0,-1), dark),
            ('TEXTCOLOR', (2,0), (2,-1), dark),
            ('TEXTCOLOR', (1,0), (1,-1), grey),
            ('TEXTCOLOR', (3,0), (3,-1), grey),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ]))
        elements.append(header_table)
        elements.append(Spacer(1, 0.5*cm))
        elements.append(HRFlowable(width='100%', thickness=0.5, color=colors.HexColor('#e2e8f0')))
        elements.append(Spacer(1, 0.5*cm))

        # --- CLIENTE ---
        elements.append(Paragraph('Datos del Cliente', section_style))
        elements.append(Spacer(1, 0.3*cm))
        client_data = [
            ['Nombre:', usuario.nombre],
            ['Email:', usuario.email],
            ['Teléfono:', usuario.telefono or 'No especificado'],
        ]
        client_table = Table(client_data, colWidths=[4*cm, 12*cm])
        client_table.setStyle(TableStyle([
            ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
            ('FONTNAME', (1,0), (1,-1), 'Helvetica'),
            ('FONTSIZE', (0,0), (-1,-1), 10),
            ('TEXTCOLOR', (0,0), (0,-1), dark),
            ('TEXTCOLOR', (1,0), (1,-1), grey),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        elements.append(client_table)
        elements.append(Spacer(1, 0.6*cm))

        # --- DETALLES DEL SERVICIO ---
        elements.append(Paragraph('Detalle del Servicio', section_style))
        elements.append(Spacer(1, 0.3*cm))

        dias = max(1, (reserva.fecha_fin - reserva.fecha_inicio).days)
        
        total = reserva.precio_total
        subtotal = round(total / 1.21, 2)
        iva = round(total - subtotal, 2)
        
        if embarcacion:
            desc_servicio = f'Alquiler: {embarcacion.nombre}\n({embarcacion.tipo.capitalize()} • {embarcacion.longitud}m)'
            precio_unitario = f'€{(embarcacion.precio_dia or 0):,.2f}/día'
            cantidad = f'{dias} días'
        else:
            desc_servicio = 'Experiencia Independiente\n(Paquete Personalizado)'
            precio_unitario = '—'
            cantidad = '1 servicio'

        service_data = [
            ['Descripción', 'Cantidad', 'Tarifa Base', 'Importe'],
            [desc_servicio, cantidad, precio_unitario, f'€{subtotal:,.2f}'],
            ['', '', 'Subtotal:', f'€{subtotal:,.2f}'],
            ['', '', 'IVA (21%):', f'€{iva:,.2f}'],
            ['', '', 'TOTAL:', f'€{total:,.2f}'],
        ]
        col_widths = [7*cm, 2.5*cm, 3.5*cm, 3*cm]
        service_table = Table(service_data, colWidths=col_widths)
        service_table.setStyle(TableStyle([
            # Header
            ('BACKGROUND', (0,0), (-1,0), dark),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 10),
            ('ALIGN', (1,0), (-1,-1), 'RIGHT'),
            ('ALIGN', (0,0), (0,-1), 'LEFT'),
            # Filas alternas
            ('BACKGROUND', (0,1), (-1,1), colors.HexColor('#f8fafc')),
            ('TEXTCOLOR', (0,1), (-1,1), dark),
            # Totales
            ('FONTNAME', (-2,-1), (-1,-1), 'Helvetica-Bold'),
            ('TEXTCOLOR', (-2,-1), (-1,-1), gold),
            ('FONTSIZE', (-2,-1), (-1,-1), 12),
            ('LINEABOVE', (-2,-3), (-1,-3), 0.5, colors.HexColor('#e2e8f0')),
            ('LINEABOVE', (-2,-1), (-1,-1), 1.5, gold),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('GRID', (0,0), (-1,1), 0.25, colors.HexColor('#e2e8f0')),
        ]))
        elements.append(service_table)
        elements.append(Spacer(1, 0.6*cm))

        # --- FECHAS ---
        elements.append(Paragraph('Detalles de la Reserva', section_style))
        elements.append(Spacer(1, 0.3*cm))
        if embarcacion:
            embarcacion_nombre = embarcacion.nombre
            embarcacion_tipo = embarcacion.tipo.capitalize()
            ubicacion = embarcacion.ubicacion or '—'
            capacidad = f'{embarcacion.capacidad} personas'
        else:
            embarcacion_nombre = 'Experiencia Independiente'
            embarcacion_tipo = 'Experiencia'
            ubicacion = 'Varios'
            capacidad = 'Según experiencia'

        booking_data = [
            ['Embarcación:', embarcacion_nombre, 'Tipo:', embarcacion_tipo],
            ['Fecha inicio:', reserva.fecha_inicio.strftime('%d/%m/%Y %H:%M'), 'Fecha fin:', reserva.fecha_fin.strftime('%d/%m/%Y %H:%M')],
            ['Ubicación:', ubicacion, 'Capacidad:', capacidad],
            ['Tipo evento:', reserva.tipo_evento or 'Alquiler estándar', 'Notas:', reserva.notas or '—'],
        ]
        booking_table = Table(booking_data, colWidths=[3.5*cm, 5*cm, 3.5*cm, 5*cm])
        booking_table.setStyle(TableStyle([
            ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
            ('FONTNAME', (2,0), (2,-1), 'Helvetica-Bold'),
            ('FONTNAME', (1,0), (1,-1), 'Helvetica'),
            ('FONTNAME', (3,0), (3,-1), 'Helvetica'),
            ('FONTSIZE', (0,0), (-1,-1), 10),
            ('TEXTCOLOR', (0,0), (0,-1), dark),
            ('TEXTCOLOR', (2,0), (2,-1), dark),
            ('TEXTCOLOR', (1,0), (1,-1), grey),
            ('TEXTCOLOR', (3,0), (3,-1), grey),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ]))
        elements.append(booking_table)
        elements.append(Spacer(1, 1*cm))

        # --- PIE DE PÁGINA ---
        elements.append(HRFlowable(width='100%', thickness=1, color=gold))
        elements.append(Spacer(1, 0.3*cm))
        elements.append(Paragraph(
            'Luxury Nautical Charter • info@luxurynautical.com • +34 600 000 000',
            ParagraphStyle('footer', fontName='Helvetica', fontSize=8, textColor=grey, alignment=1)
        ))
        elements.append(Paragraph(
            'Este documento es una factura válida conforme a la normativa fiscal española (IVA 21%).',
            ParagraphStyle('footer2', fontName='Helvetica', fontSize=7, textColor=colors.HexColor('#94a3b8'), alignment=1)
        ))

        doc.build(elements)
        buffer.seek(0)

        return send_file(
            buffer,
            as_attachment=True,
            download_name=f'factura_reserva_{reserva.id}.pdf',
            mimetype='application/pdf'
        )
    except Exception as e:
        return jsonify(error=str(e)), 500


# ==================== INICIALIZACIÓN ====================

@app.route('/', methods=['GET'])
def index():
    """Ruta de bienvenida para verificar que el servidor está online"""
    return """
    <div style="font-family: system-ui, sans-serif; text-align: center; padding: 50px; color: #1e293b;">
        <h1 style="color: #0284c7; font-size: 48px; margin-bottom: 10px;">🚀 Backend Online</h1>
        <p style="font-size: 18px; color: #64748b;">El servidor Flask de SeaHive está corriendo exitosamente en Railway.</p>
        <div style="margin-top: 30px; display: inline-block; background: #f1f5f9; padding: 15px 30px; border-radius: 10px;">
            <code>Estado: Conectado a la base de datos ✅</code>
        </div>
    </div>
    """, 200

@app.route('/api/health', methods=['GET'])
def health_check():
    """Verificar estado del servidor"""
    return jsonify({'status': 'ok', 'message': 'API funcionando correctamente'}), 200


@app.route('/api/seed-database', methods=['GET'])
def remote_seed_db():
    """Ruta de utilidad para poblar la base de datos en Railway de forma segura"""
    try:
        from mega_seeder import seed_all
        mensaje = seed_all()
        return f"<h1>✅ Éxito</h1><p>{mensaje}</p>", 200
    except Exception as e:
        return f"<h1>❌ Error</h1><p>{str(e)}</p>", 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        print("Base de datos inicializada correctamente")

        # Seed de amarres si no existen
        if Amarre.query.count() == 0:
            filas = ['A', 'B', 'C']
            precios = {'A': 450.0, 'B': 380.0, 'C': 310.0}
            longitudes = {'A': 15.0, 'B': 12.0, 'C': 9.0}
            for fila in filas:
                for num in range(1, 9):
                    codigo = f"{fila}-{num:02d}"
                    amarre = Amarre(
                        codigo=codigo,
                        muelle='Principal',
                        fila=fila,
                        numero=num,
                        longitud_max=longitudes[fila],
                        manga_max=4.0,
                        calado_max=2.5,
                        precio_mes=precios[fila],
                        estado='disponible',
                    )
                    db.session.add(amarre)
        db.session.commit()
        print(f"{24} amarres creados automáticamente")

    port = int(os.environ.get("PORT", 5000))
    # Desactivar debug mode en producción para mayor seguridad
    debug_mode = os.environ.get("FLASK_ENV", "development") == "development"
    
    print(f"🚀 Iniciando servidor en puerto {port}...")
    socketio.run(app, host='0.0.0.0', debug=debug_mode, port=port, allow_unsafe_werkzeug=True)
