/**
 * Cliente API para comunicación con el backend
 * Centraliza todas las llamadas HTTP
 */

const API_BASE_URL = 'http://127.0.0.1:5000/api';

interface FetchOptions extends RequestInit {
    token?: string;
}

/**
 * Función auxiliar para hacer peticiones HTTP
 */
async function fetchAPI<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const { token, ...fetchOptions } = options;

    const isFormData = options.body instanceof FormData;

    const headers: HeadersInit = {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...fetchOptions.headers,
    };

    if (token) {
        (headers as any)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...fetchOptions,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
}

// ==================== AUTENTICACIÓN ====================

export const authAPI = {
    login: async (email: string, password: string) => {
        return fetchAPI('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    },

    register: async (data: any) => {
        return fetchAPI('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
};

// ==================== EMBARCACIONES ====================

export const embarcacionesAPI = {
    getAll: async (filters?: any) => {
        const params = new URLSearchParams(filters).toString();
        return fetchAPI(`/embarcaciones${params ? `?${params}` : ''}`);
    },

    getById: async (id: number) => {
        return fetchAPI(`/embarcaciones/${id}`);
    },

    create: async (data: any, token: string) => {
        const isFormData = data instanceof FormData;
        return fetchAPI('/embarcaciones', {
            method: 'POST',
            body: isFormData ? data : JSON.stringify(data),
            token,
        });
    },

    update: async (id: number, data: any, token: string) => {
        const isFormData = data instanceof FormData;
        return fetchAPI(`/embarcaciones/${id}`, {
            method: 'PUT',
            body: isFormData ? data : JSON.stringify(data),
            token,
        });
    },

    delete: async (id: number, token: string) => {
        return fetchAPI(`/embarcaciones/${id}`, {
            method: 'DELETE',
            token,
        });
    },
};

// ==================== RESERVAS ====================

export const reservasAPI = {
    getAll: async (filters?: any, token?: string) => {
        const params = new URLSearchParams(filters).toString();
        return fetchAPI(`/reservas${params ? `?${params}` : ''}`, { token });
    },

    getById: async (id: number, token: string) => {
        return fetchAPI(`/reservas/${id}`, { token });
    },

    create: async (data: any, token: string) => {
        return fetchAPI('/reservas', {
            method: 'POST',
            body: JSON.stringify(data),
            token,
        });
    },

    update: async (id: number, data: any, token: string) => {
        return fetchAPI(`/reservas/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
            token,
        });
    },
};

// ==================== MANTENIMIENTOS ====================

export const mantenimientosAPI = {
    getAll: async (filters?: any, token?: string) => {
        const params = new URLSearchParams(filters).toString();
        return fetchAPI(`/mantenimientos${params ? `?${params}` : ''}`, { token });
    },

    getAlertas: async () => {
        return fetchAPI<any[]>('/mantenimientos/alertas');
    },

    create: async (data: any, token: string) => {
        return fetchAPI('/mantenimientos', {
            method: 'POST',
            body: JSON.stringify(data),
            token,
        });
    },

    update: async (id: number, data: any, token: string) => {
        return fetchAPI(`/mantenimientos/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
            token,
        });
    },
};

// ==================== DASHBOARD ====================

export const dashboardAPI = {
    getStats: async (token: string) => {
        return fetchAPI('/dashboard/stats', { token });
    },
};

// ==================== HEALTH CHECK ====================

export const healthAPI = {
    check: async () => {
        return fetchAPI('/health');
    },
};
