import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { Embarcacion } from '../types';
import { embarcacionesAPI } from '../utils/api';
import Navbar from '../components/shared/Navbar';
import Footer from '../components/shared/Footer';
import CustomSelect from '../components/shared/CustomSelect';
import { useLanguage } from '../contex/LanguageContext';

const SearchResults: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { t } = useLanguage();
    const [embarcaciones, setEmbarcaciones] = useState<Embarcacion[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        ubicacion: searchParams.get('ubicacion') || '',
        tipo: searchParams.get('tipo') || '',
        precioMin: '',
        precioMax: '',
        capacidadMin: '',
    });

    useEffect(() => {
        setFilters(prev => ({
            ...prev,
            ubicacion: searchParams.get('ubicacion') || '',
            tipo: searchParams.get('tipo') || ''
        }));
    }, [searchParams]);

    useEffect(() => {
        loadEmbarcaciones();
    }, [filters]);

    const loadEmbarcaciones = async () => {
        try {
            setLoading(true);
            const params: any = { estado: 'disponible' };

            if (filters.ubicacion) params.ubicacion = filters.ubicacion;
            if (filters.tipo) params.tipo = filters.tipo;

            const data: any = await embarcacionesAPI.getAll(params);

            let filtered = data;

            if (filters.precioMin) {
                filtered = filtered.filter((e: Embarcacion) => e.precio_dia >= parseFloat(filters.precioMin));
            }
            if (filters.precioMax) {
                filtered = filtered.filter((e: Embarcacion) => e.precio_dia <= parseFloat(filters.precioMax));
            }
            if (filters.capacidadMin) {
                filtered = filtered.filter((e: Embarcacion) => e.capacidad >= parseInt(filters.capacidadMin));
            }

            setEmbarcaciones(filtered);
        } catch (error) {
            console.error('Error cargando embarcaciones:', error);
            setEmbarcaciones([]);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key: string, value: string) => {
        setFilters({ ...filters, [key]: value });
    };

    return (
        <>
            <Navbar />

            <main className="flex-1 pt-20">
                <div className="container mx-auto px-6 py-12">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-white mb-2">{t('search_results_title')}</h1>
                        <p className="text-white/60">
                            {embarcaciones.length} {t('vessels_found')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Filters Sidebar */}
                        <div className="lg:col-span-1">
                            <div className="glass-effect rounded-2xl p-6 sticky top-24">
                                <h2 className="text-xl font-semibold text-white mb-6">{t('filters_title')}</h2>

                                {/* Location */}
                                <div className="mb-6">
                                    <label className="block text-white/80 text-sm mb-2">{t('location_label')}</label>
                                    <input
                                        type="text"
                                        value={filters.ubicacion}
                                        onChange={(e) => handleFilterChange('ubicacion', e.target.value)}
                                        placeholder={t('enter_location_placeholder')}
                                        className="input"
                                    />
                                </div>

                                {/* Vessel Type */}
                                <div className="mb-6">
                                    <label className="block text-white/80 text-sm mb-2">{t('vessel_type_label')}</label>
                                    <CustomSelect
                                        value={filters.tipo}
                                        onChange={(value) => handleFilterChange('tipo', value)}
                                        options={[
                                            { value: '', label: t('all_types') },
                                            { value: 'yacht', label: 'Yacht' },
                                            { value: 'sailboat', label: 'Sailboat' },
                                            { value: 'watercraft', label: 'Watercraft' }
                                        ]}
                                        className="w-full text-sm z-50"
                                    />
                                </div>

                                {/* Price Range */}
                                <div className="mb-6">
                                    <label className="block text-white/80 text-sm mb-2">{t('price_range_label')}</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input
                                            type="number"
                                            value={filters.precioMin}
                                            onChange={(e) => handleFilterChange('precioMin', e.target.value)}
                                            placeholder={t('min_price_placeholder')}
                                            className="input"
                                        />
                                        <input
                                            type="number"
                                            value={filters.precioMax}
                                            onChange={(e) => handleFilterChange('precioMax', e.target.value)}
                                            placeholder={t('max_price_placeholder')}
                                            className="input"
                                        />
                                    </div>
                                </div>

                                {/* Capacity */}
                                <div className="mb-6">
                                    <label className="block text-white/80 text-sm mb-2">{t('min_capacity_label')}</label>
                                    <input
                                        type="number"
                                        value={filters.capacidadMin}
                                        onChange={(e) => handleFilterChange('capacidadMin', e.target.value)}
                                        placeholder={t('guests_placeholder')}
                                        className="input"
                                    />
                                </div>

                                {/* Reset Button */}
                                <button
                                    onClick={() => setFilters({ ubicacion: '', tipo: '', precioMin: '', precioMax: '', capacidadMin: '' })}
                                    className="w-full btn btn-secondary"
                                >
                                    {t('reset_filters')}
                                </button>
                            </div>
                        </div>

                        {/* Results Grid */}
                        <div className="lg:col-span-3">
                            {loading ? (
                                <div className="flex items-center justify-center py-20">
                                    <div className="w-12 h-12 border-4 border-[#4a90e2] border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : embarcaciones.length === 0 ? (
                                <div className="text-center py-20">
                                    <svg className="w-16 h-16 text-white/40 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <h3 className="text-xl font-semibold text-white mb-2">{t('no_vessels_found')}</h3>
                                    <p className="text-white/60 mb-6">{t('adjust_filters_msg')}</p>
                                    <button
                                        onClick={() => setFilters({ ubicacion: '', tipo: '', precioMin: '', precioMax: '', capacidadMin: '' })}
                                        className="btn btn-primary"
                                    >
                                        {t('clear_filters')}
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {embarcaciones.map((embarcacion) => (
                                        <div
                                            key={embarcacion.id}
                                            onClick={() => navigate(`/vessel/${embarcacion.id}`)}
                                            className="card-premium rounded-2xl overflow-hidden card-hover cursor-pointer"
                                        >
                                            {/* Image */}
                                            <div className="relative h-56 overflow-hidden">
                                                <img
                                                    src={embarcacion.imagen_url || 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800'}
                                                    alt={embarcacion.nombre}
                                                    className="w-full h-full object-cover"
                                                />
                                                {embarcacion.incluye_capitan && (
                                                    <div className="absolute top-4 left-4">
                                                        <span className="badge badge-gold">{t('with_captain')}</span>
                                                    </div>
                                                )}
                                                {embarcacion.incluye_tripulacion && (
                                                    <div className="absolute top-4 right-4">
                                                        <span className="badge badge-blue">{t('crew_included')}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="p-6">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div>
                                                        <h3 className="text-xl font-bold text-white mb-1">{embarcacion.nombre}</h3>
                                                        {embarcacion.propietario_nombre && (
                                                            <p className="text-[#d4af37] text-xs font-semibold mb-1 flex items-center gap-1">
                                                                <span className="material-icons text-[12px]">verified_user</span>
                                                                {embarcacion.propietario_nombre}
                                                            </p>
                                                        )}
                                                        <p className="text-white/60 text-sm">
                                                            {embarcacion.longitud}m • {embarcacion.capacidad} {t('guests')}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <svg className="w-5 h-5 text-[#d4af37]" fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                        </svg>
                                                        <span className="text-white font-semibold">{embarcacion.rating > 0 ? embarcacion.rating.toFixed(1) : 'Nuevo'}</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                                                    <div>
                                                        <p className="text-white/60 text-xs uppercase mb-1">{t('from_label')}</p>
                                                        <p className="text-[#4a90e2] text-2xl font-bold">
                                                            ${embarcacion.precio_dia.toLocaleString()}
                                                            <span className="text-sm text-white/60 font-normal">/ {t('per_day')}</span>
                                                        </p>
                                                    </div>
                                                    <button className="px-6 py-2.5 bg-gradient-to-r from-[#4a90e2] to-[#00d4ff] text-white rounded-lg font-semibold hover:shadow-lg transition-all">
                                                        {t('view_details_button')}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </>
    );
};

export default SearchResults;
