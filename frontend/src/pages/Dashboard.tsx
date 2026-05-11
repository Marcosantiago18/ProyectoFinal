import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contex/AuthContext';
import { useLanguage } from '../contex/LanguageContext';
import type { TranslationKey } from '../i18n/translations';
import type { DashboardStats, Embarcacion, Reserva, Mantenimiento, Amarre } from '../types';
import { dashboardAPI, embarcacionesAPI, reservasAPI, mantenimientosAPI, amarresAPI, notificacionesAPI } from '../utils/api';
import { toast } from 'sonner';
import ChatInterface from '../components/chat/ChatInterface';
import CustomSelect from '../components/shared/CustomSelect';
import { socket } from '../utils/socket';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const Dashboard: React.FC = () => {
    const { usuario, logout } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    // Helper para claves dinámicas (tipo_preventivo, estado_programado, ...)
    const tKey = (key: string) => t(key as TranslationKey) || key;

    const [activeTab, setActiveTab] = useState<'dashboard' | 'fleet' | 'bookings' | 'maintenance' | 'analytics' | 'messages' | 'marina'>('dashboard');
    const [showVesselForm, setShowVesselForm] = useState(false);
    const [, setStats] = useState<DashboardStats | null>(null);
    const [embarcaciones, setEmbarcaciones] = useState<Embarcacion[]>([]);
    const [reservas, setReservas] = useState<Reserva[]>([]);
    const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([]);
    const [alertas, setAlertas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
    const [editingVessel, setEditingVessel] = useState<Embarcacion | null>(null);
    const [amarres, setAmarres] = useState<Amarre[]>([]);
    const [selectedAmarre, setSelectedAmarre] = useState<Amarre | null>(null);
    const [rentModal, setRentModal] = useState<{ isOpen: boolean; amarreId: number | null }>({ isOpen: false, amarreId: null });
    const [rentMonths, setRentMonths] = useState(1);
    const [rentVesselId, setRentVesselId] = useState<number | ''>('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; vessel: Embarcacion | null }>({ isOpen: false, vessel: null });
    const [notifs, setNotifs] = useState<any>(null);
    const [showNotifsDropdown, setShowNotifsDropdown] = useState(false);

    useEffect(() => {
        let interval: any;
        const fetchNotifs = async () => {
            if (usuario) {
                try {
                    const token = localStorage.getItem('token') || '';
                    const res: any = await notificacionesAPI.get(usuario.id, token);
                    setNotifs(res);
                } catch (e) {
                    console.error('Error fetching dashboard notifications', e);
                }
            }
        };

        fetchNotifs();
        interval = setInterval(fetchNotifs, 15000);
        
        const handleSocketNotif = (data: any) => {
            if (usuario && data.destinatario_id === usuario.id) {
                fetchNotifs();
            }
        };
        
        socket.on('actualizar_notificaciones', handleSocketNotif);
        
        return () => {
            clearInterval(interval);
            socket.off('actualizar_notificaciones', handleSocketNotif);
        };
    }, [usuario]);

    useEffect(() => {
        if (!usuario || (usuario.rol !== 'admin' && usuario.rol !== 'capitan')) {
            toast.error('Acceso denegado');
            navigate('/');
            return;
        }
        loadDashboardData();
        
        // Socket.IO Listener para actualizaciones en Tiempo Real
        socket.on('nueva_actividad', (data: any) => {
            toast.success(`🤖 IA Assistant: ${data.mensaje}`, { duration: 5000 });
            loadDashboardData(); // Recargar datos automáticamente
        });

        return () => {
            socket.off('nueva_actividad');
        };
    }, [usuario, navigate]);

    const loadDashboardData = async () => {
        try {
            const token = localStorage.getItem('token') || '';
            
            // Si el usuario es capitán, solo obtener sus embarcaciones
            const embarcacionesParams = usuario?.rol === 'capitan' ? { propietario_id: usuario.id } : {};

            const [statsData, embarcacionesData, reservasData, mantenimientosData, alertasData, amarresData]: any = await Promise.all([
                dashboardAPI.getStats(token),
                embarcacionesAPI.getAll(embarcacionesParams),
                reservasAPI.getAll({}, token),
                mantenimientosAPI.getAll({}, token),
                mantenimientosAPI.getAlertas(),
                amarresAPI.getAll(),
            ]);

            setStats(statsData);
            setEmbarcaciones(embarcacionesData);
            setReservas(reservasData);
            setMantenimientos(mantenimientosData);
            setAlertas(alertasData);
            setAmarres(Array.isArray(amarresData) ? amarresData : []);
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

    const handleUpdateVesselState = async (id: number, estado: string) => {
        try {
            const token = localStorage.getItem('token') || '';
            await embarcacionesAPI.update(id, { estado }, token);
            toast.success(`Estado actualizado a ${estado.replace('_', ' ')}`);
            loadDashboardData();
        } catch (error) {
            toast.error('Error al actualizar el estado de la embarcación');
        }
    };

    const handleDeleteVessel = async () => {
        if (!deleteModal.vessel) return;

        try {
            const token = localStorage.getItem('token') || '';
            await embarcacionesAPI.delete(deleteModal.vessel.id, token);
            toast.success(t('vessel_deleted') || 'Vessel deleted');
            setDeleteModal({ isOpen: false, vessel: null });
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

        if (usuario?.rol === 'capitan') {
            formData.append('propietario_id', usuario.id.toString());
        }

        // Explicitly handle checkboxes since FormData omits unchecked ones
        const formElement = e.currentTarget;
        const inputs = Array.from(formElement.querySelectorAll('input[type="checkbox"]')) as HTMLInputElement[];
        inputs.forEach(input => {
            if (!input.checked) {
                formData.append(input.name, 'false');
            }
        });

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
        <div className="min-h-screen bg-[#0a1628] flex relative">
            {/* Sidebar Overlay for Mobile */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 z-40 lg:hidden" 
                    onClick={() => setIsSidebarOpen(false)} 
                />
            )}
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 w-64 bg-[#1a2942] border-r border-white/10 flex flex-col transition-transform duration-300 ease-in-out`}>
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
                <nav className="flex-1 p-4 overflow-y-auto">
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
                        onClick={() => { setIsSidebarOpen(false); setActiveTab('dashboard'); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${activeTab === 'dashboard' ? 'bg-[#d4af37] text-[#0a1628]' : 'text-white/60 hover:bg-white/5'
                            }`}
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                        </svg>
                        <span className="font-semibold">{t('dashboard_title') || 'Dashboard'}</span>
                    </button>

                    <button
                        onClick={() => { setIsSidebarOpen(false); setActiveTab('fleet'); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${activeTab === 'fleet' ? 'bg-[#d4af37] text-[#0a1628]' : 'text-white/60 hover:bg-white/5'
                            }`}
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v-2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0 1.26.65 2.62.99 4 .99h2v2h-2z" />
                        </svg>
                        <span className="font-semibold">{t('my_fleet')}</span>
                    </button>

                    <button
                        onClick={() => { setIsSidebarOpen(false); setActiveTab('bookings'); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${activeTab === 'bookings' ? 'bg-[#d4af37] text-[#0a1628]' : 'text-white/60 hover:bg-white/5'
                            }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="font-semibold">{t('bookings_title') || 'Bookings'}</span>
                    </button>

                    <button
                        onClick={() => { setIsSidebarOpen(false); setActiveTab('maintenance'); }}
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
                        onClick={() => { setIsSidebarOpen(false); setActiveTab('marina'); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${activeTab === 'marina' ? 'bg-[#d4af37] text-[#0a1628]' : 'text-white/60 hover:bg-white/5'
                            }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <span className="font-semibold">{t('marina_tab') || 'Marina'}</span>
                    </button>

                    <button
                        onClick={() => { setIsSidebarOpen(false); setActiveTab('analytics'); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${activeTab === 'analytics' ? 'bg-[#d4af37] text-[#0a1628]' : 'text-white/60 hover:bg-white/5'
                            }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span className="font-semibold">{t('analytics_title') || 'Analytics'}</span>
                    </button>

                    <button
                        onClick={() => { setIsSidebarOpen(false); setActiveTab('messages'); }}
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
            <main className="flex-1 overflow-auto w-full pb-20 lg:pb-0 relative">
                {/* Header */}
                <header className="bg-[#1a2942] border-b border-white/10 p-4 lg:p-6 sticky top-0 z-30">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <button 
                                className="lg:hidden p-2 text-white/70 hover:text-white bg-white/5 rounded-lg" 
                                onClick={() => setIsSidebarOpen(true)}
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>
                            </button>
                            <div className="hidden sm:block">
                                <h1 className="text-xl lg:text-2xl font-bold text-white mb-1">
                                    {t('welcome_back_captain') || 'Good Evening, Captain'}
                                </h1>
                                <p className="text-xs lg:text-sm text-white/60">{t('dashboard_subtitle') || "Here's what's happening with your fleet today."}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="relative hidden md:block">
                                <input
                                    type="text"
                                    placeholder={t('search_placeholder') || "Search vessel, booking ID..."}
                                    className="w-48 lg:w-80 px-4 py-2 pl-10 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500 text-sm"
                                />
                                <svg className="w-5 h-5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <div className="relative">
                                <button 
                                    onClick={() => setShowNotifsDropdown(!showNotifsDropdown)}
                                    className="relative p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                                >
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                    {notifs && notifs.total > 0 && (
                                        <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white border-2 border-[#1a2942]">
                                            {notifs.total}
                                        </span>
                                    )}
                                </button>
                                
                                {showNotifsDropdown && (
                                    <div className="absolute right-0 mt-2 w-80 bg-[#1a2942] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                                        <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
                                            <h3 className="text-white font-bold text-sm">Notificaciones</h3>
                                        </div>
                                        <div className="max-h-80 overflow-y-auto">
                                            {!notifs || notifs.total === 0 ? (
                                                <div className="p-6 text-center text-white/50 text-sm">
                                                    No tienes notificaciones nuevas
                                                </div>
                                            ) : (
                                                <div className="flex flex-col">
                                                    {notifs.unread_mensajes > 0 && (
                                                        <button onClick={() => { setActiveTab('messages'); setShowNotifsDropdown(false); }} className="flex items-center gap-3 p-4 hover:bg-white/5 transition-colors border-b border-white/5 text-left w-full">
                                                            <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                                                            </div>
                                                            <div>
                                                                <p className="text-white text-sm font-semibold">Mensajes Nuevos</p>
                                                                <p className="text-white/60 text-xs mt-0.5">Tienes {notifs.unread_mensajes} {notifs.unread_mensajes === 1 ? 'mensaje sin leer' : 'mensajes sin leer'}.</p>
                                                            </div>
                                                        </button>
                                                    )}
                                                    {notifs.nuevas_reservas > 0 && (
                                                        <button onClick={() => { setActiveTab('bookings'); setShowNotifsDropdown(false); }} className="flex items-center gap-3 p-4 hover:bg-white/5 transition-colors border-b border-white/5 text-left w-full">
                                                            <div className="w-10 h-10 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center flex-shrink-0">
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                            </div>
                                                            <div>
                                                                <p className="text-white text-sm font-semibold">Nuevas Reservas</p>
                                                                <p className="text-white/60 text-xs mt-0.5">Tienes {notifs.nuevas_reservas} {notifs.nuevas_reservas === 1 ? 'reserva pendiente' : 'reservas pendientes'}.</p>
                                                            </div>
                                                        </button>
                                                    )}
                                                    {notifs.mantenimientos > 0 && (
                                                        <button onClick={() => { setActiveTab('maintenance'); setShowNotifsDropdown(false); }} className="flex items-center gap-3 p-4 hover:bg-white/5 transition-colors text-left w-full">
                                                            <div className="w-10 h-10 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center flex-shrink-0">
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                            </div>
                                                            <div>
                                                                <p className="text-white text-sm font-semibold">Mantenimientos</p>
                                                                <p className="text-white/60 text-xs mt-0.5">Tienes {notifs.mantenimientos} {notifs.mantenimientos === 1 ? 'alerta de mantenimiento' : 'alertas de mantenimiento'}.</p>
                                                            </div>
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
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
                                                ${reservas.filter(r => ['confirmada', 'en_curso', 'completada'].includes(r.estado)).reduce((acc, r) => acc + (r.precio_total || 0), 0).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="w-14 h-14 bg-[#d4af37]/20 rounded-xl flex items-center justify-center">
                                            <svg className="w-7 h-7 text-[#d4af37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-[#10b981] text-sm">
                                        <svg className="w-4 h-4" transform="rotate(-45)" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" />
                                        </svg>
                                        <span>Actualizado</span>
                                    </div>
                                    <div className="mt-4 flex gap-1 h-2">
                                        {[40, 60, 45, 70, 55, 80, 100].map((height, i) => (
                                            <div key={i} className="flex-1 bg-[#d4af37]/40 rounded-sm" style={{ height: `${height}%` }}></div>
                                        ))}
                                    </div>
                                </div>

                                <div className="glass-effect rounded-2xl p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <p className="text-white/60 text-sm uppercase mb-1">{t('active_charters')}</p>
                                            <p className="text-white text-3xl font-bold">
                                                {embarcaciones.filter(e => e.estado === 'en_charter').length} <span className="text-white/40 text-lg">/ {embarcaciones.length}</span>
                                            </p>
                                        </div>
                                        <div className="w-14 h-14 bg-blue-500/20 rounded-xl flex items-center justify-center">
                                            <svg className="w-7 h-7 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v-2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0 1.26.65 2.62.99 4 .99h2v2h-2z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {embarcaciones.filter(e => e.estado === 'en_charter').length > 0 ? (
                                            <>
                                                <div className="w-3 h-3 bg-[#10b981] rounded-full animate-pulse"></div>
                                                <span className="text-white/80 text-sm">Navegando ahora</span>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-3 h-3 bg-white/20 rounded-full"></div>
                                                <span className="text-white/40 text-sm">Flota en puerto</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="glass-effect rounded-2xl p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <p className="text-white/60 text-sm uppercase mb-1">{t('new_inquiries')}</p>
                                            <p className="text-white text-3xl font-bold">{reservas.filter(r => r.estado === 'pendiente').length}</p>
                                        </div>
                                        <div className="w-14 h-14 bg-[#f59e0b]/20 rounded-xl flex items-center justify-center">
                                            <svg className="w-7 h-7 text-[#f59e0b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        {reservas.filter(r => r.estado === 'pendiente').slice(0, 2).map((req, i) => {
                                            const diffMin = Math.round((new Date().getTime() - new Date(req.fecha_creacion).getTime()) / 60000);
                                            const timeStr = diffMin < 60 ? `Hace ${diffMin}m` : (diffMin < 1440 ? `Hace ${Math.round(diffMin/60)}h` : `Hace ${Math.round(diffMin/1440)}d`);
                                            return (
                                                <div key={i} className="text-white/80 text-sm capitalize">{req.tipo_evento || 'Alquiler'} <span className="text-white/40 ml-1">{timeStr}</span></div>
                                            );
                                        })}
                                        {reservas.filter(r => r.estado === 'pendiente').length === 0 && (
                                            <div className="text-white/40 text-sm italic">Sin consultas recientes</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Fleet Status Table */}
                            <div className="glass-effect rounded-2xl p-6 mb-8">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-white">{t('fleet_status')}</h3>
                                    <button onClick={() => { setIsSidebarOpen(false); setActiveTab('fleet'); }} className="text-[#d4af37] hover:text-[#f4d03f] transition-colors flex items-center gap-2">
                                        {t('view_all')}
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="overflow-x-auto pb-4">
                                    <table className="w-full min-w-[800px] hidden md:table">
                                        <thead>
                                            <tr className="border-b border-white/10">
                                                <th className="text-left text-white/60 text-sm font-semibold pb-4 uppercase">{t('vessel_name')}</th>
                                                <th className="text-left text-white/60 text-sm font-semibold pb-4 uppercase">{t('vessel_type')}</th>
                                                <th className="text-left text-white/60 text-sm font-semibold pb-4 uppercase">{t('status')}</th>
                                                <th className="text-left text-white/60 text-sm font-semibold pb-4 uppercase">{t('next_booking')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(() => {
                                                const sorted = [...embarcaciones].sort((a, b) => {
                                                    const nextA = reservas.filter(r => r.embarcacion_id === a.id && new Date(r.fecha_inicio) > new Date()).sort((r1,r2) => new Date(r1.fecha_inicio).getTime() - new Date(r2.fecha_inicio).getTime())[0];
                                                    const nextB = reservas.filter(r => r.embarcacion_id === b.id && new Date(r.fecha_inicio) > new Date()).sort((r1,r2) => new Date(r1.fecha_inicio).getTime() - new Date(r2.fecha_inicio).getTime())[0];
                                                    if (nextA && !nextB) return -1;
                                                    if (!nextA && nextB) return 1;
                                                    if (nextA && nextB) return new Date(nextA.fecha_inicio).getTime() - new Date(nextB.fecha_inicio).getTime();
                                                    return 0;
                                                });
                                                return sorted.map((embarcacion) => {
                                                    const nextBooking = reservas.filter(r => r.embarcacion_id === embarcacion.id && new Date(r.fecha_inicio) > new Date()).sort((a,b) => new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime())[0];
                                                    return (
                                                    <tr key={embarcacion.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                        <td className="py-2 pr-4">
                                                            <div className="flex items-center gap-3">
                                                                <img
                                                                    src={embarcacion.imagen_url || 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=100'}
                                                                    alt={embarcacion.nombre}
                                                                    className="w-10 h-10 rounded-lg object-cover"
                                                                />
                                                                <div>
                                                                    <p className="text-white font-semibold text-sm">{embarcacion.nombre}</p>
                                                                    <p className="text-white/60 text-xs">{embarcacion.longitud}m • {embarcacion.ubicacion}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-2 pr-4">
                                                            <span className="text-white/80 text-sm capitalize">{t(`type_${embarcacion.tipo}`) || embarcacion.tipo}</span>
                                                        </td>
                                                        <td className="py-2 pr-4 max-w-[140px]">
                                                                <CustomSelect
                                                                    size="sm"
                                                                    value={embarcacion.estado}
                                                                    onChange={(val) => handleUpdateVesselState(embarcacion.id, val)}
                                                                    options={[
                                                                        { value: 'disponible', label: 'DISPONIBLE' },
                                                                        { value: 'en_charter', label: 'EN CHARTER' },
                                                                        { value: 'mantenimiento', label: 'MANTENIMIENTO' }
                                                                    ]}
                                                                />
                                                        </td>
                                                        <td className="py-2">
                                                            <span className="text-white/80 text-sm">{nextBooking ? formatDate(nextBooking.fecha_inicio) : 'Sin reservas activas'}</span>
                                                        </td>
                                                    </tr>
                                                )});
                                            })()}
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
                                        onClick={() => { setIsSidebarOpen(false); setActiveTab('maintenance'); }}
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
                                    <h3 className="text-xl font-bold text-white mb-6 capitalize px-2">
                                        {new Date().toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
                                    </h3>
                                    <div className="grid grid-cols-7 gap-2 mb-4">
                                        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, i) => (
                                            <div key={i} className="text-center text-white/40 text-sm font-semibold">
                                                {day}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-7 gap-2">
                                        {(() => {
                                            const actualDate = new Date();
                                            const currentYear = actualDate.getFullYear();
                                            const currentMonth = actualDate.getMonth();
                                            const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                                            const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
                                            const startPadding = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; 
                                            
                                            // Empty padding cells
                                            const pads = Array.from({ length: startPadding }).map((_, i) => <div key={`pad-${i}`} />);
                                            
                                            // Real days
                                            const days = Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                                                const hasReservation = reservas.some(r => {
                                                    if (!['pendiente', 'confirmada', 'en_curso'].includes(r.estado)) return false;
                                                    let c = new Date(); c.setFullYear(currentYear, currentMonth, day); c.setHours(12,0,0,0);
                                                    let s = new Date(r.fecha_inicio); s.setHours(12,0,0,0);
                                                    let e = new Date(r.fecha_fin); e.setHours(12,0,0,0);
                                                    return c >= s && c <= e;
                                                });
                                                return (
                                                    <button
                                                        key={day}
                                                        className={`aspect-square rounded-lg flex items-center justify-center text-sm transition-colors ${hasReservation
                                                            ? 'bg-[#d4af37] text-[#0a1628] font-bold ring-2 ring-[#f4d03f]/50'
                                                            : 'text-white/80 hover:bg-white/5'
                                                            }`}
                                                    >
                                                        {day}
                                                    </button>
                                                );
                                            });
                                            return [...pads, ...days];
                                        })()}
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="glass-effect rounded-2xl p-6 flex flex-col h-full">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xl font-bold text-white">Solicitudes ({reservas.filter(r => r.estado === 'pendiente').length})</h3>
                                    </div>
                                    <div className="space-y-4 flex-1 overflow-y-auto pr-2 min-h-[350px] max-h-[500px]">
                                        {reservas.filter(r => r.estado === 'pendiente').length === 0 ? (
                                            <p className="text-white/60 text-sm italic">No hay solicitudes pendientes actuales.</p>
                                        ) : reservas.filter(r => r.estado === 'pendiente').map((req, i) => (
                                            <div key={i} onClick={() => { setIsSidebarOpen(false); setActiveTab('bookings'); }} className="flex flex-col gap-3 p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer border-l-4 border-orange-400">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                                                        <span className="text-white font-bold text-sm">RQ</span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-white font-semibold text-sm">Alquiler de {req.embarcacion_nombre}</p>
                                                        <p className="text-white/60 text-xs truncate">{req.usuario_nombre} del {formatDate(req.fecha_inicio)} al {formatDate(req.fecha_fin)}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 justify-end mt-1 border-t border-white/5 pt-3">
                                                    <button onClick={(e) => { e.stopPropagation(); handleUpdateBooking(req.id, 'confirmada'); }} className="px-4 py-1.5 bg-green-500/20 text-green-400 text-xs font-semibold rounded hover:bg-green-500/30">Aceptar</button>
                                                    <button onClick={(e) => { e.stopPropagation(); handleUpdateBooking(req.id, 'cancelada'); }} className="px-4 py-1.5 bg-red-500/20 text-red-400 text-xs font-semibold rounded hover:bg-red-500/30">Rechazar</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'analytics' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-2xl font-bold text-white">Inteligencia de Negocio</h3>
                                <div className="px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg border border-blue-500/30 text-blue-400 font-semibold text-sm flex items-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div> Live Analytics
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Ingresos proyectados */}
                                <div className="glass-effect rounded-2xl p-6 border border-white/5 shadow-2xl relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                    <h4 className="text-white/80 font-semibold mb-6 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                                        Proyección de Ingresos (Mensual)
                                    </h4>
                                    <div className="h-72">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={[
                                                { name: 'Ene', total: 4000 }, { name: 'Feb', total: 3000 }, { name: 'Mar', total: 5000 },
                                                { name: 'Abr', total: 8500 }, { name: 'May', total: 12000 }, { name: 'Jun', total: 18000 }
                                            ]}>
                                                <defs>
                                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                                                <Tooltip 
                                                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                                                    itemStyle={{ color: '#60a5fa' }}
                                                />
                                                <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Distribución de Flota */}
                                <div className="glass-effect rounded-2xl p-6 border border-white/5 shadow-2xl relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                    <h4 className="text-white/80 font-semibold mb-6 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
                                        Distribución de Flota actual
                                    </h4>
                                    <div className="h-72">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={[
                                                        { name: 'En Charter', value: embarcaciones.filter(e => e.estado === 'en_charter').length || 1 },
                                                        { name: 'Disponibles', value: embarcaciones.filter(e => e.estado === 'disponible').length || 1 },
                                                        { name: 'Mantenimiento', value: embarcaciones.filter(e => e.estado === 'mantenimiento').length || 1 }
                                                    ]}
                                                    cx="50%" cy="45%"
                                                    innerRadius={60} outerRadius={90}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                    stroke="none"
                                                >
                                                    <Cell fill="#10b981" />
                                                    <Cell fill="#3b82f6" />
                                                    <Cell fill="#f59e0b" />
                                                </Pie>
                                                <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                                                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>
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
                                        <CustomSelect
                                            name="tipo"
                                            defaultValue={editingVessel?.tipo || 'yacht'}
                                            options={[
                                                { value: 'yacht', label: t('type_yacht') },
                                                { value: 'sailboat', label: t('type_sailboat') },
                                                { value: 'catamaran', label: t('type_catamaran') },
                                                { value: 'watercraft', label: t('type_watercraft') }
                                            ]}
                                            className="w-full text-sm"
                                        />
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
                                        <input
                                            type="text"
                                            name="ubicacion"
                                            defaultValue={editingVessel?.ubicacion}
                                            placeholder={t('location_label') || 'Location'}
                                            className="input"
                                            required
                                        />

                                        <div className="md:col-span-2 flex gap-6 mt-2 mb-2">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    name="incluye_capitan"
                                                    value="true"
                                                    defaultChecked={editingVessel?.incluye_capitan}
                                                    className="w-4 h-4 rounded bg-white/10 border-white/20 text-[#d4af37] focus:ring-[#d4af37]"
                                                />
                                                <span className="text-white/80 text-sm">{t('with_captain') || 'Con capitán'}</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    name="incluye_tripulacion"
                                                    value="true"
                                                    defaultChecked={editingVessel?.incluye_tripulacion}
                                                    className="w-4 h-4 rounded bg-white/10 border-white/20 text-[#d4af37] focus:ring-[#d4af37]"
                                                />
                                                <span className="text-white/80 text-sm">{t('crew_included') || 'Con tripulación'}</span>
                                            </label>
                                        </div>

                                        {/* Image Source Selection */}
                                        <div className="md:col-span-1">
                                            <label className="block text-white/60 text-sm mb-2">{t('image_url_label')}</label>
                                            <div className="space-y-3">
                                                {/* Text Input for Direct URL */}
                                                <input
                                                    type="text"
                                                    name="imagen_url"
                                                    defaultValue={editingVessel?.imagen_url}
                                                    placeholder="https://images.unsplash.com/..."
                                                    className="input text-xs"
                                                />
                                                
                                                {/* Flex container for Preview and File Upload */}
                                                <div className="flex gap-3 items-center p-2 bg-white/5 border border-white/10 rounded-lg">
                                                    {editingVessel?.imagen_url && (
                                                        <img src={editingVessel.imagen_url} alt="Current" className="w-10 h-10 rounded object-cover border border-white/20 shrink-0" />
                                                    )}
                                                    <div className="flex-1 overflow-hidden">
                                                        <input
                                                            type="file"
                                                            name="imagen"
                                                            accept="image/*"
                                                            className="text-xs text-white/60 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#d4af37]/20 file:text-[#d4af37] hover:file:bg-[#d4af37]/30 cursor-pointer w-full"
                                                        />
                                                    </div>
                                                </div>
                                                <p className="text-[10px] text-white/40 italic">Sube un archivo local O introduce una URL directa.</p>
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
                                            <p className="text-white/60 text-sm mb-3">{t(`type_${embarcacion.tipo}`)} • {embarcacion.longitud}m</p>
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
                                                        onClick={() => setDeleteModal({ isOpen: true, vessel: embarcacion })}
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
                            <div className="overflow-x-auto pb-4">
                                {/* Desktop Table */}
                                <table className="w-full min-w-[800px] hidden md:table">
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
                                                <td className="py-4 text-[#d4af37] font-bold">€{reserva.precio_total.toLocaleString()}</td>
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
                                                    {['confirmada', 'completada'].includes(reserva.estado) && (
                                                        <a
                                                            href={`/api/pagos/factura/${reserva.id}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 px-3 py-1 bg-[#d4af37]/15 text-[#d4af37] hover:bg-[#d4af37]/30 rounded transition-colors text-xs font-semibold border border-[#d4af37]/30"
                                                            title="Descargar Factura PDF"
                                                        >
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                            </svg>
                                                            PDF
                                                        </a>
                                                    )}
                                                    {['completada', 'cancelada'].includes(reserva.estado) && (
                                                        <span className="text-white/40 text-xs italic">{t('archived')}</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Mobile Card View */}
                                <div className="grid grid-cols-1 gap-4 md:hidden">
                                    {reservas.length === 0 ? (
                                        <div className="text-white/40 text-center py-12 italic text-sm bg-black/20 rounded-xl border border-dashed border-white/10">
                                            {t('no_bookings') || 'Sin reservas activas'}
                                        </div>
                                    ) : (
                                        reservas.map(reserva => (
                                            <div key={reserva.id} className="glass-effect rounded-xl p-4 border border-white/10 space-y-3">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <span className="text-[10px] text-[#d4af37] font-mono uppercase font-bold tracking-wider">Reserva #{reserva.id}</span>
                                                        <h4 className="text-white font-bold text-base leading-tight mt-0.5">{reserva.embarcacion_nombre}</h4>
                                                        <p className="text-white/50 text-xs mt-1 flex items-center gap-1">
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                            {reserva.usuario_nombre}
                                                        </p>
                                                    </div>
                                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full capitalize ${
                                                        reserva.estado === 'confirmada' ? 'bg-green-500/20 text-green-400' :
                                                        reserva.estado === 'cancelada' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'
                                                    }`}>
                                                        {reserva.estado}
                                                    </span>
                                                </div>
                                                <div className="bg-black/20 rounded-lg p-3 text-xs grid grid-cols-2 gap-2 border border-white/5">
                                                    <div>
                                                        <p className="text-white/40 font-semibold uppercase text-[9px]">{t('search_dates')}</p>
                                                        <p className="text-white/90 font-medium mt-0.5 whitespace-nowrap">{formatDate(reserva.fecha_inicio).split(',')[0]} - {formatDate(reserva.fecha_fin).split(',')[0]}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-white/40 font-semibold uppercase text-[9px]">{t('total')}</p>
                                                        <p className="text-[#d4af37] font-bold text-sm mt-0.5">€{reserva.precio_total.toLocaleString()}</p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap gap-2 pt-1">
                                                    {reserva.estado === 'pendiente' && (
                                                        <>
                                                            <button onClick={() => handleUpdateBooking(reserva.id, 'confirmada')} className="flex-1 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400 rounded-lg text-xs font-bold transition-colors">{t('confirm')}</button>
                                                            <button onClick={() => handleUpdateBooking(reserva.id, 'cancelada')} className="flex-1 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded-lg text-xs font-bold transition-colors">{t('reject')}</button>
                                                        </>
                                                    )}
                                                    {reserva.estado === 'confirmada' && (
                                                        <button onClick={() => handleUpdateBooking(reserva.id, 'completada')} className="flex-1 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 rounded-lg text-xs font-bold transition-colors">{t('complete')}</button>
                                                    )}
                                                    {['confirmada', 'completada'].includes(reserva.estado) && (
                                                        <a href={`/api/pagos/factura/${reserva.id}`} target="_blank" rel="noopener noreferrer" className="flex-1 py-2 bg-[#d4af37]/10 hover:bg-[#d4af37]/20 border border-[#d4af37]/30 text-[#d4af37] rounded-lg text-xs font-bold text-center flex items-center justify-center gap-1 transition-colors">
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                                            Recibo PDF
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'maintenance' && (
                        <div>
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-2xl font-bold text-white">{t('maintenance_schedule')}</h3>
                                    <p className="text-white/50 text-sm mt-1">Gestiona y programa los servicios de tu flota</p>
                                </div>
                                <button
                                    onClick={() => setShowMaintenanceForm(!showMaintenanceForm)}
                                    className="px-4 py-2 bg-[#d4af37] text-[#0a1628] rounded-lg font-semibold hover:bg-[#f4d03f] transition-colors flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    {t('schedule_maintenance')}
                                </button>
                            </div>

                            {/* Maintenance Form */}
                            {showMaintenanceForm && (
                                <div className="mb-8 p-6 glass-effect rounded-2xl border border-[#d4af37]/30">
                                    <h4 className="text-xl font-bold text-white mb-5">{t('schedule_maintenance')}</h4>
                                    <form onSubmit={handleCreateMaintenance} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1">
                                            <label className="text-white/60 text-xs uppercase font-semibold">{t('search_vessel')}</label>
                                            <CustomSelect
                                                name="embarcacion_id"
                                                options={[
                                                    { value: '', label: t('search_vessel') },
                                                    ...embarcaciones.map(e => ({ value: e.id.toString(), label: `${e.nombre} (${e.longitud}m)` }))
                                                ]}
                                                className="w-full text-sm z-50"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-white/60 text-xs uppercase font-semibold">{t('maintenance_type_label')}</label>
                                            <CustomSelect
                                                name="tipo"
                                                defaultValue="preventivo"
                                                options={[
                                                    { value: 'preventivo', label: t('tipo_preventivo') },
                                                    { value: 'correctivo', label: t('tipo_correctivo') },
                                                    { value: 'revision', label: t('tipo_revision') }
                                                ]}
                                                className="w-full text-sm z-40"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-white/60 text-xs uppercase font-semibold">{t('scheduled_date_label')}</label>
                                            <input
                                                type="date"
                                                className="bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#d4af37] scheme-dark"
                                                name="fecha"
                                                required
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-white/60 text-xs uppercase font-semibold">{t('estimated_cost_label')}</label>
                                            <input
                                                type="number"
                                                placeholder="0.00"
                                                className="bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-[#d4af37]"
                                                name="costo"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1 md:col-span-2">
                                            <label className="text-white/60 text-xs uppercase font-semibold">{t('maintenance_desc_label')}</label>
                                            <textarea
                                                placeholder={t('maintenance_desc_label')}
                                                className="bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-[#d4af37] resize-none"
                                                name="descripcion"
                                                rows={3}
                                            />
                                        </div>
                                        <div className="md:col-span-2 flex justify-end gap-3">
                                            <button type="button" onClick={() => setShowMaintenanceForm(false)} className="px-5 py-2 text-white/60 hover:text-white border border-white/20 rounded-lg transition-colors">{t('cancel')}</button>
                                            <button type="submit" className="btn btn-gold">{t('submit')}</button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* Maintenance Cards */}
                            {mantenimientos.length === 0 ? (
                                <div className="glass-effect rounded-2xl p-16 text-center">
                                    <svg className="w-16 h-16 text-white/20 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    </svg>
                                    <p className="text-white/40 text-lg">{t('no_maintenance')}</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                    {mantenimientos.map((m) => (
                                        <div
                                            key={m.id}
                                            className="glass-effect rounded-2xl p-5 border border-white/10 hover:border-white/20 transition-all"
                                        >
                                            {/* Card Header */}
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                                        m.estado === 'completado' ? 'bg-green-500/20' :
                                                        m.estado === 'en_proceso' ? 'bg-blue-500/20' : 'bg-orange-500/20'
                                                    }`}>
                                                        <svg className={`w-5 h-5 ${
                                                            m.estado === 'completado' ? 'text-green-400' :
                                                            m.estado === 'en_proceso' ? 'text-blue-400' : 'text-orange-400'
                                                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-bold text-sm">{tKey(`tipo_${m.tipo}`)}</p>
                                                        <p className="text-white/50 text-xs">{m.embarcacion_nombre}</p>
                                                    </div>
                                                </div>
                                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                                                    m.estado === 'completado' ? 'bg-green-500/20 text-green-400' :
                                                    m.estado === 'en_proceso' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'
                                                }`}>
                                                    {tKey(`estado_${m.estado}`)}
                                                </span>
                                            </div>

                                            {/* Description */}
                                            {m.descripcion && (
                                                <p className="text-white/70 text-sm mb-3 line-clamp-2">{m.descripcion}</p>
                                            )}

                                            {/* Footer info */}
                                            <div className="flex items-center justify-between pt-3 border-t border-white/10">
                                                <span className="text-white/40 text-xs">{t('maintenance_requested') || 'Programado'}: {formatDate(m.fecha_programada)}</span>
                                                {m.costo && m.costo > 0 && (
                                                    <span className="text-[#d4af37] text-xs font-semibold">${m.costo.toLocaleString()}</span>
                                                )}
                                            </div>

                                            {/* Action buttons */}
                                            {m.estado !== 'completado' && (
                                                <div className="mt-3 flex gap-2">
                                                    {m.estado === 'programado' && (
                                                        <button
                                                            onClick={async () => {
                                                                const token = localStorage.getItem('token') || '';
                                                                await mantenimientosAPI.update(m.id, { estado: 'en_proceso' }, token);
                                                                loadDashboardData();
                                                            }}
                                                            className="flex-1 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-xs font-semibold hover:bg-blue-500/40 transition-colors"
                                                        >
                                                            {t('mark_in_progress') || 'En Proceso'}
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={async () => {
                                                            const token = localStorage.getItem('token') || '';
                                                            await mantenimientosAPI.update(m.id, { estado: 'completado' }, token);
                                                            loadDashboardData();
                                                        }}
                                                        className="flex-1 py-2 bg-green-500/20 text-green-400 rounded-lg text-xs font-semibold hover:bg-green-500/40 transition-colors"
                                                    >
                                                        {t('mark_complete') || 'Completar'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'marina' && (
                        <div>
                            <div className="mb-6">
                                <h3 className="text-2xl font-bold text-white">{t('marina_title')}</h3>
                                <p className="text-white/50 text-sm mt-1">{t('marina_subtitle')}</p>
                            </div>

                            {/* Stats row */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
                                {[
                                    { label: t('berths_total'), value: amarres.length, color: 'text-white' },
                                    { label: t('berths_available'), value: amarres.filter(a => a.estado === 'disponible').length, color: 'text-green-400' },
                                    { label: t('berths_occupied'), value: amarres.filter(a => a.estado === 'ocupado').length, color: 'text-red-400' },
                                    { label: t('berths_maintenance'), value: amarres.filter(a => a.estado === 'mantenimiento').length, color: 'text-orange-400' },
                                ].map((stat, i) => (
                                    <div key={i} className="glass-effect rounded-xl p-3 sm:p-4 border border-white/5 shadow-sm">
                                        <p className="text-white/50 text-[10px] sm:text-xs uppercase font-bold tracking-wider mb-1">{stat.label}</p>
                                        <p className={`text-2xl sm:text-3xl font-black ${stat.color}`}>{stat.value}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-col xl:flex-row gap-6">
                                {/* Marina Map */}
                                <div className="flex-1 glass-effect rounded-2xl p-6 overflow-x-auto">
                                    {/* Legend */}
                                    <div className="flex flex-wrap items-center gap-3 sm:gap-6 mb-5 p-3 bg-black/20 rounded-lg border border-white/5">
                                        <span className="text-white/50 text-xs font-bold uppercase tracking-wider">{t('legend')}:</span>
                                        <div className="flex flex-wrap items-center gap-4">
                                            {[{ color: '#10b981', label: t('berth_available') }, { color: '#ef4444', label: t('berth_occupied') }, { color: '#f59e0b', label: t('berth_maintenance') }].map(l => (
                                                <div key={l.label} className="flex items-center gap-2 whitespace-nowrap">
                                                    <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: l.color, color: l.color }} />
                                                    <span className="text-white/80 text-xs font-medium">{l.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {amarres.length === 0 ? (
                                        <div className="text-center py-16">
                                            <svg className="w-16 h-16 text-white/20 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                            </svg>
                                            <p className="text-white/40">No hay amarres registrados en la marina</p>
                                            <p className="text-white/25 text-sm mt-1">Los amarres se crean automáticamente al iniciar el servidor</p>
                                        </div>
                                    ) : (
                                        (() => {
                                            const filas = Array.from(new Set(amarres.map(a => a.fila))).sort();
                                            return (
                                                <div className="min-w-[480px]">
                                                    {/* Water background */}
                                                    <div className="relative rounded-xl overflow-hidden" style={{ background: 'linear-gradient(180deg, #0d2137 0%, #0a3a5c 50%, #083052 100%)' }}>
                                                        {/* Subtle water lines */}
                                                        {[...Array(8)].map((_, i) => (
                                                            <div key={i} className="absolute left-0 right-0 border-b border-blue-400/8" style={{ top: `${8 + i * 12}%` }} />
                                                        ))}

                                                        {/* Main dock (muelle horizontal) */}
                                                        <div className="relative z-10 bg-[#3d2b1e] py-3 px-4 text-center border-b-2 border-[#5a3f2e]">
                                                            <span className="text-white/80 text-xs font-bold tracking-widest uppercase">Muelle Principal</span>
                                                        </div>

                                                        {/* Pantalanes + Amarres */}
                                                        <div className="relative z-10 flex justify-center gap-12 px-8 pb-6">
                                                            {filas.map(fila => {
                                                                const berths = amarres.filter(a => a.fila === fila).sort((a, b) => a.numero - b.numero);
                                                                return (
                                                                    <div key={fila} className="flex flex-col items-center">
                                                                        {/* Pantalán label */}
                                                                        <div className="w-6 text-center mb-0">
                                                                            <span className="text-white/40 text-[10px] font-bold">{fila}</span>
                                                                        </div>

                                                                        {/* Palo (pier) + amarres a los lados */}
                                                                        <div className="flex flex-row items-stretch gap-1">
                                                                            {/* Left berths (odd numbered) */}
                                                                            <div className="flex flex-col gap-2 justify-start pt-2">
                                                                                {berths.filter((_, idx) => idx % 2 === 0).map(a => {
                                                                                    const colors: Record<string, { bg: string; border: string; text: string }> = {
                                                                                        disponible: { bg: 'bg-emerald-500', border: 'border-emerald-400', text: 'text-emerald-50' },
                                                                                        ocupado:    { bg: 'bg-red-500',     border: 'border-red-400',     text: 'text-red-50' },
                                                                                        mantenimiento: { bg: 'bg-amber-500', border: 'border-amber-400', text: 'text-amber-50' },
                                                                                    };
                                                                                    const c = colors[a.estado] || colors.disponible;
                                                                                    return (
                                                                                        <button
                                                                                            key={a.id}
                                                                                            onClick={() => setSelectedAmarre(selectedAmarre?.id === a.id ? null : a)}
                                                                                            className={`w-16 h-10 ${c.bg} ${c.border} border-2 rounded flex flex-col items-center justify-center transition-all hover:scale-105 hover:z-10 relative ${
                                                                                                selectedAmarre?.id === a.id ? 'ring-2 ring-white scale-105 shadow-lg' : ''
                                                                                            }`}
                                                                                        >
                                                                                            <span className={`font-bold text-[10px] ${c.text}`}>{a.codigo}</span>
                                                                                            {a.longitud_max && <span className={`text-[8px] ${c.text} opacity-75`}>{a.longitud_max}m</span>}
                                                                                        </button>
                                                                                    );
                                                                                })}
                                                                            </div>

                                                                            {/* Central pier (palo marrón) */}
                                                                            <div className="w-2.5 bg-[#4a3728] rounded-sm flex-shrink-0" style={{ minHeight: `${berths.length * 28}px` }} />

                                                                            {/* Right berths (even numbered) */}
                                                                            <div className="flex flex-col gap-2 justify-start pt-2">
                                                                                {berths.filter((_, idx) => idx % 2 === 1).map(a => {
                                                                                    const colors: Record<string, { bg: string; border: string; text: string }> = {
                                                                                        disponible: { bg: 'bg-emerald-500', border: 'border-emerald-400', text: 'text-emerald-50' },
                                                                                        ocupado:    { bg: 'bg-red-500',     border: 'border-red-400',     text: 'text-red-50' },
                                                                                        mantenimiento: { bg: 'bg-amber-500', border: 'border-amber-400', text: 'text-amber-50' },
                                                                                    };
                                                                                    const c = colors[a.estado] || colors.disponible;
                                                                                    return (
                                                                                        <button
                                                                                            key={a.id}
                                                                                            onClick={() => setSelectedAmarre(selectedAmarre?.id === a.id ? null : a)}
                                                                                            className={`w-16 h-10 ${c.bg} ${c.border} border-2 rounded flex flex-col items-center justify-center transition-all hover:scale-105 hover:z-10 relative ${
                                                                                                selectedAmarre?.id === a.id ? 'ring-2 ring-white scale-105 shadow-lg' : ''
                                                                                            }`}
                                                                                        >
                                                                                            <span className={`font-bold text-[10px] ${c.text}`}>{a.codigo}</span>
                                                                                            {a.longitud_max && <span className={`text-[8px] ${c.text} opacity-75`}>{a.longitud_max}m</span>}
                                                                                        </button>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()
                                    )}
                                </div>

                                {/* Detail Panel */}
                                {selectedAmarre && (
                                    <div className="w-full xl:w-80 glass-effect rounded-2xl p-6 border border-white/20">
                                        <div className="flex items-center justify-between mb-5">
                                            <h4 className="text-lg font-bold text-white">{t('berth_details')}</h4>
                                            <button onClick={() => setSelectedAmarre(null)} className="text-white/40 hover:text-white">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>

                                        {/* Berth code badge */}
                                        <div className={`text-center py-4 rounded-xl mb-5 ${
                                            selectedAmarre.estado === 'disponible' ? 'bg-emerald-500/20 border border-emerald-500/30' :
                                            selectedAmarre.estado === 'ocupado' ? 'bg-red-500/20 border border-red-500/30' :
                                            'bg-amber-500/20 border border-amber-500/30'
                                        }`}>
                                            <p className="text-3xl font-black text-white">{selectedAmarre.codigo}</p>
                                            <p className={`text-sm font-semibold mt-1 ${
                                                selectedAmarre.estado === 'disponible' ? 'text-emerald-400' :
                                                selectedAmarre.estado === 'ocupado' ? 'text-red-400' : 'text-amber-400'
                                            }`}>
                                                {selectedAmarre.estado === 'disponible' ? t('berth_available') :
                                                 selectedAmarre.estado === 'ocupado' ? t('berth_occupied') : t('berth_maintenance')}
                                            </p>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-white/50 text-sm">{t('berth_dock')}</span>
                                                <span className="text-white text-sm font-semibold">{selectedAmarre.muelle}</span>
                                            </div>
                                            {selectedAmarre.longitud_max && (
                                                <div className="flex justify-between">
                                                    <span className="text-white/50 text-sm">{t('berth_max_length')}</span>
                                                    <span className="text-white text-sm font-semibold">{selectedAmarre.longitud_max}m</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between">
                                                <span className="text-white/50 text-sm">{t('berth_price')}</span>
                                                <span className="text-[#d4af37] text-sm font-bold">
                                                    {selectedAmarre.precio_mes > 0 ? `€${selectedAmarre.precio_mes.toLocaleString()}/mes` : '—'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-white/50 text-sm">{t('berth_vessel')}</span>
                                                <span className="text-white text-sm">
                                                    {selectedAmarre.embarcacion_nombre || t('berth_no_vessel')}
                                                </span>
                                            </div>
                                            {selectedAmarre.propietario_nombre && (
                                                <div className="flex justify-between pt-2 border-t border-white/10">
                                                    <span className="text-white/50 text-sm">Propietario</span>
                                                    <span className="text-[#d4af37] text-sm font-semibold">{selectedAmarre.propietario_nombre}</span>
                                                </div>
                                            )}
                                            {selectedAmarre.fecha_fin_alquiler && (
                                                <div className="flex justify-between">
                                                    <span className="text-white/50 text-sm">Alquilado hasta</span>
                                                    <span className="text-white/70 text-sm">
                                                        {new Date(selectedAmarre.fecha_fin_alquiler).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="mt-5 pt-4 border-t border-white/10 flex flex-col gap-3">
                                            {selectedAmarre.estado === 'disponible' && (
                                                <button
                                                    onClick={() => {
                                                        setRentModal({ isOpen: true, amarreId: selectedAmarre.id });
                                                        setRentMonths(1);
                                                        setRentVesselId('');
                                                    }}
                                                    className="w-full py-2 bg-[#d4af37] text-[#0a1628] rounded-lg font-bold hover:bg-[#f4d03f] transition-colors"
                                                >
                                                    Alquilar Amarre
                                                </button>
                                            )}
                                            
                                            {selectedAmarre.estado === 'ocupado' && selectedAmarre.propietario_id === usuario?.id && (
                                                <button
                                                    onClick={async () => {
                                                        if(!window.confirm('¿Seguro que deseas liberar este amarre? Dejarás de pagarlo de cara al mes que viene.')) return;
                                                        try {
                                                            const token = localStorage.getItem('token') || '';
                                                            await amarresAPI.liberar(selectedAmarre.id, token);
                                                            toast.success('Amarre liberado con éxito');
                                                            loadDashboardData();
                                                            setSelectedAmarre(null);
                                                        } catch(e: any) {
                                                            toast.error(e.message || 'Error al liberar amarre');
                                                        }
                                                    }}
                                                    className="w-full py-2 bg-red-500/20 text-red-500 border border-red-500/50 rounded-lg font-semibold hover:bg-red-500/30 transition-colors"
                                                >
                                                    Liberar y Dejar Amarre
                                                </button>
                                            )}

                                            {/* Only admin can change status manually */}
                                            {usuario?.rol === 'admin' && (
                                                <div className="mt-3">
                                                    <p className="text-white/50 text-xs uppercase mb-2">Cambio de Estado Manual (Admin)</p>
                                                    <div className="flex flex-col gap-2">
                                                        {(['disponible', 'ocupado', 'mantenimiento'] as const).map(estado => (
                                                            <button
                                                                key={estado}
                                                                disabled={selectedAmarre.estado === estado}
                                                                onClick={async () => {
                                                                    const token = localStorage.getItem('token') || '';
                                                                    await amarresAPI.update(selectedAmarre.id, { estado }, token);
                                                                    toast.success(`Amarre manual: ${estado}`);
                                                                    loadDashboardData();
                                                                    setSelectedAmarre({ ...selectedAmarre, estado });
                                                                }}
                                                                className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                                                    selectedAmarre.estado === estado
                                                                        ? 'opacity-30 cursor-not-allowed bg-white/10 text-white'
                                                                        : estado === 'disponible'
                                                                            ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/40'
                                                                            : estado === 'ocupado'
                                                                                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/40'
                                                                                : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/40'
                                                                }`}
                                                            >
                                                                {estado === 'disponible' ? t('berth_available') :
                                                                estado === 'ocupado' ? t('berth_occupied') : t('berth_maintenance')}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}



                    {activeTab === 'messages' && (
                        <div className="glass-effect rounded-2xl p-6">
                            <h3 className="text-2xl font-bold text-white mb-6">Mensajes</h3>
                            <ChatInterface />
                        </div>
                    )}
                </div>

                {/* Modal Alquilar Amarre */}
                {rentModal.isOpen && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                        <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-md border border-white/10 shadow-2xl">
                            <h3 className="text-xl font-bold text-white mb-4">Detalles del alquiler de amarre</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-white/80 text-sm mb-2">Duración (Meses)</label>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        value={rentMonths} 
                                        onChange={(e) => setRentMonths(parseInt(e.target.value) || 1)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-white/80 text-sm mb-2">Asignar Embarcación</label>
                                    <CustomSelect
                                        value={rentVesselId.toString()}
                                        onChange={(value) => setRentVesselId(value ? parseInt(value) : '')}
                                        options={[
                                            { value: '', label: '-- Selecciona una embarcación --' },
                                            ...embarcaciones.filter(e => {
                                                const amarreTarget = amarres.find(a => a.id === rentModal.amarreId);
                                                if (!amarreTarget || !amarreTarget.longitud_max) return true;
                                                const maxFt = amarreTarget.longitud_max * 3.28084;
                                                return (e.longitud || 0) <= maxFt;
                                            }).map(boat => ({
                                                value: boat.id.toString(),
                                                label: `${boat.nombre} (${boat.longitud}ft)`
                                            }))
                                        ]}
                                        className="w-full text-sm z-50"
                                    />
                                    <p className="text-white/40 text-xs mt-2 italic">* Solo se muestran barcos de tu flota cuya eslora entra en los límites físicos del amarre seleccionado.</p>
                                </div>
                                <div className="flex gap-4 pt-4 mt-2 border-t border-white/10">
                                    <button 
                                        onClick={() => setRentModal({ isOpen: false, amarreId: null })}
                                        className="flex-1 py-2 hover:bg-white/5 text-white/80 rounded-lg transition-colors border border-transparent hover:border-white/10"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        onClick={async () => {
                                            if (rentMonths <= 0) return toast.error('Cantidad de meses inválida');
                                            if (!rentVesselId) return toast.error('Debes asignar una embarcación');
                                            try {
                                                const token = localStorage.getItem('token') || '';
                                                await amarresAPI.alquilar(
                                                    rentModal.amarreId as number, 
                                                    { meses: rentMonths, propietario_id: usuario?.id as number, embarcacion_id: rentVesselId as number }, 
                                                    token
                                                );
                                                toast.success(`Amarre alquilado exitosamente.`);
                                                loadDashboardData();
                                                setSelectedAmarre(null);
                                                setRentModal({ isOpen: false, amarreId: null });
                                            } catch(e: any) {
                                                toast.error(e.message || 'Error al alquilar amarre');
                                            }
                                        }}
                                        className="flex-1 py-2 bg-[#d4af37] text-[#0a1628] rounded-lg font-bold hover:bg-[#f4d03f] transition-shadow shadow-[0_0_15px_rgba(212,175,55,0.3)]"
                                    >
                                        Confirmar Alquiler
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            
            {/* Mobile Bottom Navigation Bar (App-like UX) */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0a1628]/80 backdrop-blur-xl border-t border-white/10 z-[60] pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                <div className="flex justify-around items-center px-2 py-3">
                    <button onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'dashboard' ? 'text-[#d4af37] scale-110' : 'text-white/50 hover:text-white/80'}`}>
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" /></svg>
                        <span className="text-[10px] font-medium tracking-wide">Inicio</span>
                    </button>
                    <button onClick={() => { setActiveTab('fleet'); setIsSidebarOpen(false); }} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'fleet' ? 'text-[#d4af37] scale-110' : 'text-white/50 hover:text-white/80'}`}>
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v-2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0 1.26.65 2.62.99 4 .99h2v2h-2z" /></svg>
                        <span className="text-[10px] font-medium tracking-wide">Flota</span>
                    </button>
                    <button onClick={() => { setActiveTab('bookings'); setIsSidebarOpen(false); }} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'bookings' ? 'text-[#d4af37] scale-110' : 'text-white/50 hover:text-white/80'}`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span className="text-[10px] font-medium tracking-wide">Reservas</span>
                    </button>
                    <button onClick={() => { setActiveTab('messages'); setIsSidebarOpen(false); }} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'messages' ? 'text-[#d4af37] scale-110' : 'text-white/50 hover:text-white/80'}`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                        <span className="text-[10px] font-medium tracking-wide">Mensajes</span>
                    </button>
                    <button onClick={() => setIsSidebarOpen(true)} className="flex flex-col items-center gap-1 text-white/50 hover:text-white/80 transition-all">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>
                        <span className="text-[10px] font-medium tracking-wide">Más</span>
                    </button>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteModal.isOpen && deleteModal.vessel && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[60] backdrop-blur-sm">
                    <div className="bg-[#1a2942] rounded-2xl p-6 w-full max-w-md border border-white/10 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500"></div>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Eliminar Embarcación</h3>
                                <p className="text-white/60 text-sm">{deleteModal.vessel.nombre}</p>
                            </div>
                        </div>
                        <p className="text-white/80 mb-8">
                            {t('confirm_delete') || '¿Estás seguro de que deseas eliminar esta embarcación? Esta acción no se puede deshacer y eliminará también las reservas y mantenimientos asociados.'}
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setDeleteModal({ isOpen: false, vessel: null })}
                                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-lg font-semibold transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDeleteVessel}
                                className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            </main>
        </div>
    );
};

export default Dashboard;
