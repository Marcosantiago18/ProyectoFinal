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

# Configuración de la aplicación
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root@localhost/alquiler_barcos'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.urandom(24)
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'uploads')
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

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
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)
    
    reservas = db.relationship('Reserva', backref='embarcacion', lazy=True)
    mantenimientos = db.relationship('Mantenimiento', backref='embarcacion', lazy=True)
    
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
        estado = request.args.get('estado', 'disponible')
        
        query = Embarcacion.query
        
        if tipo:
            query = query.filter_by(tipo=tipo)
        if ubicacion:
            query = query.filter(Embarcacion.ubicacion.ilike(f'%{ubicacion}%'))
        if estado:
            query = query.filter_by(estado=estado)
        
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
        
        query = Reserva.query
        
        if usuario_id:
            query = query.filter_by(usuario_id=usuario_id)
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
        
        # Calcular precio total
        dias = (fecha_fin - fecha_inicio).days
        precio_total = dias * embarcacion.precio_dia
        
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


# ==================== INICIALIZACIÓN ====================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Verificar estado del servidor"""
    return jsonify({'status': 'ok', 'message': 'API funcionando correctamente'}), 200


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        print("✅ Base de datos inicializada")
    
    app.run(debug=True, port=5000)
