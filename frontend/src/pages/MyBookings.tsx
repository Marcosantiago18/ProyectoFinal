
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contex/AuthContext';
import { useLanguage } from '../contex/LanguageContext';
import { reservasAPI } from '../utils/api';
import type { Reserva } from '../types';
import Navbar from '../components/shared/Navbar';
import Footer from '../components/shared/Footer';
import { toast } from 'sonner';

const MyBookings: React.FC = () => {
    const { usuario, isAuthenticated } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [reservas, setReservas] = useState<Reserva[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        loadReservas();
    }, [isAuthenticated]);

    const loadReservas = async () => {
        try {
            const token = localStorage.getItem('token') || '';
            if (usuario?.id) {
                const data: any = await reservasAPI.getAll({ usuario_id: usuario.id }, token);
                setReservas(data);
            }
        } catch (error) {
            console.error('Error loading bookings:', error);
            toast.error('Error al cargar tus reservas');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (estado: string) => {
        const badges: Record<string, string> = {
            'pendiente': 'badge-orange',
            'confirmada': 'badge-blue',
            'en_curso': 'badge-green',
            'completada': 'badge-green',
            'cancelada': 'badge-red',
        };
        return badges[estado] || 'badge-blue';
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <div className="min-h-screen bg-[#0a1628] flex flex-col">
            <Navbar />

            <main className="flex-1 pt-24 pb-12 px-6">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold text-white mb-8">{t('my_bookings')}</h1>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : reservas.length === 0 ? (
                        <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
                            <span className="material-icons text-6xl text-white/20 mb-4">sailing</span>
                            <h3 className="text-xl text-white font-semibold mb-2">{t('no_bookings')}</h3>
                            <p className="text-white/60 mb-6">{t('explore_fleet')}</p>
                            <button
                                onClick={() => navigate('/search')}
                                className="px-6 py-2 bg-[#d4af37] text-[#0a1628] rounded-lg font-bold hover:bg-[#f4d03f] transition-colors"
                            >
                                {t('view_vessels')}
                            </button>
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            {reservas.map((reserva) => (
                                <div key={reserva.id} className="glass-effect rounded-xl p-6 flex flex-col md:flex-row gap-6 items-start md:items-center">
                                    {/* Status Indicator */}
                                    <div className={`hidden md:block w-2 self-stretch rounded-full ${reserva.estado === 'confirmada' ? 'bg-green-500' :
                                        reserva.estado === 'pendiente' ? 'bg-orange-500' : 'bg-slate-500'
                                        }`}></div>

                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-3 mb-2">
                                            <h3 className="text-xl font-bold text-white">
                                                {reserva.embarcacion_nombre || t('search_vessel')}
                                            </h3>
                                            <span className={`badge ${getStatusBadge(reserva.estado)}`}>
                                                {reserva.estado.toUpperCase()}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-white/70">
                                            <div className="flex items-center gap-2">
                                                <span className="material-icons text-[#d4af37] text-base">calendar_today</span>
                                                <span>{formatDate(reserva.fecha_inicio)} - {formatDate(reserva.fecha_fin)}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="material-icons text-[#d4af37] text-base">event</span>
                                                <span className="capitalize">{reserva.tipo_evento || t('event_general')}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="material-icons text-[#d4af37] text-base">payments</span>
                                                <span className="text-white font-semibold">${reserva.precio_total.toLocaleString()}</span>
                                            </div>
                                            {reserva.notas && (
                                                <div className="flex items-center gap-2 md:col-span-2">
                                                    <span className="material-icons text-[#d4af37] text-base">notes</span>
                                                    <span className="italic">"{reserva.notas}"</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="w-full md:w-auto flex flex-col gap-2">
                                        <button
                                            onClick={() => navigate(`/vessel/${reserva.embarcacion_id}`)}
                                            className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm font-semibold"
                                        >
                                            {t('view_boat')}
                                        </button>
                                        {reserva.estado === 'pendiente' && (
                                            <button className="px-4 py-2 border border-red-500/50 text-red-500 rounded-lg hover:bg-red-500/10 transition-colors text-sm font-semibold">
                                                {t('cancel_booking')}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default MyBookings;
