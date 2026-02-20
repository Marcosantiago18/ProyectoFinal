import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contex/LanguageContext';

const Hero: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [location, setLocation] = useState('');
    const [date, setDate] = useState('');
    const [type, setType] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (location) params.append('ubicacion', location);
        if (type) params.append('tipo', type);
        // Date handling can be added here if backend supports 'date' or we split it
        if (date) params.append('fecha_inicio', date);
        navigate(`/search?${params.toString()}`);
    };

    return (
        <div className="relative w-full h-screen overflow-hidden">
            {/* Video Background */}
            <div className="absolute inset-0 w-full h-full">
                <img
                    alt="Luxury yacht cruising on dark blue ocean at sunset"
                    className="object-cover w-full h-full brightness-50"
                    src="https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?q=80&w=2070&auto=format&fit=crop"
                />
                <div className="absolute inset-0 bg-linear-to-b from-navy-deep/60 via-navy-deep/20 to-background-dark"></div>
            </div>

            {/* Hero Content & Search Widget */}
            <div className="relative z-20 flex flex-col justify-center items-center h-full px-4 text-center pt-20">
                <span className="text-gold-accent uppercase tracking-[0.2em] text-sm mb-4 font-semibold animate-bounce">{t('hero_welcome')}</span>
                <h1 className="text-5xl md:text-7xl font-light text-white mb-12 tracking-tight">
                    {t('hero_title_part1')} <span className="font-serif italic text-gold-light">{t('hero_title_part2')}</span>
                </h1>

                {/* Search Widget */}
                <div className="w-full max-w-5xl bg-navy-deep/60 backdrop-blur-md border border-white/20 rounded-full p-2 gold-border-glow transition-all duration-300">
                    <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-center w-full">
                        {/* Location */}
                        <div className="relative flex-1 w-full px-6 py-3 border-b md:border-b-0 md:border-r border-white/10 group">
                            <label className="block text-xs uppercase text-slate-400 font-semibold mb-1 ml-8 text-left">{t('search_location')}</label>
                            <div className="flex items-center">
                                <span className="material-icons text-gold-accent mr-3">place</span>
                                <input
                                    className="w-full bg-transparent border-none text-white placeholder-slate-300 focus:ring-0 p-0 text-lg font-medium outline-none"
                                    placeholder={t('search_placeholder_location')}
                                    type="text"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Date */}
                        <div className="relative flex-1 w-full px-6 py-3 border-b md:border-b-0 md:border-r border-white/10">
                            <label className="block text-xs uppercase text-slate-400 font-semibold mb-1 ml-8 text-left">{t('search_dates')}</label>
                            <div className="flex items-center">
                                <span className="material-icons text-gold-accent mr-3">calendar_today</span>
                                <input
                                    className="w-full bg-transparent border-none text-white placeholder-slate-300 focus:ring-0 p-0 text-lg font-medium outline-none"
                                    placeholder={t('search_placeholder_dates')}
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Boat Type */}
                        <div className="relative flex-1 w-full px-6 py-3">
                            <label className="block text-xs uppercase text-slate-400 font-semibold mb-1 ml-8 text-left">{t('search_vessel')}</label>
                            <div className="flex items-center">
                                <span className="material-icons text-gold-accent mr-3">directions_boat</span>
                                <select
                                    className="w-full bg-transparent border-none text-white focus:ring-0 p-0 text-lg font-medium cursor-pointer outline-none"
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                >
                                    <option className="text-black" value="">{t('search_any_type')}</option>
                                    <option className="text-black" value="yacht">{t('search_super_yacht')}</option>
                                    <option className="text-black" value="catamaran">{t('search_catamaran')}</option>
                                    <option className="text-black" value="sailboat">{t('search_sailboat')}</option>
                                </select>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="p-2 w-full md:w-auto">
                            <button
                                type="submit"
                                className="w-full md:w-16 md:h-16 rounded-full bg-primary hover:bg-primary-dark text-white flex items-center justify-center shadow-lg shadow-primary/30 transition-all hover:scale-105"
                            >
                                <span className="material-icons text-2xl">search</span>
                            </button>
                        </div>
                    </form>
                </div>

                {/* Quick links below search */}
                <div className="mt-8 flex gap-4 text-sm text-slate-300">
                    <span>{t('popular')}</span>
                    <button onClick={() => navigate('/search?ubicacion=French Riviera')} className="hover:text-gold-accent transition-colors underline decoration-dotted underline-offset-4">French Riviera</button>
                    <button onClick={() => navigate('/search?ubicacion=Mykonos')} className="hover:text-gold-accent transition-colors underline decoration-dotted underline-offset-4">Mykonos</button>
                    <button onClick={() => navigate('/search?ubicacion=Caribbean')} className="hover:text-gold-accent transition-colors underline decoration-dotted underline-offset-4">Caribbean</button>
                </div>
            </div>

            {/* Scroll Indicator */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white animate-bounce">
                <span className="material-icons">keyboard_arrow_down</span>
            </div>
        </div>
    );
};

export default Hero;
