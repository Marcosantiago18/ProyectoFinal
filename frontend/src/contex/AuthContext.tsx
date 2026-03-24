import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Usuario, AuthContextType, RegisterData } from '../types';
import { authAPI } from '../utils/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [usuario, setUsuario] = useState<Usuario | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        // Verificar si hay un usuario guardado en localStorage
        const savedUser = localStorage.getItem('usuario');
        const savedToken = localStorage.getItem('token');

        if (savedUser && savedToken) {
            setUsuario(JSON.parse(savedUser));
            setIsAuthenticated(true);
        }
    }, []);

    const login = async (email: string, password: string): Promise<Usuario> => {
        try {
            const response: any = await authAPI.login(email, password);

            setUsuario(response.usuario);
            setIsAuthenticated(true);

            // Guardar en localStorage
            localStorage.setItem('usuario', JSON.stringify(response.usuario));
            localStorage.setItem('token', response.token);
            
            return response.usuario;
        } catch (error) {
            console.error('Error en login:', error);
            throw error;
        }
    };

    const logout = (): void => {
        setUsuario(null);
        setIsAuthenticated(false);
        localStorage.removeItem('usuario');
        localStorage.removeItem('token');
    };

    const register = async (data: RegisterData): Promise<void> => {
        try {
            const response: any = await authAPI.register(data);

            setUsuario(response.usuario);
            setIsAuthenticated(true);

            // Guardar en localStorage
            localStorage.setItem('usuario', JSON.stringify(response.usuario));
            localStorage.setItem('token', 'fake-jwt-token');
        } catch (error) {
            console.error('Error en registro:', error);
            throw error;
        }
    };

    const value: AuthContextType = {
        usuario,
        isAuthenticated,
        login,
        logout,
        register,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth debe ser usado dentro de un AuthProvider');
    }
    return context;
};
