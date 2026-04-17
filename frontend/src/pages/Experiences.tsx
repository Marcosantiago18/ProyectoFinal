import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/shared/Navbar';
import Footer from '../components/shared/Footer';
import PaymentModal from '../components/shared/PaymentModal';
import { useAuth } from '../contex/AuthContext';
import { experienciasAPI } from '../utils/api';
import type { Experiencia } from '../types';
import { formatCurrency } from '../utils/formatting';
import { toast } from 'sonner';

// La lista estática ha sido eliminada para usar la API backend.

const Experiences: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated, usuario } = useAuth();
    const [experiences, setExperiences] = useState<Experiencia[]>([]);
    const [loading, setLoading] = useState(true);
    const [bookingInProgress, setBookingInProgress] = useState<number | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [experienceToBook, setExperienceToBook] = useState<Experiencia | null>(null);

    useEffect(() => {
        loadExperiences();
    }, []);

    const loadExperiences = async () => {
        try {
            setLoading(true);
            const data: any = await experienciasAPI.getAll();
            setExperiences(data || []);
        } catch (error) {
            console.error('Error al cargar experiencias:', error);
            toast.error('No se pudieron cargar las experiencias');
        } finally {
            setLoading(false);
        }
    };

    const handleDirectBooking = (exp: Experiencia) => {
        if (!isAuthenticated || !usuario) {
            toast.error('Debes iniciar sesión para contratar una experiencia');
            navigate('/login');
            return;
        }

        setExperienceToBook(exp);
        setIsPaymentModalOpen(true);
    };

    const processDirectBooking = async () => {
        if (!experienceToBook || !usuario) return;

        try {
            setBookingInProgress(experienceToBook.id);
            const token = localStorage.getItem('token') || '';
            await experienciasAPI.bookIndependent({
                usuario_id: usuario.id,
                experiencia_id: experienceToBook.id
            }, token);
            
            toast.success('¡Pago confirmado y experiencia contratada con éxito!');
            navigate('/my-bookings');
        } catch (error: any) {
            toast.error(error.message || 'Error al contratar la experiencia');
        } finally {
            setBookingInProgress(null);
            setIsPaymentModalOpen(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a1628] flex flex-col">
            <Navbar />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 overflow-hidden">
                {/* Background gradient orbs */}
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-20 right-1/4 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
                    <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 mb-6">
                        <span className="text-2xl">⛵</span>
                        <span className="text-white/70 text-sm font-medium tracking-wider uppercase">Experiencias Únicas</span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
                        Vive el{' '}
                        <span className="bg-gradient-to-r from-[#d4af37] via-[#f4d03f] to-[#d4af37] bg-clip-text text-transparent">
                            Mediterráneo
                        </span>
                        <br />como nunca antes
                    </h1>
                    <p className="text-white/60 text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
                        Desde avistamiento de delfines hasta deportes acuáticos de alta adrenalina. 
                        Cada experiencia está diseñada para crear recuerdos imposibles de olvidar.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/50">
                        {['⭐ +500 valoraciones 5 estrellas', '🛡️ Seguros incluidos', '👨‍✈️ Guías certificados', '🌊 Desde 65€/persona'].map((item, i) => (
                            <span key={i} className="flex items-center gap-1">{item}</span>
                        ))}
                    </div>
                </div>
            </section>

            {/* Experiences Grid */}
            <section className="max-w-7xl mx-auto px-6 pb-24 flex-1">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-12 h-12 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {experiences.map((exp, i) => (
                            <div
                                key={exp.id}
                                className="group relative bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:border-[#d4af37]/40 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(212,175,55,0.15)]"
                                style={{ animationDelay: `${i * 100}ms` }}
                            >
                                {/* Gradient overlay */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${exp.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                                <div className="relative z-10 p-8 flex flex-col h-full">
                                    {/* Emoji badge */}
                                    <div className="text-5xl mb-5">{exp.emoji}</div>

                                    {/* Title */}
                                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-[#f4d03f] transition-colors">
                                        {exp.titulo}
                                    </h3>
                                    <p className="text-[#d4af37] text-sm font-medium mb-4">{exp.subtitulo}</p>

                                    {/* Description */}
                                    <p className="text-white/60 text-sm leading-relaxed mb-6 flex-1">{exp.descripcion}</p>

                                    {/* Highlights */}
                                    <ul className="space-y-2 mb-6">
                                        {(exp.highlights || []).map((h, hi) => (
                                            <li key={hi} className="flex items-center gap-2 text-sm text-white/70">
                                                <svg className="w-4 h-4 text-[#d4af37] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                {h}
                                            </li>
                                        ))}
                                    </ul>

                                    {/* Meta info */}
                                    <div className="flex items-center gap-4 mb-6 text-xs text-white/50 border-t border-white/10 pt-4">
                                        <span className="flex items-center gap-1">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {exp.duracion}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            {exp.capacidad}
                                        </span>
                                    </div>

                                    {/* Price + CTA */}
                                    <div className="flex items-center justify-between mt-auto">
                                        <span className="text-[#d4af37] font-bold text-lg">{formatCurrency(exp.precio)}</span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => navigate(`/search?tipo=${(exp.tipo_barco_compatible || [])[0]}`)}
                                                className="border border-[#d4af37] text-[#d4af37] px-4 py-2 rounded-full text-xs font-bold hover:bg-[#d4af37] hover:text-[#0a1628] transition-all"
                                            >
                                                Con Barco
                                            </button>
                                            <button
                                                onClick={() => handleDirectBooking(exp)}
                                                disabled={bookingInProgress === exp.id}
                                                className="bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-[#0a1628] px-4 py-2 rounded-full text-xs font-bold hover:from-[#f4d03f] hover:to-[#d4af37] transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
                                            >
                                                {bookingInProgress === exp.id ? '...' : 'Contratar'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* CTA Banner */}
            <section className="bg-gradient-to-r from-[#1a2942] to-[#0a1628] border-t border-white/10 py-16">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-3xl font-bold text-white mb-4">¿Buscas una experiencia personalizada?</h2>
                    <p className="text-white/60 mb-8">Nuestro equipo está disponible para diseñar la aventura perfecta para tu grupo, empresa o celebración especial.</p>
                    <button
                        onClick={() => navigate('/search')}
                        className="bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-[#0a1628] px-10 py-4 rounded-full font-bold text-lg hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all"
                    >
                        Ver toda la flota disponible
                    </button>
                </div>
            </section>

            <Footer />

            {experienceToBook && (
                <PaymentModal
                    isOpen={isPaymentModalOpen}
                    onClose={() => setIsPaymentModalOpen(false)}
                    onSuccess={processDirectBooking}
                    amount={experienceToBook.precio}
                    description={`Contratación de ${experienceToBook.titulo}`}
                />
            )}
        </div>
    );
};

export default Experiences;
