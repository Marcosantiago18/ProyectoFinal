import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contex/AuthContext';
import { useLanguage } from '../contex/LanguageContext';
import type { TranslationKey } from '../i18n/translations';
import type { DashboardStats, Embarcacion, Reserva, Mantenimiento } from '../types';
import { dashboardAPI, embarcacionesAPI, reservasAPI, mantenimientosAPI } from '../utils/api';
import { toast } from 'sonner';

const Dashboard: React.FC = () => {
    const { usuario, logout } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    // Helper para claves dinámicas (tipo_preventivo, estado_programado, ...)
    const tKey = (key: string) => t(key as TranslationKey) || key;

    const [activeTab, setActiveTab] = useState<'dashboard' | 'fleet' | 'bookings' | 'maintenance' | 'analytics' | 'messages'>('dashboard');
    const [showVesselForm, setShowVesselForm] = useState(false);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [embarcaciones, setEmbarcaciones] = useState<Embarcacion[]>([]);
    const [reservas, setReservas] = useState<Reserva[]>([]);
    const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([]);
    const [alertas, setAlertas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
    const [editingVessel, setEditingVessel] = useState<Embarcacion | null>(null);

    useEffect(() => {
        if (usuario?.rol !== 'admin') {
            toast.error('Acceso denegado');
            navigate('/');
            return;
        }
        loadDashboardData();
    }, [usuario, navigate]);

    const loadDashboardData = async () => {
        try {
            const token = localStorage.getItem('token') || '';
            const [statsData, embarcacionesData, reservasData, mantenimientosData, alertasData]: any = await Promise.all([
                dashboardAPI.getStats(token),
                embarcacionesAPI.getAll(),
                reservasAPI.getAll({}, token),
                mantenimientosAPI.getAll({}, token),
                mantenimientosAPI.getAlertas(),
            ]);

            setStats(statsData);
            setEmbarcaciones(embarcacionesData);
            setReservas(reservasData);
            setMantenimientos(mantenimientosData);
            setAlertas(alertasData);
        } catch (error) {
            console.error('Error cargando dashboard:', error);
            toast.error(t('error_loading_data') || 'Error loading data');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateBooking = async (id: number, estado: string) => {
        try {
            const token = localStorage.getItem('token') || '';
            await reservasAPI.update(id, { estado }, token);
            toast.success(`${t('booking_updated')} ${estado}`);
            loadDashboardData();
        } catch (error) {
            toast.error(t('error_updating_booking') || 'Error updating booking');
        }
    };

    const handleCreateMaintenance = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);
        const data = {
            embarcacion_id: parseInt(formData.get('embarcacion_id') as string),
            tipo: formData.get('tipo') as string,
            fecha_programada: formData.get('fecha') as string,
            costo: parseFloat(formData.get('costo') as string) || 0,
            descripcion: formData.get('descripcion') as string,
            estado: 'programado',
        };

        try {
            const token = localStorage.getItem('token') || '';
            await mantenimientosAPI.create(data, token);
            toast.success(t('submit') + ' ✓ Mantenimiento programado');
            setShowMaintenanceForm(false);
            form.reset();
            loadDashboardData();
        } catch (error) {
            toast.error('Error al programar el mantenimiento');
        }
    };

    const handleCreateVessel = () => {
        setEditingVessel(null);
        setShowVesselForm(true);
    };

    const handleEditVessel = (vessel: Embarcacion) => {
        setEditingVessel(vessel);
        setShowVesselForm(true);
    };

    const handleDeleteVessel = async (id: number) => {
        if (!window.confirm(t('confirm_delete') || 'Are you sure you want to delete this vessel?')) return;

        try {
            const token = localStorage.getItem('token') || '';
            await embarcacionesAPI.delete(id, token);
            toast.success(t('vessel_deleted') || 'Vessel deleted');
            loadDashboardData();
        } catch (error) {
            console.error('Error deleting vessel:', error);
            toast.error(t('error_deleting_vessel') || 'Error deleting vessel');
        }
    };

    const submitVesselForm = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);

        try {
            const token = localStorage.getItem('token') || '';

            if (editingVessel) {
                await embarcacionesAPI.update(editingVessel.id, formData, token);
                toast.success(t('vessel_updated') || 'Vessel updated');
            } else {
                await embarcacionesAPI.create(formData, token);
                toast.success(t('vessel_created') || 'Vessel created');
            }

            setShowVesselForm(false);
            setEditingVessel(null);
            loadDashboardData();
        } catch (error) {
            console.error('Error saving vessel:', error);
            toast.error(t('error_saving_vessel') || 'Error saving vessel');
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const getStatusBadge = (estado: string) => {
        const badges: Record<string, string> = {
            'disponible': 'badge-green',
            'en_charter': 'badge-blue',
            'mantenimiento': 'badge-orange',
            'pendiente': 'badge-orange',
            'confirmada': 'badge-blue',
            'en_curso': 'badge-green',
            'completada': 'badge-green',
            'cancelada': 'badge-red',
        };
        return badges[estado] || 'badge-blue';
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a1628] flex">
            {/* Sidebar */}
            <aside className="w-64 bg-[#1a2942] border-r border-white/10 flex flex-col">
                {/* Logo */}
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#d4af37] to-[#f4d03f] rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-[#0a1628]" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v-2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0 1.26.65 2.62.99 4 .99h2v2h-2z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-white font-bold">ELITE</p>
                            <p className="text-[#d4af37] text-sm font-semibold">FLEET</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4">
                    <button
                        onClick={() => navigate('/')}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 text-white/60 hover:bg-white/5 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span className="font-semibold">{t('nav_home')}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${activeTab === 'dashboard' ? 'bg-[#d4af37] text-[#0a1628]' : 'text-white/60 hover:bg-white/5'
                            }`}
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                        </svg>
                        <span className="font-semibold">{t('dashboard_title') || 'Dashboard'}</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('fleet')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${activeTab === 'fleet' ? 'bg-[#d4af37] text-[#0a1628]' : 'text-white/60 hover:bg-white/5'
                            }`}
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v-2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0 1.26.65 2.62.99 4 .99h2v2h-2z" />
                        </svg>
                        <span className="font-semibold">{t('my_fleet')}</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('bookings')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${activeTab === 'bookings' ? 'bg-[#d4af37] text-[#0a1628]' : 'text-white/60 hover:bg-white/5'
                            }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="font-semibold">{t('bookings_title') || 'Bookings'}</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('maintenance')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${activeTab === 'maintenance' ? 'bg-[#d4af37] text-[#0a1628]' : 'text-white/60 hover:bg-white/5'
                            }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="font-semibold">{t('maintenance_title') || 'Maintenance'}</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('analytics')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${activeTab === 'analytics' ? 'bg-[#d4af37] text-[#0a1628]' : 'text-white/60 hover:bg-white/5'
                            }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span className="font-semibold">{t('analytics_title') || 'Analytics'}</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('messages')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${activeTab === 'messages' ? 'bg-[#d4af37] text-[#0a1628]' : 'text-white/60 hover:bg-white/5'
                            }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        <span className="font-semibold">{t('messages_title') || 'Messages'}</span>
                    </button>
                </nav>

                {/* Settings */}
                <div className="p-4 border-t border-white/10">
                    <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/60 hover:bg-white/5 transition-colors mb-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="font-semibold">{t('settings') || 'Settings'}</span>
                    </button>

                    {/* User Profile */}
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-[#00d4ff] rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                                {usuario?.nombre.charAt(0)}
                            </span>
                        </div>
                        <div className="flex-1">
                            <p className="text-white text-sm font-semibold">{usuario?.nombre}</p>
                            <p className="text-white/60 text-xs">Owner</p>
                        </div>
                        <button onClick={handleLogout} className="text-white/60 hover:text-white">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                {/* Header */}
                <header className="bg-[#1a2942] border-b border-white/10 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-white mb-1">
                                {t('welcome_back_captain') || 'Good Evening, Captain'}
                            </h1>
                            <p className="text-white/60">{t('dashboard_subtitle') || "Here's what's happening with your fleet today."}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder={t('search_placeholder') || "Search vessel, booking ID..."}
                                    className="w-80 px-4 py-2 pl-10 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                                />
                                <svg className="w-5 h-5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <button className="relative p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                                <span className="absolute top-1 right-1 w-2 h-2 bg-[#ef4444] rounded-full"></span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Dashboard Content */}
                <div className="p-6">
                    {activeTab === 'dashboard' && (
                        <>
                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="glass-effect rounded-2xl p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <p className="text-white/60 text-sm uppercase mb-1">{t('total_revenue')}</p>
                                            <p className="text-white text-3xl font-bold">
                                                ${stats?.total_revenue.toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="w-14 h-14 bg-[#d4af37]/20 rounded-xl flex items-center justify-center">
                                            <svg className="w-7 h-7 text-[#d4af37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-[#10b981] text-sm">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                                        </svg>
                                        <span>+12.5%</span>
                                    </div>
                                    <div className="mt-4 flex gap-1">
                                        {[40, 60, 45, 70, 55, 80, 65].map((height, i) => (
                                            <div key={i} className="flex-1 bg-[#d4af37]/20 rounded-sm" style={{ height: `${height}%` }}></div>
                                        ))}
                                    </div>
                                </div>

                                <div className="glass-effect rounded-2xl p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <p className="text-white/60 text-sm uppercase mb-1">{t('active_charters')}</p>
                                            <p className="text-white text-3xl font-bold">
                                                {stats?.active_charters} <span className="text-white/40 text-lg">/ {stats?.total_charters}</span>
                                            </p>
                                        </div>
                                        <div className="w-14 h-14 bg-blue-500/20 rounded-xl flex items-center justify-center">
                                            <svg className="w-7 h-7 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v-2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0 1.26.65 2.62.99 4 .99h2v2h-2z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-[#10b981] rounded-full"></div>
                                        <span className="text-white/80 text-sm">{t('currently_at_sea')}</span>
                                    </div>
                                </div>

                                <div className="glass-effect rounded-2xl p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <p className="text-white/60 text-sm uppercase mb-1">{t('new_inquiries')}</p>
                                            <p className="text-white text-3xl font-bold">{stats?.new_inquiries}</p>
                                        </div>
                                        <div className="w-14 h-14 bg-[#f59e0b]/20 rounded-xl flex items-center justify-center">
                                            <svg className="w-7 h-7 text-[#f59e0b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="text-white/80 text-sm">Wedding Event <span className="text-white/40">2m ago</span></div>
                                        <div className="text-white/80 text-sm">Weekend Rental <span className="text-white/40">1h ago</span></div>
                                    </div>
                                </div>
                            </div>

                            {/* Fleet Status Table */}
                            <div className="glass-effect rounded-2xl p-6 mb-8">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-white">{t('fleet_status')}</h3>
                                    <button onClick={() => setActiveTab('fleet')} className="text-[#d4af37] hover:text-[#f4d03f] transition-colors flex items-center gap-2">
                                        {t('view_all')}
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-white/10">
                                                <th className="text-left text-white/60 text-sm font-semibold pb-4 uppercase">{t('vessel_name')}</th>
                                                <th className="text-left text-white/60 text-sm font-semibold pb-4 uppercase">{t('vessel_type')}</th>
                                                <th className="text-left text-white/60 text-sm font-semibold pb-4 uppercase">{t('status')}</th>
                                                <th className="text-left text-white/60 text-sm font-semibold pb-4 uppercase">{t('next_booking')}</th>
                                                <th className="text-right text-white/60 text-sm font-semibold pb-4 uppercase">{t('action')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {embarcaciones.slice(0, 4).map((embarcacion) => (
                                                <tr key={embarcacion.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                    <td className="py-4">
                                                        <div className="flex items-center gap-3">
                                                            <img
                                                                src={embarcacion.imagen_url || 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=100'}
                                                                alt={embarcacion.nombre}
                                                                className="w-12 h-12 rounded-lg object-cover"
                                                            />
                                                            <div>
                                                                <p className="text-white font-semibold">{embarcacion.nombre}</p>
                                                                <p className="text-white/60 text-sm">{embarcacion.longitud}ft • {embarcacion.ubicacion}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4">
                                                        <span className="text-white/80 capitalize">{t(`type_${embarcacion.tipo}`) || embarcacion.tipo}</span>
                                                    </td>
                                                    <td className="py-4">
                                                        <span className={`badge ${getStatusBadge(embarcacion.estado)}`}>
                                                            {t(`${embarcacion.estado}_status`) || embarcacion.estado.replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="py-4">
                                                        <span className="text-white/80">Oct 24, 2023</span>
                                                    </td>
                                                    <td className="py-4 text-right">
                                                        <button
                                                            onClick={() => handleEditVessel(embarcacion)}
                                                            className="px-4 py-2 bg-[#d4af37] text-[#0a1628] rounded-lg font-semibold hover:bg-[#f4d03f] transition-colors mr-2"
                                                        >
                                                            {t('edit') || 'Edit'}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteVessel(embarcacion.id)}
                                                            className="px-4 py-2 bg-red-500/20 text-red-500 rounded-lg font-semibold hover:bg-red-500/40 transition-colors"
                                                        >
                                                            {t('delete') || 'Delete'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Alertas de Mantenimiento */}
                            {alertas.length > 0 && (
                                <div className="glass-effect rounded-2xl p-6 mb-8 border border-orange-500/30">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
                                            <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-bold text-orange-400">{t('alertas_mantenimiento')} ({alertas.length})</h3>
                                    </div>
                                    <div className="space-y-3">
                                        {alertas.map((alerta) => (
                                            <div
                                                key={alerta.id}
                                                className={`flex items-center justify-between p-3 rounded-lg border ${alerta.urgencia === 'vencido'
                                                    ? 'bg-red-500/10 border-red-500/30'
                                                    : alerta.urgencia === 'critico'
                                                        ? 'bg-orange-500/10 border-orange-500/30'
                                                        : 'bg-yellow-500/10 border-yellow-500/30'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-xs font-bold px-2 py-1 rounded ${alerta.urgencia === 'vencido'
                                                        ? 'bg-red-500/20 text-red-400'
                                                        : alerta.urgencia === 'critico'
                                                            ? 'bg-orange-500/20 text-orange-400'
                                                            : 'bg-yellow-500/20 text-yellow-400'
                                                        }`}>
                                                        {alerta.urgencia === 'vencido' ? t('alerta_vencido') :
                                                            alerta.urgencia === 'critico' ? t('alerta_critico') :
                                                                t('alerta_proximo')}
                                                    </span>
                                                    <div>
                                                        <p className="text-white font-semibold text-sm">{alerta.embarcacion_nombre}</p>
                                                        <p className="text-white/60 text-xs">
                                                            {tKey(`tipo_${alerta.tipo}`)} &bull; {formatDate(alerta.fecha_programada)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    {alerta.dias_restantes < 0 ? (
                                                        <p className="text-red-400 text-sm font-semibold">{t('alerta_vencido_hace')} {Math.abs(alerta.dias_restantes)} {t('alerta_dias_label')}</p>
                                                    ) : (
                                                        <p className="text-white/60 text-sm">{alerta.dias_restantes} {t('alerta_dias')}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => setActiveTab('maintenance')}
                                        className="mt-3 text-sm text-orange-400 hover:text-orange-300 transition-colors"
                                    >
                                        {t('ver_todos_mantenimientos')} →
                                    </button>
                                </div>
                            )}

                            {/* Calendar & Messages */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Calendar */}
                                <div className="glass-effect rounded-2xl p-6">
                                    <h3 className="text-xl font-bold text-white mb-6">October 2023</h3>
                                    <div className="grid grid-cols-7 gap-2 mb-4">
                                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                                            <div key={i} className="text-center text-white/40 text-sm font-semibold">
                                                {day}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-7 gap-2">
                                        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                                            <button
                                                key={day}
                                                className={`aspect-square rounded-lg flex items-center justify-center text-sm transition-colors ${day === 24
                                                    ? 'bg-[#d4af37] text-[#0a1628] font-bold'
                                                    : 'text-white/80 hover:bg-white/5'
                                                    }`}
                                            >
                                                {day}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="glass-effect rounded-2xl p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xl font-bold text-white">{t('messages_title') || 'Messages'}</h3>
                                        <button className="text-blue-500 hover:text-[#00d4ff] transition-colors">
                                            Compose
                                        </button>
                                    </div>
                                    <div className="space-y-4">
                                        {[
                                            { name: 'Elena Fisher', message: 'Is the Golden Horizon available for...', time: '10m', avatar: 'EF' },
                                            { name: 'John Smith', message: 'Confirmed booking for the jet ski...', time: '2h', avatar: 'JS' },
                                            { name: 'Mike Ross', message: 'Regarding the maintenance...', time: '5h', avatar: 'MR' },
                                        ].map((msg, i) => (
                                            <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-[#00d4ff] rounded-full flex items-center justify-center flex-shrink-0">
                                                    <span className="text-white font-bold text-sm">{msg.avatar}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white font-semibold text-sm">{msg.name}</p>
                                                    <p className="text-white/60 text-sm truncate">{msg.message}</p>
                                                </div>
                                                <span className="text-white/40 text-xs">{msg.time}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'fleet' && (
                        <div className="glass-effect rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-bold text-white">{t('my_fleet')}</h3>
                                <button
                                    onClick={() => handleCreateVessel()}
                                    className="btn btn-gold"
                                >
                                    {t('add_vessel')}
                                </button>
                            </div>

                            {/* Vessel Form Modal */}
                            {showVesselForm && (
                                <div className="mb-8 p-6 bg-white/5 rounded-xl border border-white/10">
                                    <h4 className="text-xl font-bold text-white mb-4">
                                        {editingVessel ? (t('edit_vessel') || 'Edit Vessel') : t('add_vessel')}
                                    </h4>
                                    <form onSubmit={submitVesselForm} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <input
                                            type="text"
                                            name="nombre"
                                            defaultValue={editingVessel?.nombre}
                                            placeholder={t('vessel_name_label')}
                                            className="input"
                                            required
                                        />
                                        <select
                                            name="tipo"
                                            defaultValue={editingVessel?.tipo || 'yacht'}
                                            className="input text-black"
                                            required
                                        >
                                            <option value="yacht">{t('type_yacht')}</option>
                                            <option value="sailboat">{t('type_sailboat')}</option>
                                            <option value="catamaran">{t('type_catamaran')}</option>
                                            <option value="watercraft">{t('type_watercraft')}</option>
                                        </select>
                                        <input
                                            type="number"
                                            name="capacidad"
                                            defaultValue={editingVessel?.capacidad}
                                            placeholder={t('capacity_label')}
                                            className="input"
                                            required
                                        />
                                        <input
                                            type="number"
                                            name="longitud"
                                            defaultValue={editingVessel?.longitud}
                                            placeholder={t('length_label')}
                                            className="input"
                                            required
                                        />
                                        <input
                                            type="number"
                                            name="precio_dia"
                                            defaultValue={editingVessel?.precio_dia}
                                            placeholder={t('price_day_label')}
                                            className="input"
                                            required
                                        />

                                        {/* File Input for Image */}
                                        <div className="md:col-span-1">
                                            <label className="block text-white/60 text-sm mb-2">{t('image_url_label')}</label>
                                            <div className="flex gap-4 items-center">
                                                {editingVessel?.imagen_url && (
                                                    <img src={editingVessel.imagen_url} alt="Current" className="w-10 h-10 rounded object-cover" />
                                                )}
                                                <input
                                                    type="file"
                                                    name="imagen"
                                                    accept="image/*"
                                                    className="input file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#d4af37] file:text-[#0a1628] hover:file:bg-[#f4d03f]"
                                                />
                                            </div>
                                        </div>

                                        <textarea
                                            name="descripcion"
                                            defaultValue={editingVessel?.descripcion}
                                            placeholder={t('description_label')}
                                            className="input md:col-span-2"
                                            rows={3}
                                        ></textarea>
                                        <div className="md:col-span-2 flex justify-end gap-3">
                                            <button
                                                type="button"
                                                onClick={() => { setShowVesselForm(false); setEditingVessel(null); }}
                                                className="px-4 py-2 text-white hover:text-white/80"
                                            >
                                                {t('cancel')}
                                            </button>
                                            <button type="submit" className="btn btn-gold">{t('submit')}</button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {embarcaciones.map((embarcacion) => (
                                    <div key={embarcacion.id} className="card-premium rounded-xl overflow-hidden card-hover">
                                        <img
                                            src={embarcacion.imagen_url || 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=400'}
                                            alt={embarcacion.nombre}
                                            className="w-full h-48 object-cover"
                                        />
                                        <div className="p-4">
                                            <h4 className="text-white font-bold mb-2">{embarcacion.nombre}</h4>
                                            <p className="text-white/60 text-sm mb-3">{t(`type_${embarcacion.tipo}`)} • {embarcacion.longitud}ft</p>
                                            <div className="flex flex-col gap-3">
                                                <div className="flex items-center justify-between">
                                                    <span className={`badge ${getStatusBadge(embarcacion.estado)}`}>
                                                        {t(`${embarcacion.estado}_status`) || embarcacion.estado}
                                                    </span>
                                                    <span className="text-blue-500 font-bold">${embarcacion.precio_dia}/day</span>
                                                </div>
                                                <div className="flex gap-2 justify-end border-t border-white/10 pt-3">
                                                    <button
                                                        onClick={() => handleEditVessel(embarcacion)}
                                                        className="px-3 py-1 bg-[#d4af37]/20 text-[#d4af37] rounded hover:bg-[#d4af37]/40 transition-colors text-sm font-semibold"
                                                    >
                                                        {t('edit') || 'Edit'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteVessel(embarcacion.id)}
                                                        className="px-3 py-1 bg-red-500/20 text-red-500 rounded hover:bg-red-500/40 transition-colors text-sm font-semibold"
                                                    >
                                                        {t('delete') || 'Delete'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'bookings' && (
                        <div className="glass-effect rounded-2xl p-6">
                            <h3 className="text-2xl font-bold text-white mb-6">{t('all_bookings')}</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-white/10">
                                            <th className="text-left text-white/60 text-sm font-semibold pb-4 uppercase">ID</th>
                                            <th className="text-left text-white/60 text-sm font-semibold pb-4 uppercase">{t('search_vessel')}</th>
                                            <th className="text-left text-white/60 text-sm font-semibold pb-4 uppercase">{t('client')}</th>
                                            <th className="text-left text-white/60 text-sm font-semibold pb-4 uppercase">{t('search_dates')}</th>
                                            <th className="text-left text-white/60 text-sm font-semibold pb-4 uppercase">{t('total')}</th>
                                            <th className="text-left text-white/60 text-sm font-semibold pb-4 uppercase">{t('status')}</th>
                                            <th className="text-right text-white/60 text-sm font-semibold pb-4 uppercase">{t('action')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reservas.map((reserva) => (
                                            <tr key={reserva.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                <td className="py-4 text-white/80">#{reserva.id}</td>
                                                <td className="py-4 text-white">{reserva.embarcacion_nombre}</td>
                                                <td className="py-4 text-white/80">{reserva.usuario_nombre}</td>
                                                <td className="py-4 text-white/80">
                                                    {formatDate(reserva.fecha_inicio)} - {formatDate(reserva.fecha_fin)}
                                                </td>
                                                <td className="py-4 text-blue-500 font-bold">${reserva.precio_total.toLocaleString()}</td>
                                                <td className="py-4">
                                                    <span className={`badge ${getStatusBadge(reserva.estado)}`}>
                                                        {reserva.estado}
                                                    </span>
                                                </td>
                                                <td className="py-4 text-right flex justify-end gap-2">
                                                    {reserva.estado === 'pendiente' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleUpdateBooking(reserva.id, 'confirmada')}
                                                                className="px-3 py-1 bg-green-500/20 text-green-500 hover:bg-green-500/40 rounded transition-colors text-xs font-semibold"
                                                            >
                                                                {t('confirm')}
                                                            </button>
                                                            <button
                                                                onClick={() => handleUpdateBooking(reserva.id, 'cancelada')}
                                                                className="px-3 py-1 bg-red-500/20 text-red-500 hover:bg-red-500/40 rounded transition-colors text-xs font-semibold"
                                                            >
                                                                {t('reject')}
                                                            </button>
                                                        </>
                                                    )}
                                                    {reserva.estado === 'confirmada' && (
                                                        <button
                                                            onClick={() => handleUpdateBooking(reserva.id, 'completada')}
                                                            className="px-3 py-1 bg-blue-500/20 text-blue-500 hover:bg-blue-500/40 rounded transition-colors text-xs font-semibold"
                                                        >
                                                            {t('complete')}
                                                        </button>
                                                    )}
                                                    {['completada', 'cancelada'].includes(reserva.estado) && (
                                                        <span className="text-white/40 text-xs italic">{t('archived')}</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'maintenance' && (
                        <div className="glass-effect rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-bold text-white">{t('maintenance_schedule')}</h3>
                                <button
                                    onClick={() => setShowMaintenanceForm(true)} // Needs state
                                    className="px-4 py-2 bg-[#d4af37] text-[#0a1628] rounded-lg font-semibold hover:bg-[#f4d03f] transition-colors flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    {t('schedule_maintenance')}
                                </button>
                            </div>

                            {/* Maintenance Form Modal */}
                            {showMaintenanceForm && (
                                <div className="mb-8 p-6 bg-white/5 rounded-xl border border-white/10">
                                    <h4 className="text-xl font-bold text-white mb-4">{t('schedule_maintenance')}</h4>
                                    <form onSubmit={handleCreateMaintenance} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <select className="input text-black" name="embarcacion_id" required>
                                            <option value="">{t('search_vessel')}</option>
                                            {embarcaciones.map(e => (
                                                <option key={e.id} value={e.id}>{e.nombre}</option>
                                            ))}
                                        </select>
                                        <select className="input text-black" name="tipo" required>
                                            <option value="preventivo">{t('tipo_preventivo')}</option>
                                            <option value="correctivo">{t('tipo_correctivo')}</option>
                                            <option value="revision">{t('tipo_revision')}</option>
                                        </select>
                                        <input type="date" className="input text-black" name="fecha" required />
                                        <input type="number" placeholder={t('estimated_cost_label')} className="input" name="costo" />
                                        <textarea placeholder={t('maintenance_desc_label')} className="input md:col-span-2" name="descripcion" rows={3}></textarea>
                                        <div className="md:col-span-2 flex justify-end gap-3">
                                            <button type="button" onClick={() => setShowMaintenanceForm(false)} className="px-4 py-2 text-white hover:text-white/80">{t('cancel')}</button>
                                            <button type="submit" className="btn btn-gold">{t('submit')}</button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-white/10">
                                            <th className="text-left text-white/60 text-sm font-semibold pb-4 uppercase">{t('search_vessel')}</th>
                                            <th className="text-left text-white/60 text-sm font-semibold pb-4 uppercase">{t('vessel_type')}</th>
                                            <th className="text-left text-white/60 text-sm font-semibold pb-4 uppercase">{t('date')}</th>
                                            <th className="text-left text-white/60 text-sm font-semibold pb-4 uppercase">{t('cost')}</th>
                                            <th className="text-left text-white/60 text-sm font-semibold pb-4 uppercase">{t('status')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {mantenimientos.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="py-8 text-center text-white/40">
                                                    {t('no_maintenance')}
                                                </td>
                                            </tr>
                                        ) : (
                                            mantenimientos.map((mantenimiento) => (
                                                <tr key={mantenimiento.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                    <td className="py-4 text-white font-medium">{mantenimiento.embarcacion_nombre}</td>
                                                    <td className="py-4 text-white/80 capitalize">
                                                        {tKey(`tipo_${mantenimiento.tipo}`)}
                                                    </td>
                                                    <td className="py-4 text-white/80">{formatDate(mantenimiento.fecha_programada)}</td>
                                                    <td className="py-4 text-white/80">${mantenimiento.costo?.toLocaleString() || '0'}</td>
                                                    <td className="py-4">
                                                        <span className={`badge ${mantenimiento.estado === 'completado' ? 'badge-green' :
                                                            mantenimiento.estado === 'en_proceso' ? 'badge-blue' : 'badge-orange'
                                                            }`}>
                                                            {tKey(`estado_${mantenimiento.estado}`)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'analytics' && (
                        <div className="glass-effect rounded-2xl p-6">
                            <h3 className="text-2xl font-bold text-white mb-6">Analytics</h3>
                            <p className="text-white/60">Analytics dashboard coming soon...</p>
                        </div>
                    )}

                    {activeTab === 'messages' && (
                        <div className="glass-effect rounded-2xl p-6">
                            <h3 className="text-2xl font-bold text-white mb-6">Messages</h3>
                            <p className="text-white/60">Messaging system coming soon...</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
