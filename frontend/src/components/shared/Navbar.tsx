import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contex/AuthContext';
import { useLanguage } from '../../contex/LanguageContext';

const Navbar: React.FC = () => {
    const { isAuthenticated, usuario, logout } = useAuth();
    const { t, language, setLanguage } = useLanguage();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <nav className="fixed top-0 w-full z-50 glass-nav transition-all duration-300">
            <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 group">
                    <span className="material-icons text-gold-accent text-3xl">sailing</span>
                    <span className="text-xl font-bold tracking-widest text-white uppercase group-hover:text-gold-accent transition-colors">Nautica</span>
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center space-x-8">
                    <Link to="/search?tipo=yacht" className="text-sm font-medium text-slate-200 hover:text-white hover:border-b hover:border-gold-accent pb-1 transition-all">
                        {t('nav_yachts')}
                    </Link>
                    <Link to="/search?tipo=watercraft" className="text-sm font-medium text-slate-200 hover:text-white hover:border-b hover:border-gold-accent pb-1 transition-all">
                        {t('nav_jetskis')}
                    </Link>
                    <Link to="/experiences" className="text-sm font-medium text-slate-200 hover:text-white hover:border-b hover:border-gold-accent pb-1 transition-all">
                        {t('nav_experiences')}
                    </Link>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-4">
                    {/* Language Switch */}
                    <div className="flex items-center gap-2 mr-2">
                        <button
                            onClick={() => setLanguage('es')}
                            className={`text-xs font-bold px-2 py-1 rounded transition-colors ${language === 'es' ? 'bg-gold-accent text-slate-900' : 'text-slate-400 hover:text-white'}`}
                        >
                            ES
                        </button>
                        <span className="text-slate-600">|</span>
                        <button
                            onClick={() => setLanguage('en')}
                            className={`text-xs font-bold px-2 py-1 rounded transition-colors ${language === 'en' ? 'bg-gold-accent text-slate-900' : 'text-slate-400 hover:text-white'}`}
                        >
                            EN
                        </button>
                    </div>

                    {isAuthenticated && usuario ? (
                        <>
                            <Link to="/my-bookings" className="hidden md:block text-sm font-medium text-slate-200 hover:text-white transition-colors">
                                {t('my_bookings')}
                            </Link>
                            {usuario.rol === 'admin' && (
                                <Link to="/dashboard" className="hidden md:block text-sm font-medium text-gold-accent hover:text-white transition-colors">
                                    {t('nav_dashboard')}
                                </Link>
                            )}
                            <div className="flex items-center gap-3">
                                <span className="hidden md:block text-slate-200 text-sm">
                                    {usuario.nombre}
                                </span>
                                <button
                                    onClick={handleLogout}
                                    className="bg-white/10 hover:bg-white/20 text-white px-4 py-1.5 rounded-full text-sm font-medium transition-all backdrop-blur-sm"
                                >
                                    {t('nav_logout')}
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="hidden md:block text-sm font-medium text-gold-accent hover:text-white transition-colors">
                                {t('nav_login')}
                            </Link>
                            <Link to="/register" className="bg-primary/20 hover:bg-primary/40 border border-primary text-white px-5 py-2 rounded-full text-sm font-medium transition-all backdrop-blur-sm">
                                {t('nav_register')}
                            </Link>
                        </>
                    )}

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden text-white"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        <span className="material-icons">menu</span>
                    </button>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMobileMenuOpen && (
                <div className="md:hidden glass-nav absolute w-full border-t border-white/10">
                    <div className="flex flex-col p-4 space-y-4">
                        <Link to="/search?tipo=yacht" className="text-slate-200 hover:text-gold-accent">{t('nav_yachts')}</Link>
                        <Link to="/search?tipo=watercraft" className="text-slate-200 hover:text-gold-accent">{t('nav_jetskis')}</Link>
                        <Link to="/experiences" className="text-slate-200 hover:text-gold-accent">{t('nav_experiences')}</Link>
                        {!isAuthenticated && (
                            <>
                                <Link to="/login" className="text-gold-accent">{t('nav_login')}</Link>
                                <Link to="/register" className="text-white">{t('nav_register')}</Link>
                            </>
                        )}
                        <div className="flex gap-4 pt-4 border-t border-white/10">
                            <button onClick={() => setLanguage('es')} className={`text-sm ${language === 'es' ? 'text-gold-accent' : 'text-slate-400'}`}>Español</button>
                            <button onClick={() => setLanguage('en')} className={`text-sm ${language === 'en' ? 'text-gold-accent' : 'text-slate-400'}`}>English</button>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
