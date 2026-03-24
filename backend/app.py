"""
Backend principal para el sistema de alquiler de barcos
Arquitectura: Flask + SQLAlchemy + MariaDB
"""
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import os
from functools import wraps
from werkzeug.utils import secure_filename
import stripe
from dotenv import load_dotenv

load_dotenv()

# Configuración de la aplicación
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root@localhost/alquiler_barcos'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.urandom(24)
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'uploads')
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Configuración Stripe
stripe.api_key = os.environ.get("STRIPE_API_KEY", "sk_test_placeholder")

# Inicialización de extensiones
db = SQLAlchemy(app)
CORS(app, resources={r"/*": {"origins": "*"}})

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
            'fecha_registro': self.fecha_registro.isoformat()
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
            'fecha_creacion': self.fecha_creacion.isoformat()
        }


class Reserva(db.Model):
    __tablename__ = 'reservas'
    
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    embarcacion_id = db.Column(db.Integer, db.ForeignKey('embarcaciones.id'), nullable=False)
    fecha_inicio = db.Column(db.DateTime, nullable=False)
    fecha_fin = db.Column(db.DateTime, nullable=False)
    precio_total = db.Column(db.Float, nullable=False)
    estado = db.Column(db.String(20), default='pendiente')  # pendiente, confirmada, en_curso, completada, cancelada
    tipo_evento = db.Column(db.String(50))  # wedding, corporate, leisure
    notas = db.Column(db.Text)
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'usuario_id': self.usuario_id,
            'usuario_nombre': self.usuario.nombre if self.usuario else None,
            'embarcacion_id': self.embarcacion_id,
            'embarcacion_nombre': self.embarcacion.nombre if self.embarcacion else None,
            'fecha_inicio': self.fecha_inicio.isoformat(),
            'fecha_fin': self.fecha_fin.isoformat(),
            'precio_total': self.precio_total,
            'estado': self.estado,
            'tipo_evento': self.tipo_evento,
            'notas': self.notas,
            'fecha_creacion': self.fecha_creacion.isoformat()
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
            'fecha_creacion': self.fecha_creacion.isoformat()
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
            'fecha_creacion': self.fecha_creacion.isoformat()
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
            'fecha_programada': self.fecha_programada.isoformat(),
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
            'fecha_envio': self.fecha_envio.isoformat(),
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
                imagen_url = f"http://localhost:5000/static/uploads/{filename}"
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
                embarcacion.imagen_url = f"http://localhost:5000/static/uploads/{filename}"

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
        
        # Validar disponibilidad
        embarcacion = Embarcacion.query.get_or_404(data['embarcacion_id'])
        fecha_inicio = datetime.fromisoformat(data['fecha_inicio'])
        fecha_fin = datetime.fromisoformat(data['fecha_fin'])
        
        # Verificar conflictos de reservas
        conflictos = Reserva.query.filter(
            Reserva.embarcacion_id == data['embarcacion_id'],
            Reserva.estado.in_(['pendiente', 'confirmada', 'en_curso']),
            db.or_(
                db.and_(Reserva.fecha_inicio <= fecha_inicio, Reserva.fecha_fin >= fecha_inicio),
                db.and_(Reserva.fecha_inicio <= fecha_fin, Reserva.fecha_fin >= fecha_fin)
            )
        ).first()
        
        if conflictos:
            return jsonify({'error': 'La embarcación no está disponible en esas fechas'}), 400
        
        # Utilizar precio_total provisto por el frontend, o calcular mínimo 1 día
        dias = (fecha_fin - fecha_inicio).days
        precio_total_calculado = max(1, dias) * embarcacion.precio_dia
        precio_total = data.get('precio_total', precio_total_calculado)
        
        reserva = Reserva(
            usuario_id=data['usuario_id'],
            embarcacion_id=data['embarcacion_id'],
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin,
            precio_total=precio_total,
            estado='pendiente',
            tipo_evento=data.get('tipo_evento'),
            notas=data.get('notas')
        )
        
        db.session.add(reserva)
        db.session.commit()
        
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
        
        if not remitente_id or not destinatario_id or not contenido:
            return jsonify({'error': 'Faltan datos obligatorios'}), 400
            
        mensaje = Mensaje(
            remitente_id=remitente_id,
            destinatario_id=destinatario_id,
            contenido=contenido
        )
        db.session.add(mensaje)
        db.session.commit()
        return jsonify({'message': 'Mensaje enviado', 'mensaje': mensaje.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== STRIPE PAGOS ====================

@app.route('/api/pagos/create-intent', methods=['POST'])
def create_payment_intent():
    try:
        data = request.json
        # Convertir a centavos para Stripe
        amount = int(data.get('amount', 0) * 100)
        
        intent = stripe.PaymentIntent.create(
            amount=amount,
            currency='usd',
            setup_future_usage='off_session',
            automatic_payment_methods={
                'enabled': True,
            },
        )
        return jsonify({
            'clientSecret': intent.client_secret
        })
    except Exception as e:
        return jsonify(error=str(e)), 400


# ==================== INICIALIZACIÓN ====================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Verificar estado del servidor"""
    return jsonify({'status': 'ok', 'message': 'API funcionando correctamente'}), 200


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        print("✅ Base de datos inicializada")

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
            print(f"✅ {24} amarres creados automáticamente")

    app.run(debug=True, port=5000)
