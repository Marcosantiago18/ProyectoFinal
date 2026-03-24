import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Embarcacion } from '../types';
import { embarcacionesAPI, reservasAPI, reviewsAPI, favoritosAPI } from '../utils/api';
import { useAuth } from '../contex/AuthContext';
import { useLanguage } from '../contex/LanguageContext';
import Navbar from '../components/shared/Navbar';
import Footer from '../components/shared/Footer';
import CustomSelect from '../components/shared/CustomSelect';
import PaymentModal from '../components/shared/PaymentModal';
import { toast } from 'sonner';

type BookingMode = 'dias' | 'horas';

const MONTHS = [
    'Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
];
const WEEKDAYS = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];

const VesselDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isAuthenticated, usuario } = useAuth();
    const { t } = useLanguage();

    const [embarcacion, setEmbarcacion] = useState<Embarcacion | null>(null);
    const [loading, setLoading] = useState(true);
    const [bookingMode, setBookingMode] = useState<BookingMode>('dias');
    const [calendarDate, setCalendarDate] = useState(new Date());
    const [selectedStart, setSelectedStart] = useState<number | null>(null);
    const [selectedEnd, setSelectedEnd] = useState<number | null>(null);
    const [unavailableDates, setUnavailableDates] = useState<string[]>([]);

    const [reviews, setReviews] = useState<any[]>([]);
    const [newReview, setNewReview] = useState({ rating: 5, comentario: '' });
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);
    const [favoriteId, setFavoriteId] = useState<number | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    const [bookingData, setBookingData] = useState({
        fecha_inicio: '',
        fecha_fin: '',
        hora_inicio: '09:00',
        hora_fin: '17:00',
        tipo_evento: '',
        notas: '',
    });

    useEffect(() => {
        if (id) loadEmbarcacion();
    }, [id]);

    const loadEmbarcacion = async () => {
        try {
            const data: any = await embarcacionesAPI.getById(Number(id));
            setEmbarcacion(data);

            const token = localStorage.getItem('token') || '';
            const reservasData: any = await reservasAPI.getAll({ embarcacion_id: id }, token);
            const blocked: string[] = [];
            reservasData.forEach((res: any) => {
                if (['pendiente', 'confirmada', 'en_curso'].includes(res.estado)) {
                    // Extract exact UTC days to prevent local timezone offsets from shifting dates 1 day behind
                    let current = new Date(res.fecha_inicio);
                    const end = new Date(res.fecha_fin);
                    
                    // Set both to noon local time to completely avoid midnight skipping bugs
                    current = new Date(current.getFullYear(), current.getMonth(), current.getDate(), 12, 0, 0);
                    const finalEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 12, 0, 0);

                    while (current <= finalEnd) {
                        const yyyy = current.getFullYear();
                        const mm = String(current.getMonth() + 1).padStart(2, '0');
                        const dd = String(current.getDate()).padStart(2, '0');
                        
                        blocked.push(`${yyyy}-${mm}-${dd}`);
                        current.setDate(current.getDate() + 1);
                    }
                }
            });
            setUnavailableDates(blocked);

            const reviewsData: any = await reviewsAPI.getByEmbarcacion(Number(id));
            setReviews(reviewsData);

            if (isAuthenticated && usuario) {
                const favs: any = await favoritosAPI.getByUsuario(usuario.id, token);
                const match = favs.find((f: any) => f.embarcacion_id === Number(id));
                if (match) {
                    setIsFavorite(true);
                    setFavoriteId(match.id);
                }
            }

        } catch (error) {
            console.error(error);
            toast.error('Error al cargar los detalles');
        } finally {
            setLoading(false);
        }
    };

    // Calendar helpers
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Shift so week starts on Monday (Mon=0...Sun=6)
    const startOffset = (firstDay + 6) % 7;

    const handleDayClick = (day: number) => {
        const currentDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (unavailableDates.includes(currentDateStr)) return;

        if (!selectedStart || (selectedStart && selectedEnd)) {
            setSelectedStart(day);
            setSelectedEnd(null);
            setBookingData(prev => ({ ...prev, fecha_inicio: currentDateStr, fecha_fin: '' }));
        } else {
            if (day < selectedStart) {
                // Determine if there are unavailable dates between day and selectedStart
                let valid = true;
                for(let i=day; i<=selectedStart; i++) {
                    const checkStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
                    if(unavailableDates.includes(checkStr)) valid = false;
                }
                if(!valid) {
                    toast.error('La selección incluye fechas no disponibles.');
                    return;
                }
                setSelectedEnd(selectedStart);
                setSelectedStart(day);
            } else {
                let valid = true;
                for(let i=selectedStart; i<=day; i++) {
                    const checkStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
                    if(unavailableDates.includes(checkStr)) valid = false;
                }
                if(!valid) {
                    toast.error('La selección incluye fechas no disponibles.');
                    return;
                }
                setSelectedEnd(day);
            }
            const s = `${year}-${String(month + 1).padStart(2, '0')}-${String(Math.min(day, selectedStart)).padStart(2, '0')}`;
            const e = `${year}-${String(month + 1).padStart(2, '0')}-${String(Math.max(day, selectedStart)).padStart(2, '0')}`;
            setBookingData(prev => ({ ...prev, fecha_inicio: s, fecha_fin: e }));
        }
    };

    const getDayState = (day: number): 'unavailable' | 'selected-start' | 'selected-end' | 'in-range' | 'available' | 'today' => {
        const checkStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (unavailableDates.includes(checkStr)) return 'unavailable';

        const todayDate = new Date();
        if (year === todayDate.getFullYear() && month === todayDate.getMonth() && day === todayDate.getDate()) return 'today';
        if (day === selectedStart && !selectedEnd) return 'selected-start';
        if (day === selectedStart && selectedEnd) return 'selected-start';
        if (selectedEnd && day === selectedEnd) return 'selected-end';
        if (selectedStart && selectedEnd && day > selectedStart && day < selectedEnd) return 'in-range';
        return 'available';
    };

    const toggleFavorite = async () => {
        if (!isAuthenticated || !usuario) {
            toast.error('Debes iniciar sesión para añadir a favoritos');
            navigate('/login');
            return;
        }
        try {
            const token = localStorage.getItem('token') || '';
            if (isFavorite && favoriteId) {
                await favoritosAPI.remove(favoriteId, token);
                setIsFavorite(false);
                setFavoriteId(null);
                toast.success('Eliminado de favoritos');
            } else {
                const res: any = await favoritosAPI.add({ usuario_id: usuario.id, embarcacion_id: Number(id) }, token);
                setIsFavorite(true);
                setFavoriteId(res.favorito.id);
                toast.success('Añadido a favoritos');
            }
        } catch (error: any) {
            toast.error(error.message || 'Error con favoritos');
        }
    };

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAuthenticated || !usuario) return;
        setIsSubmittingReview(true);
        try {
            const token = localStorage.getItem('token') || '';
            const res: any = await reviewsAPI.create({
                usuario_id: usuario.id,
                embarcacion_id: Number(id),
                ...newReview
            }, token);
            setReviews([res.review, ...reviews]);
            setNewReview({ rating: 5, comentario: '' });
            toast.success('Reseña publicada');
            loadEmbarcacion();
        } catch (error: any) {
            toast.error(error.message || 'Error al publicar reseña');
        } finally {
            setIsSubmittingReview(false);
        }
    };

    const calculateDuration = () => {
        if (!bookingData.fecha_inicio) return 0;
        if (!bookingData.fecha_fin) return 1; // Un solo día seleccionado
        const start = new Date(bookingData.fecha_inicio);
        const end = new Date(bookingData.fecha_fin);
        return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)));
    };

    const calculateHours = () => {
        if (!bookingData.hora_inicio || !bookingData.hora_fin) return 0;
        const [sh, sm] = bookingData.hora_inicio.split(':').map(Number);
        const [eh, em] = bookingData.hora_fin.split(':').map(Number);
        return Math.max(0, (eh * 60 + em - sh * 60 - sm) / 60);
    };

    const calculateTotal = () => {
        if (!embarcacion) return 0;
        if (bookingMode === 'horas') return calculateHours() * (embarcacion.precio_dia / 8);
        return calculateDuration() * embarcacion.precio_dia;
    };

    const handleBooking = () => {
        if (!isAuthenticated) {
            toast.error('Debes iniciar sesión para reservar');
            navigate('/login');
            return;
        }
        if (!bookingData.fecha_inicio) {
            toast.error('Por favor selecciona las fechas en el calendario');
            return;
        }
        setIsPaymentModalOpen(true);
    };

    const processBooking = async () => {
        setIsPaymentModalOpen(false);
        try {
            const token = localStorage.getItem('token') || '';
            const payload = bookingMode === 'horas'
                ? { ...bookingData, fecha_fin: bookingData.fecha_inicio }
                : { ...bookingData, fecha_fin: bookingData.fecha_fin || bookingData.fecha_inicio }; // Si no hay fecha fin, usar inicio (1 día)

            await reservasAPI.create({
                usuario_id: usuario?.id,
                embarcacion_id: embarcacion?.id,
                precio_total: total,
                ...payload,
            }, token);
            toast.success('Reserva creada exitosamente');
            navigate('/my-bookings');
        } catch (error: any) {
            toast.error(error.message || 'Error al crear la reserva');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!embarcacion) {
        return (
            <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-white text-2xl mb-4">{t('vessel_not_found')}</h2>
                    <button onClick={() => navigate('/')} className="btn btn-primary">{t('back_to_home')}</button>
                </div>
            </div>
        );
    }

    const duration = calculateDuration();
    const hours = calculateHours();
    const total = calculateTotal();

    return (
        <div className="min-h-screen bg-[#0a1628]">
            <Navbar />

            {/* Hero */}
            <div className="relative h-[60vh] mt-20">
                <img
                    src={embarcacion.imagen_url || 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=1920'}
                    alt={embarcacion.nombre}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628] to-transparent" />
                <div className="absolute top-8 left-8 flex gap-3">
                    {embarcacion.incluye_capitan && <span className="badge badge-gold">{t('with_captain')}</span>}
                    {embarcacion.incluye_tripulacion && <span className="badge badge-blue">{t('crew_included')}</span>}
                    <span className={`badge ${embarcacion.estado === 'disponible' ? 'badge-green' : 'badge-orange'}`}>
                        {embarcacion.estado === 'disponible' ? t('available_status') : t('not_available')}
                    </span>
                </div>
            </div>

            <div className="container mx-auto px-6 -mt-32 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        <div className="glass-effect rounded-2xl p-8 mb-8">
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <div className="flex items-center gap-4 mb-2">
                                        <h1 className="text-4xl font-bold text-white">{embarcacion.nombre}</h1>
                                        <button onClick={toggleFavorite} className="text-[#d4af37] hover:scale-110 transition-transform">
                                            <svg className="w-8 h-8" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                            </svg>
                                        </button>
                                    </div>
                                    {embarcacion.propietario_nombre && (
                                        <p className="text-[#d4af37] text-sm font-semibold mb-3 flex items-center gap-1">
                                            <span className="material-icons text-sm">verified</span> Propietario: {embarcacion.propietario_nombre}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-4 text-white/60">
                                        <span className="flex items-center gap-2">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            </svg>
                                            {embarcacion.ubicacion}
                                        </span>
                                        <span>•</span>
                                        <span>{embarcacion.longitud}m</span>
                                        <span>•</span>
                                        <span>{embarcacion.capacidad} {t('guests')}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <svg className="w-6 h-6 text-[#d4af37]" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                    <span className="text-white text-xl font-bold">{embarcacion.rating > 0 ? embarcacion.rating.toFixed(1) : 'Nuevo'}</span>
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
                                    <div className="w-12 h-12 bg-[#d4af37]/20 rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-[#d4af37]" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v-2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0 1.26.65 2.62.99 4 .99h2v2h-2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-white font-semibold">
                                            {embarcacion.tipo === 'yacht' ? t('type_yacht') :
                                                embarcacion.tipo === 'sailboat' ? t('type_sailboat') : t('type_watercraft')}
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
                                <div className="border-l-4 border-[#d4af37] pl-4">
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

                        {/* ===== REVIEWS ===== */}
                        <div className="glass-effect rounded-2xl p-8 mt-8">
                            <h3 className="text-2xl font-bold text-white mb-6">Reseñas y Valoraciones</h3>
                            
                            {/* Lista de reviews */}
                            <div className="space-y-4 mb-8">
                                {reviews.length === 0 ? (
                                    <p className="text-white/60">Aún no hay reseñas para esta embarcación.</p>
                                ) : (
                                    reviews.map((rev) => (
                                        <div key={rev.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-white font-medium">{rev.usuario_nombre || 'Usuario'}</span>
                                                <div className="flex items-center text-[#d4af37]">
                                                    <span className="text-sm mr-1">{rev.rating}/5</span>
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                                </div>
                                            </div>
                                            <p className="text-white/80 text-sm">{rev.comentario}</p>
                                            <span className="text-white/40 text-xs mt-2 block">{new Date(rev.fecha_creacion).toLocaleDateString()}</span>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Formulario de review */}
                            {isAuthenticated ? (
                                <form onSubmit={handleSubmitReview} className="bg-white/5 rounded-xl p-6 border border-white/10">
                                    <h4 className="text-white font-medium mb-4">Deja tu valoración</h4>
                                    <div className="mb-4">
                                        <label className="text-white/60 text-sm mb-2 block">Puntuación</label>
                                        <div className="flex gap-2">
                                            {[1,2,3,4,5].map(num => (
                                                <button
                                                    key={num}
                                                    type="button"
                                                    onClick={() => setNewReview({...newReview, rating: num})}
                                                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors ${newReview.rating >= num ? 'bg-[#d4af37] text-[#0a1628]' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
                                                >
                                                    {num}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        <label className="text-white/60 text-sm mb-2 block">Comentario</label>
                                        <textarea
                                            value={newReview.comentario}
                                            onChange={e => setNewReview({...newReview, comentario: e.target.value})}
                                            className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-white/40 focus:border-[#d4af37] focus:outline-none"
                                            rows={3}
                                            required
                                            placeholder="¿Qué te pareció la experiencia?"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isSubmittingReview}
                                        className="bg-[#d4af37] text-[#0a1628] font-bold py-2 px-6 rounded-lg hover:bg-[#f4d03f] transition-colors disabled:opacity-50"
                                    >
                                        {isSubmittingReview ? 'Publicando...' : 'Publicar'}
                                    </button>
                                </form>
                            ) : (
                                <p className="text-white/60 text-sm">Debes iniciar sesión para dejar una reseña.</p>
                            )}
                        </div>
                    </div>

                    {/* ===== BOOKING CARD ===== */}
                    <div className="lg:col-span-1">
                        <div className="glass-effect rounded-2xl p-6 sticky top-24 border border-white/10">
                            {/* Price */}
                            <div className="mb-5">
                                <p className="text-white/50 text-xs uppercase mb-1">{t('price_from')}</p>
                                <p className="text-blue-400 text-3xl font-bold">
                                    ${embarcacion.precio_dia.toLocaleString()}
                                    <span className="text-base text-white/50 font-normal">/{t('per_day')}</span>
                                </p>
                                <p className="text-white/40 text-xs mt-1">≈ ${Math.round(embarcacion.precio_dia / 8).toLocaleString()}/hora</p>
                            </div>

                            {/* Mode toggle */}
                            <div className="flex rounded-xl overflow-hidden border border-white/15 mb-5">
                                {(['dias', 'horas'] as BookingMode[]).map(mode => (
                                    <button
                                        key={mode}
                                        onClick={() => setBookingMode(mode)}
                                        className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${bookingMode === mode
                                            ? 'bg-[#d4af37] text-[#0a1628]'
                                            : 'text-white/60 hover:text-white'
                                        }`}
                                    >
                                        {mode === 'dias' ? '📅 Por Días' : '⏱️ Por Horas'}
                                    </button>
                                ))}
                            </div>

                            {/* ===== CALENDAR ===== */}
                            <div className="mb-5">
                                {/* Calendar header */}
                                <div className="flex items-center justify-between mb-3">
                                    <button
                                        onClick={() => setCalendarDate(new Date(year, month - 1))}
                                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                                    >
                                        ‹
                                    </button>
                                    <span className="text-white font-semibold text-sm">
                                        {MONTHS[month]} {year}
                                    </span>
                                    <button
                                        onClick={() => setCalendarDate(new Date(year, month + 1))}
                                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                                    >
                                        ›
                                    </button>
                                </div>

                                {/* Weekday headers */}
                                <div className="grid grid-cols-7 mb-1">
                                    {WEEKDAYS.map(d => (
                                        <div key={d} className="text-center text-white/30 text-xs font-medium py-1">{d}</div>
                                    ))}
                                </div>

                                {/* Days grid */}
                                <div className="grid grid-cols-7 gap-0.5">
                                    {/* Empty cells for offset */}
                                    {Array.from({ length: startOffset }).map((_, i) => (
                                        <div key={`e-${i}`} />
                                    ))}
                                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                                        const state = getDayState(day);
                                        return (
                                            <button
                                                key={day}
                                                onClick={() => handleDayClick(day)}
                                                disabled={state === 'unavailable'}
                                                className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all
                                                    ${state === 'unavailable'
                                                        ? 'bg-red-500/10 text-red-400/50 cursor-not-allowed line-through'
                                                        : state === 'selected-start' || state === 'selected-end'
                                                            ? 'bg-[#d4af37] text-[#0a1628] font-bold shadow-lg shadow-[#d4af37]/30'
                                                            : state === 'in-range'
                                                                ? 'bg-[#d4af37]/20 text-[#d4af37]'
                                                                : state === 'today'
                                                                    ? 'ring-1 ring-blue-400 text-blue-300'
                                                                    : 'text-white/80 hover:bg-white/10'
                                                    }
                                                `}
                                            >
                                                {day}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Legend */}
                                <div className="flex items-center gap-3 mt-2 flex-wrap">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-[#d4af37]" />
                                        <span className="text-white/40 text-xs">Seleccionado</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-red-500/30" />
                                        <span className="text-white/40 text-xs">No disponible</span>
                                    </div>
                                </div>
                            </div>

                            {/* Hour selector (only in 'horas' mode) */}
                            {bookingMode === 'horas' && (
                                <div className="grid grid-cols-2 gap-3 mb-5">
                                    <div>
                                        <label className="text-white/50 text-xs uppercase mb-1 block">Hora inicio</label>
                                        <input
                                            type="time"
                                            value={bookingData.hora_inicio}
                                            onChange={e => setBookingData(prev => ({ ...prev, hora_inicio: e.target.value }))}
                                            className="w-full bg-white/10 border border-white/15 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#d4af37] scheme-dark"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-white/50 text-xs uppercase mb-1 block">Hora fin</label>
                                        <input
                                            type="time"
                                            value={bookingData.hora_fin}
                                            onChange={e => setBookingData(prev => ({ ...prev, hora_fin: e.target.value }))}
                                            className="w-full bg-white/10 border border-white/15 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#d4af37] scheme-dark"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Selected dates display */}
                            {bookingData.fecha_inicio && (
                                <div className="bg-white/5 rounded-xl p-3 mb-5 border border-white/10">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-white/50">Inicio</span>
                                        <span className="text-white font-medium">{bookingData.fecha_inicio}</span>
                                    </div>
                                    {bookingMode === 'dias' && bookingData.fecha_fin && (
                                        <div className="flex justify-between text-sm mt-1">
                                            <span className="text-white/50">Fin</span>
                                            <span className="text-white font-medium">{bookingData.fecha_fin}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Event type */}
                            <div className="mb-5">
                                <label className="text-white/50 text-xs uppercase mb-1 block">{t('event_type')}</label>
                                <CustomSelect
                                    value={bookingData.tipo_evento}
                                    onChange={(value) => setBookingData({ ...bookingData, tipo_evento: value })}
                                    options={[
                                        { value: '', label: t('select_type') },
                                        { value: 'leisure', label: t('leisure') },
                                        { value: 'wedding', label: t('wedding') },
                                        { value: 'corporate', label: t('corporate') },
                                        { value: 'other', label: t('other') }
                                    ]}
                                    className="w-full text-sm"
                                />
                            </div>

                            {/* Notes */}
                            <div className="mb-5">
                                <label className="text-white/50 text-xs uppercase mb-1 block">{t('notes_label')}</label>
                                <textarea
                                    value={bookingData.notas}
                                    onChange={e => setBookingData({ ...bookingData, notas: e.target.value })}
                                    className="w-full bg-white/10 border border-white/15 rounded-lg px-3 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-[#d4af37] resize-none"
                                    rows={2}
                                    placeholder={t('notes_placeholder')}
                                />
                            </div>

                            {/* Price summary */}
                            {((bookingMode === 'dias' && duration > 0) || (bookingMode === 'horas' && hours > 0)) && (
                                <div className="mb-5 p-4 bg-[#d4af37]/10 rounded-xl border border-[#d4af37]/20">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-white/60">
                                            {bookingMode === 'dias'
                                                ? `$${embarcacion.precio_dia.toLocaleString()} × ${duration} día${duration > 1 ? 's' : ''}`
                                                : `${hours}h × $${Math.round(embarcacion.precio_dia / 8).toLocaleString()}/h`
                                            }
                                        </span>
                                        <span className="text-white">${total.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between pt-2 border-t border-white/10">
                                        <span className="text-white font-bold">{t('total')}</span>
                                        <span className="text-[#d4af37] text-lg font-bold">${total.toLocaleString()}</span>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleBooking}
                                disabled={embarcacion.estado !== 'disponible'}
                                className="w-full py-3 bg-[#d4af37] text-[#0a1628] rounded-xl font-bold text-sm hover:bg-[#f4d03f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {embarcacion.estado === 'disponible' ? t('request_booking') : t('not_available')}
                            </button>
                            <p className="text-white/30 text-xs text-center mt-3">{t('no_charge_msg')}</p>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
            {embarcacion && (
                <PaymentModal
                    isOpen={isPaymentModalOpen}
                    onClose={() => setIsPaymentModalOpen(false)}
                    onSuccess={processBooking}
                    amount={total}
                    description={`Reserva de ${embarcacion.nombre}`}
                />
            )}
        </div>
    );
};

export default VesselDetail;
