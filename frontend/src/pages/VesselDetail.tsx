import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Embarcacion } from '../types';
import { embarcacionesAPI, reservasAPI } from '../utils/api';
import { useAuth } from '../contex/AuthContext';
import { useLanguage } from '../contex/LanguageContext';
import Navbar from '../components/shared/Navbar';
import Footer from '../components/shared/Footer';
import { toast } from 'sonner';

const VesselDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isAuthenticated, usuario } = useAuth();
    const { t } = useLanguage();

    const [embarcacion, setEmbarcacion] = useState<Embarcacion | null>(null);
    const [loading, setLoading] = useState(true);
    const [bookingData, setBookingData] = useState({
        fecha_inicio: '',
        fecha_fin: '',
        tipo_evento: '',
        notas: '',
    });

    useEffect(() => {
        if (id) {
            loadEmbarcacion();
        }
    }, [id]);

    const loadEmbarcacion = async () => {
        try {
            const data: any = await embarcacionesAPI.getById(Number(id));
            setEmbarcacion(data);
        } catch (error) {
            console.error('Error cargando embarcación:', error);
            toast.error('Error al cargar los detalles');
        } finally {
            setLoading(false);
        }
    };

    const calculateDays = () => {
        if (!bookingData.fecha_inicio || !bookingData.fecha_fin) return 0;
        const start = new Date(bookingData.fecha_inicio);
        const end = new Date(bookingData.fecha_fin);
        const diff = end.getTime() - start.getTime();
        return Math.ceil(diff / (1000 * 3600 * 24));
    };

    const calculateTotal = () => {
        if (!embarcacion) return 0;
        return calculateDays() * embarcacion.precio_dia;
    };

    const handleBooking = async () => {
        if (!isAuthenticated) {
            toast.error('Debes iniciar sesión para reservar');
            navigate('/login');
            return;
        }

        if (!bookingData.fecha_inicio || !bookingData.fecha_fin) {
            toast.error('Por favor selecciona las fechas');
            return;
        }

        try {
            const token = localStorage.getItem('token') || '';
            await reservasAPI.create({
                usuario_id: usuario?.id,
                embarcacion_id: embarcacion?.id,
                ...bookingData,
            }, token);

            toast.success('Reserva creada exitosamente');
            navigate('/dashboard');
        } catch (error: any) {
            toast.error(error.message || 'Error al crear la reserva');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!embarcacion) {
        return (
            <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-white text-2xl mb-4">{t('vessel_not_found')}</h2>
                    <button onClick={() => navigate('/')} className="btn btn-primary">
                        {t('back_to_home')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a1628]">
            <Navbar />

            {/* Hero Image */}
            <div className="relative h-[60vh] mt-20">
                <img
                    src={embarcacion.imagen_url || 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=1920'}
                    alt={embarcacion.nombre}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628] to-transparent" />

                {/* Badges */}
                <div className="absolute top-8 left-8 flex gap-3">
                    {embarcacion.incluye_capitan && (
                        <span className="badge badge-gold">{t('with_captain')}</span>
                    )}
                    {embarcacion.incluye_tripulacion && (
                        <span className="badge badge-blue">{t('crew_included')}</span>
                    )}
                    <span className={`badge ${embarcacion.estado === 'disponible' ? 'badge-green' : 'badge-orange'}`}>
                        {embarcacion.estado === 'disponible' ? t('available_status') : t('not_available')}
                    </span>
                </div>
            </div>

            <div className="container mx-auto px-6 -mt-32 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        {/* Header */}
                        <div className="glass-effect rounded-2xl p-8 mb-8">
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h1 className="text-4xl font-bold text-white mb-2">{embarcacion.nombre}</h1>
                                    <div className="flex items-center gap-4 text-white/60">
                                        <span className="flex items-center gap-2">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            </svg>
                                            {embarcacion.ubicacion}
                                        </span>
                                        <span>•</span>
                                        <span>{embarcacion.longitud}ft</span>
                                        <span>•</span>
                                        <span>{embarcacion.capacidad} {t('guests')}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <svg className="w-6 h-6 text-gold-accent" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                    <span className="text-white text-xl font-bold">{embarcacion.rating}</span>
                                </div>
                            </div>

                            <p className="text-white/80 text-lg leading-relaxed">
                                {embarcacion.descripcion || 'Luxury vessel available for charter. Experience the ultimate maritime adventure.'}
                            </p>
                        </div>

                        {/* Features */}
                        <div className="glass-effect rounded-2xl p-8 mb-8">
                            <h3 className="text-2xl font-bold text-white mb-6">{t('features_amenities')}</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-white font-semibold">{embarcacion.capacidad} {t('guests')}</p>
                                        <p className="text-white/60 text-sm">{t('capacity_label')}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gold-accent/20 rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-gold-accent" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v-2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0 1.26.65 2.62.99 4 .99h2v2h-2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-white font-semibold">
                                            {embarcacion.tipo === 'yacht' ? t('type_yacht') :
                                                embarcacion.tipo === 'sailboat' ? t('type_sailboat') :
                                                    t('type_watercraft')}
                                        </p>
                                        <p className="text-white/60 text-sm">{t('vessel_type')}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-white font-semibold">{embarcacion.estado === 'disponible' ? t('available_status') : t('not_available')}</p>
                                        <p className="text-white/60 text-sm">{t('status')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Specifications */}
                        <div className="glass-effect rounded-2xl p-8">
                            <h3 className="text-2xl font-bold text-white mb-6">{t('specifications')}</h3>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="border-l-4 border-blue-500 pl-4">
                                    <p className="text-white/60 text-sm mb-1">{t('length')}</p>
                                    <p className="text-white text-xl font-bold">{embarcacion.longitud} {t('length')}</p>
                                </div>
                                <div className="border-l-4 border-gold-accent pl-4">
                                    <p className="text-white/60 text-sm mb-1">{t('category')}</p>
                                    <p className="text-white text-xl font-bold capitalize">{embarcacion.categoria || embarcacion.tipo}</p>
                                </div>
                                <div className="border-l-4 border-green-500 pl-4">
                                    <p className="text-white/60 text-sm mb-1">{t('captain')}</p>
                                    <p className="text-white text-xl font-bold">{embarcacion.incluye_capitan ? t('included') : t('optional')}</p>
                                </div>
                                <div className="border-l-4 border-orange-500 pl-4">
                                    <p className="text-white/60 text-sm mb-1">{t('crew')}</p>
                                    <p className="text-white text-xl font-bold">{embarcacion.incluye_tripulacion ? t('included') : t('not_included')}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Booking Card */}
                    <div className="lg:col-span-1">
                        <div className="glass-effect rounded-2xl p-8 sticky top-24">
                            <div className="mb-6">
                                <p className="text-white/60 text-sm mb-2">{t('price_from')}</p>
                                <p className="text-blue-500 text-4xl font-bold">
                                    ${embarcacion.precio_dia.toLocaleString()}
                                    <span className="text-lg text-white/60 font-normal">/{t('per_day')}</span>
                                </p>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="text-white/80 text-sm mb-2 block">{t('check_in')}</label>
                                    <input
                                        type="date"
                                        value={bookingData.fecha_inicio}
                                        onChange={(e) => setBookingData({ ...bookingData, fecha_inicio: e.target.value })}
                                        className="input"
                                    />
                                </div>

                                <div>
                                    <label className="text-white/80 text-sm mb-2 block">{t('check_out')}</label>
                                    <input
                                        type="date"
                                        value={bookingData.fecha_fin}
                                        onChange={(e) => setBookingData({ ...bookingData, fecha_fin: e.target.value })}
                                        className="input"
                                    />
                                </div>

                                <div>
                                    <label className="text-white/80 text-sm mb-2 block">{t('event_type')}</label>
                                    <select
                                        value={bookingData.tipo_evento}
                                        onChange={(e) => setBookingData({ ...bookingData, tipo_evento: e.target.value })}
                                        className="input text-black"
                                    >
                                        <option value="">{t('select_type')}</option>
                                        <option value="leisure">{t('leisure')}</option>
                                        <option value="wedding">{t('wedding')}</option>
                                        <option value="corporate">{t('corporate')}</option>
                                        <option value="other">{t('other')}</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-white/80 text-sm mb-2 block">{t('notes_label')}</label>
                                    <textarea
                                        value={bookingData.notas}
                                        onChange={(e) => setBookingData({ ...bookingData, notas: e.target.value })}
                                        className="input resize-none"
                                        rows={3}
                                        placeholder={t('notes_placeholder')}
                                    />
                                </div>
                            </div>

                            {calculateDays() > 0 && (
                                <div className="mb-6 p-4 bg-white/5 rounded-lg">
                                    <div className="flex justify-between mb-2">
                                        <span className="text-white/60">
                                            ${embarcacion.precio_dia.toLocaleString()} × {calculateDays()} days
                                        </span>
                                        <span className="text-white">${calculateTotal().toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between pt-2 border-t border-white/10">
                                        <span className="text-white font-bold">{t('total')}</span>
                                        <span className="text-blue-500 text-xl font-bold">
                                            ${calculateTotal().toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleBooking}
                                disabled={embarcacion.estado !== 'disponible'}
                                className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {embarcacion.estado === 'disponible' ? t('request_booking') : t('not_available')}
                            </button>

                            <p className="text-white/40 text-xs text-center mt-4">
                                {t('no_charge_msg')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default VesselDetail;
