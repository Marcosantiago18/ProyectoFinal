// Tipos para el sistema de alquiler de barcos

export interface Usuario {
    id: number;
    nombre: string;
    email: string;
    telefono?: string;
    rol: 'cliente' | 'admin';
    fecha_registro: string;
}

export interface Embarcacion {
    id: number;
    nombre: string;
    tipo: 'yacht' | 'sailboat' | 'watercraft';
    categoria?: string;
    capacidad: number;
    longitud?: number;
    precio_dia: number;
    descripcion?: string;
    imagen_url?: string;
    estado: 'disponible' | 'en_charter' | 'mantenimiento';
    incluye_capitan: boolean;
    incluye_tripulacion: boolean;
    ubicacion?: string;
    rating: number;
    fecha_creacion: string;
}

export interface Reserva {
    id: number;
    usuario_id: number;
    usuario_nombre?: string;
    embarcacion_id: number;
    embarcacion_nombre?: string;
    fecha_inicio: string;
    fecha_fin: string;
    precio_total: number;
    estado: 'pendiente' | 'confirmada' | 'en_curso' | 'completada' | 'cancelada';
    tipo_evento?: string;
    notas?: string;
    fecha_creacion: string;
}

export interface Mantenimiento {
    id: number;
    embarcacion_id: number;
    embarcacion_nombre?: string;
    tipo: 'preventivo' | 'correctivo' | 'revision';
    descripcion?: string;
    fecha_programada: string;
    fecha_completada?: string;
    costo?: number;
    estado: 'programado' | 'en_proceso' | 'completado';
    notas?: string;
}

export interface DashboardStats {
    total_revenue: number;
    active_charters: number;
    total_charters: number;
    new_inquiries: number;
    fleet_status: Array<{ estado: string; count: number }>;
    upcoming_maintenance: Mantenimiento[];
}

export interface SearchFilters {
    ubicacion?: string;
    fecha_inicio?: string;
    fecha_fin?: string;
    tipo?: string;
    capacidad_min?: number;
    precio_max?: number;
}

export interface AuthContextType {
    usuario: Usuario | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    register: (data: RegisterData) => Promise<void>;
}

export interface RegisterData {
    nombre: string;
    email: string;
    password: string;
    telefono?: string;
}
