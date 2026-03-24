import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Embarcacion } from '../../types';
import { useLanguage } from '../../contex/LanguageContext';

interface FeaturedFleetProps {
    embarcaciones: Embarcacion[];
    loading: boolean;
}

const FeaturedFleet: React.FC<FeaturedFleetProps> = ({ embarcaciones, loading }) => {
    const navigate = useNavigate();
    const { t } = useLanguage();

    return (
        <section className="py-20 px-6 relative bg-background-light dark:bg-background-dark">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12">
                    <div>
                        <h2 className="text-gold-accent font-semibold tracking-widest text-sm uppercase mb-2">{t('exclusive_selection')}</h2>
                        <h3 className="text-3xl md:text-4xl font-light text-slate-900 dark:text-white">{t('featured_fleet_title')}</h3>
                    </div>
                    <button
                        onClick={() => navigate('/search')}
                        className="group flex items-center gap-2 text-primary hover:text-gold-accent transition-colors mt-4 md:mt-0"
                    >
                        <span className="font-medium">{t('view_all_vessels')}</span>
                        <span className="material-icons text-sm transform group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </button>
                </div>

                {/* Cards Grid */}
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-accent"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {embarcaciones.map((boat) => (
                            <div key={boat.id} className="group relative rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xl hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300">
                                <div className="relative h-64 overflow-hidden">
                                    <img
                                        alt={boat.nombre}
                                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                                        src={boat.imagen_url || "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800"} // Fallback image
                                    />

                                    {/* Badge Logic */}
                                    {boat.incluye_capitan ? (
                                        <div className="absolute top-4 left-4 bg-navy-deep/80 backdrop-blur text-gold-accent text-xs font-bold px-3 py-1 rounded border border-gold-accent/30">
                                            {t('with_captain')}
                                        </div>
                                    ) : boat.incluye_tripulacion ? (
                                        <div className="absolute top-4 left-4 bg-navy-deep/80 backdrop-blur text-gold-accent text-xs font-bold px-3 py-1 rounded border border-gold-accent/30">
                                            {t('crew_included')}
                                        </div>
                                    ) : (
                                        <div className="absolute top-4 left-4 bg-primary/80 backdrop-blur text-white text-xs font-bold px-3 py-1 rounded">
                                            {t('self_drive')}
                                        </div>
                                    )}

                                    <button className="absolute top-4 right-4 bg-white/10 hover:bg-white/30 p-2 rounded-full backdrop-blur-sm transition-colors text-white">
                                        <span className="material-icons text-base">favorite_border</span>
                                    </button>
                                </div>
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="text-xl font-medium text-slate-900 dark:text-white mb-1">{boat.nombre}</h4>
                                            {boat.propietario_nombre && (
                                                <p className="text-xs text-gold-accent font-semibold mb-2 flex items-center gap-1">
                                                    <span className="material-icons text-[12px]">verified_user</span> 
                                                    {boat.propietario_nombre}
                                                </p>
                                            )}
                                            <div className="flex items-center text-slate-500 text-sm gap-3">
                                                <span className="flex items-center gap-1"><span className="material-icons text-xs">straighten</span> {boat.longitud} m</span>
                                                <span className="flex items-center gap-1"><span className="material-icons text-xs">people</span> {boat.capacidad} {t('guests')}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 text-gold-accent text-sm font-bold">
                                            <span className="material-icons text-base">star</span> {boat.rating > 0 ? boat.rating.toFixed(1) : 'Nuevo'}
                                        </div>
                                    </div>
                                    <div className="border-t border-slate-200 dark:border-slate-800 my-4"></div>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase font-semibold">{t('from')}</p>
                                            <p className="text-lg font-bold text-primary">${boat.precio_dia.toLocaleString()} <span className="text-sm font-normal text-slate-500">/ {t('per_day')}</span></p>
                                        </div>
                                        <button
                                            onClick={() => navigate(`/vessel/${boat.id}`)}
                                            className="px-4 py-2 bg-transparent border border-primary text-primary hover:bg-primary hover:text-white rounded-lg text-sm font-medium transition-colors"
                                        >
                                            {t('details')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default FeaturedFleet;
