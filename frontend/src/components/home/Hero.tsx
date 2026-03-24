import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contex/LanguageContext';

const Hero: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [location, setLocation] = useState('');
    const [date, setDate] = useState('');
    const [type, setType] = useState('');
    
    // Calendar State
    const [showCalendar, setShowCalendar] = useState(false);
    const [calendarMonth, setCalendarMonth] = useState(new Date());
    const calendarRef = useRef<HTMLDivElement>(null);

    // Click outside handler for Calendar and Dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
                setShowCalendar(false);
            }
            const dropdown = document.getElementById('custom-dropdown');
            const dropdownTrigger = document.getElementById('dropdown-trigger');
            if (dropdown && dropdownTrigger && !dropdown.contains(event.target as Node) && !dropdownTrigger.contains(event.target as Node)) {
                dropdown.classList.add('hidden');
                dropdown.classList.remove('flex');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
        <div className="relative w-full h-screen overflow-x-hidden">
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
            <div className="relative z-20 flex flex-col justify-center items-center h-full px-4 text-center pt-20 pb-40">
                <span className="text-gold-accent uppercase tracking-[0.2em] text-sm mb-4 font-semibold animate-bounce">{t('hero_welcome')}</span>
                <h1 className="text-5xl md:text-7xl font-light text-white mb-12 tracking-tight">
                    {t('hero_title_part1')} <span className="font-serif italic text-gold-light">{t('hero_title_part2')}</span>
                </h1>

                {/* Search Widget */}
                <div className="w-full max-w-5xl bg-navy-deep/80 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-full p-2 gold-border-glow transition-all duration-300">
                    <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-center w-full">
                        {/* Location */}
                        <div className="relative flex-1 w-full px-6 py-4 border-b md:border-b-0 md:border-r border-white/10 group hover:bg-white/5 transition-colors duration-300 md:rounded-l-full overflow-hidden cursor-text" onClick={() => document.getElementById('search-location')?.focus()}>
                            <label className="block text-[11px] uppercase text-gold-accent font-bold mb-1 ml-9 text-left tracking-widest">{t('search_location')}</label>
                            <div className="flex items-center">
                                <span className="material-icons text-slate-300 mr-3 group-hover:text-gold-accent transition-colors">place</span>
                                <input
                                    id="search-location"
                                    className="w-full bg-transparent border-none text-white placeholder-slate-400 focus:ring-0 p-0 text-xl font-medium outline-none"
                                    placeholder={t('search_placeholder_location') || 'Anywhere'}
                                    type="text"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Custom Date Picker */}
                        <div ref={calendarRef} className="relative flex-1 w-full px-6 py-4 border-b md:border-b-0 md:border-r border-white/10 group hover:bg-white/5 transition-colors duration-300 cursor-pointer" onClick={() => setShowCalendar(!showCalendar)}>
                            <label className="block text-[11px] uppercase text-gold-accent font-bold mb-1 ml-9 text-left tracking-widest">{t('search_dates')}</label>
                            <div className="flex items-center">
                                <span className="material-icons text-slate-300 mr-3 group-hover:text-gold-accent transition-colors">calendar_month</span>
                                <div className={`w-full bg-transparent border-none p-0 text-xl font-medium outline-none text-left ${date ? 'text-white' : 'text-slate-400'}`}>
                                    {date ? new Date(date).toLocaleDateString() : (t('search_placeholder_dates') || 'Select Date')}
                                </div>
                            </div>

                            {/* Popup Calendar Box */}
                            {showCalendar && (
                                <div className="absolute top-full left-0 md:left-1/2 md:-translate-x-1/2 w-72 mt-3 bg-[#0a1628]/95 backdrop-blur-3xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8)] rounded-3xl p-5 z-50 cursor-default" onClick={e => e.stopPropagation()}>
                                    <div className="flex justify-between items-center mb-3">
                                        <button type="button" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))} className="text-white hover:text-gold-accent p-1.5 bg-white/5 rounded-full transition-colors"><span className="material-icons text-sm">chevron_left</span></button>
                                        <span className="text-white font-bold text-base uppercase tracking-wider">{calendarMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                                        <button type="button" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))} className="text-white hover:text-gold-accent p-1.5 bg-white/5 rounded-full transition-colors"><span className="material-icons text-sm">chevron_right</span></button>
                                    </div>
                                    <div className="grid grid-cols-7 gap-1 mb-2">
                                        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => <div key={d} className="text-gold-accent text-xs font-bold text-center">{d}</div>)}
                                    </div>
                                    <div className="grid grid-cols-7 gap-1">
                                        {Array.from({ length: new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate() }).map((_, i) => {
                                            const currentDateStr = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, '0')}-${String(i+1).padStart(2, '0')}`;
                                            const isSelected = date === currentDateStr;
                                            return (
                                                <div 
                                                    key={i+1} 
                                                    onClick={() => { setDate(currentDateStr); setShowCalendar(false); }}
                                                    className={`py-1.5 text-center text-sm cursor-pointer rounded-full transition-all hover:bg-gold-accent/20 ${isSelected ? 'bg-gradient-to-tr from-gold-accent to-gold-light text-navy-deep font-bold shadow-lg' : 'text-white hover:text-gold-accent'}`}
                                                >
                                                    {i+1}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="mt-3 text-center">
                                        <button type="button" onClick={() => { setDate(''); setShowCalendar(false); }} className="text-xs text-white/50 hover:text-white uppercase tracking-widest transition-colors font-semibold">Clear</button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Boat Type */}
                        <div className="relative flex-1 w-full px-6 py-4 group hover:bg-white/5 transition-colors duration-300 md:rounded-r-3xl cursor-pointer" onClick={() => {
                            const dropdown = document.getElementById('custom-dropdown');
                            if (dropdown) {
                                dropdown.classList.toggle('hidden');
                                dropdown.classList.toggle('flex');
                            }
                        }}>
                            <label className="block text-[11px] uppercase text-gold-accent font-bold mb-1 ml-9 text-left tracking-widest pointer-events-none">{t('search_vessel')}</label>
                            <div className="flex items-center relative pointer-events-none">
                                <span className="material-icons text-slate-300 mr-3 group-hover:text-gold-accent transition-colors">directions_boat</span>
                                <div className="w-full bg-transparent border-none text-white focus:ring-0 p-0 text-xl font-medium outline-none">
                                    {type === 'yacht' ? (t('search_super_yacht') || 'Super Yacht') :
                                     type === 'catamaran' ? (t('search_catamaran') || 'Catamaran') :
                                     type === 'sailboat' ? (t('search_sailboat') || 'Sailboat') :
                                     type === 'watercraft' ? (t('type_watercraft') || 'Watercraft') :
                                     (t('search_any_type') || 'Any Yacht Type')}
                                </div>
                                <span className="material-icons text-white/50 absolute right-2 group-hover:text-white transition-colors">expand_more</span>
                            </div>
                            
                            {/* Custom Dropdown Menu */}
                            <div id="custom-dropdown" className="hidden absolute top-full left-0 md:right-0 md:left-auto w-full md:w-64 mt-4 bg-[#0a1628]/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl z-50 flex-col overflow-hidden transform transition-all">
                                {[{value: '', label: t('search_any_type') || 'Any Yacht Type'}, {value: 'yacht', label: t('search_super_yacht') || 'Super Yacht'}, {value: 'catamaran', label: t('search_catamaran') || 'Catamaran'}, {value: 'sailboat', label: t('search_sailboat') || 'Sailboat'}, {value: 'watercraft', label: t('type_watercraft') || 'Watercraft'}].map((option) => (
                                    <div 
                                        key={option.value}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setType(option.value);
                                            document.getElementById('custom-dropdown')?.classList.add('hidden');
                                            document.getElementById('custom-dropdown')?.classList.remove('flex');
                                        }}
                                        className={`px-6 py-4 text-left cursor-pointer transition-all hover:bg-[#0f49bd]/40 ${type === option.value ? 'bg-[#0f49bd]/60 font-bold border-l-4 border-[#d4af37]' : 'border-l-4 border-transparent'}`}
                                    >
                                        <span className={`text-lg transition-colors ${type === option.value ? 'text-[#d4af37]' : 'text-white hover:text-[#d4af37]'}`}>{option.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="p-2 w-full md:w-auto mt-2 md:mt-0">
                            <button
                                type="submit"
                                className="w-full md:w-20 md:h-20 rounded-full bg-linear-to-tr from-primary-dark to-primary hover:from-primary hover:to-blue-accent text-white flex items-center justify-center shadow-[0_0_20px_rgba(15,73,189,0.5)] transition-all transform hover:scale-105"
                            >
                                <span className="material-icons text-3xl">search</span>
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
