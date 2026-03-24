
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contex/AuthContext';
import { useLanguage } from '../contex/LanguageContext';
import { reservasAPI, favoritosAPI } from '../utils/api';
import type { Reserva } from '../types';
import Navbar from '../components/shared/Navbar';
import Footer from '../components/shared/Footer';
import { toast } from 'sonner';

type TabType = 'reservas' | 'favoritos';

const MyBookings: React.FC = () => {
    const { usuario, isAuthenticated } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabType>('reservas');
    
    const [reservas, setReservas] = useState<Reserva[]>([]);
    const [favoritos, setFavoritos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        loadData();
    }, [isAuthenticated, activeTab]);

    const loadData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token') || '';
            if (usuario?.id) {
                if (activeTab === 'reservas') {
                    const data: any = await reservasAPI.getAll({ usuario_id: usuario.id }, token);
                    setReservas(data);
                } else {
                    const data: any = await favoritosAPI.getByUsuario(usuario.id, token);
                    setFavoritos(data);
                }
            }
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Error al cargar la información');
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

    const handleCancelBooking = async (id: number) => {
        if (!window.confirm(t('confirm_cancel_booking') || '¿Estás seguro de que deseas cancelar esta reserva?')) return;
        try {
            const token = localStorage.getItem('token') || '';
            await reservasAPI.update(id, { estado: 'cancelada' }, token);
            toast.success(t('booking_cancelled') || 'Reserva cancelada correctamente');
            loadData();
        } catch (error) {
            console.error('Error canceling booking:', error);
            toast.error(t('error_canceling_booking') || 'Error al cancelar la reserva');
        }
    };

    const exportToPDF = (reserva: Reserva) => {
        const invoiceContent = `
            <html>
                <head>
                    <title>Factura - Reserva #${reserva.id}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 40px; color: #333; max-width: 800px; margin: auto; }
                        .header { text-align: center; border-bottom: 2px solid #d4af37; padding-bottom: 20px; margin-bottom: 30px; }
                        .header h1 { margin: 0; color: #0a1628; }
                        .header h2 { margin: 5px 0 0 0; color: #666; font-weight: normal; font-size: 18px; }
                        .details { line-height: 1.8; margin-bottom: 40px; }
                        .total { font-size: 24px; font-weight: bold; color: #d4af37; margin-top: 30px; text-align: right; border-top: 1px solid #eee; padding-top: 20px;}
                        .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #999; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>NAUTICA ELITE FLEET</h1>
                        <h2>Factura Comercial</h2>
                    </div>
                    <div class="details">
                        <p><strong>Nº Reserva:</strong> #${reserva.id}</p>
                        <p><strong>Fecha de Emisión:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
                        <p><strong>Cliente:</strong> ${usuario?.nombre || 'Cliente'}</p>
                        <p><strong>Embarcación:</strong> ${reserva.embarcacion_nombre}</p>
                        <p><strong>Periodo:</strong> ${new Date(reserva.fecha_inicio).toLocaleDateString('es-ES')} al ${new Date(reserva.fecha_fin).toLocaleDateString('es-ES')}</p>
                        <p><strong>Estado:</strong> ${reserva.estado.toUpperCase()}</p>
                        <p><strong>Notas de Reserva:</strong> ${reserva.notas || 'Ninguna'}</p>
                        
                        <div class="total">Total a pagar: $${reserva.precio_total.toLocaleString()}</div>
                    </div>
                    <div class="footer">
                        <p>Gracias por confiar en Nautica Elite Fleet. Este documento es una factura válida.</p>
                    </div>
                    <script>
                        window.onload = function() { window.print(); window.close(); }
                    </script>
                </body>
            </html>
        `;
        const printWindow = window.open('', '', 'height=800,width=800');
        if (printWindow) {
            printWindow.document.write(invoiceContent);
            printWindow.document.close();
        }
    };

    return (
        <div className="min-h-screen bg-[#0a1628] flex flex-col">
            <Navbar />

            <main className="flex-1 pt-24 pb-12 px-6">
                <div className="max-w-7xl mx-auto">
                    
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">Panel de Usuario</h1>
                            <p className="text-white/60">Gestiona tus reservas y favoritos</p>
                        </div>
                        
                        {/* Tabs */}
                        <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
                            <button
                                onClick={() => setActiveTab('reservas')}
                                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'reservas' ? 'bg-[#d4af37] text-[#0a1628]' : 'text-white/60 hover:text-white'}`}
                            >
                                Mis Reservas
                            </button>
                            <button
                                onClick={() => setActiveTab('favoritos')}
                                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'favoritos' ? 'bg-[#d4af37] text-[#0a1628]' : 'text-white/60 hover:text-white'}`}
                            >
                                Favoritos
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-12 h-12 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : activeTab === 'reservas' ? (
                        /* ================== RESERVAS TAB ================== */
                        reservas.length === 0 ? (
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
                                                className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm font-semibold text-left md:text-center"
                                            >
                                                {t('view_boat')}
                                            </button>
                                            
                                            {/* Imprimir / Descargar Factura PDF */}
                                            {['confirmada', 'completada'].includes(reserva.estado) && (
                                                <button
                                                    onClick={() => exportToPDF(reserva)}
                                                    className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm font-semibold flex items-center gap-2 justify-center"
                                                >
                                                    <span className="material-icons text-sm">picture_as_pdf</span> Factura
                                                </button>
                                            )}

                                            {reserva.estado === 'pendiente' && (
                                                <button 
                                                    onClick={() => handleCancelBooking(reserva.id)}
                                                    className="px-4 py-2 border border-red-500/50 text-red-500 rounded-lg hover:bg-red-500/10 transition-colors text-sm font-semibold"
                                                >
                                                    {t('cancel_booking')}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    ) : (
                        /* ================== FAVORITOS TAB ================== */
                        favoritos.length === 0 ? (
                            <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
                                <span className="material-icons text-6xl text-white/20 mb-4">favorite_border</span>
                                <h3 className="text-xl text-white font-semibold mb-2">No tienes favoritos</h3>
                                <p className="text-white/60 mb-6">Guarda los barcos que más te gusten para verlos luego.</p>
                                <button
                                    onClick={() => navigate('/search')}
                                    className="px-6 py-2 bg-[#d4af37] text-[#0a1628] rounded-lg font-bold hover:bg-[#f4d03f] transition-colors"
                                >
                                    Ver flota
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {favoritos.map((fav) => (
                                    <div key={fav.id} className="glass-effect rounded-2xl overflow-hidden group cursor-pointer border border-white/10 hover:border-[#d4af37]/50 transition-colors" onClick={() => navigate(`/vessel/${fav.embarcacion_id}`)}>
                                        <div className="relative h-48 w-full overflow-hidden">
                                            <img
                                                src={fav.embarcacion?.imagen_url || 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800'}
                                                alt={fav.embarcacion?.nombre || 'Barco'}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                            <div className="absolute top-4 right-4">
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        // Aquí podrías implementar quitar de favoritos directamente desde la grid
                                                        navigate(`/vessel/${fav.embarcacion_id}`);
                                                    }}
                                                    className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-[#d4af37] border border-white/20 hover:scale-110"
                                                >
                                                    <span className="material-icons text-sm">favorite</span>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="p-5">
                                            <h3 className="text-white font-bold text-lg mb-1">{fav.embarcacion?.nombre}</h3>
                                            <p className="text-white/50 text-sm mb-4">{fav.embarcacion?.ubicacion}</p>
                                            <div className="flex justify-between items-center text-sm border-t border-white/10 pt-4">
                                                <span className="text-[#d4af37] font-bold">
                                                    ${fav.embarcacion?.precio_dia} <span className="text-white/50 font-normal">/día</span>
                                                </span>
                                                <span className="text-white/70 flex items-center gap-1">
                                                    <span className="material-icons text-[#d4af37] text-sm">star</span> {fav.embarcacion?.rating > 0 ? fav.embarcacion.rating.toFixed(1) : 'Nuevo'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default MyBookings;

