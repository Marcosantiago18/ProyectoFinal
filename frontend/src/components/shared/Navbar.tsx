import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contex/AuthContext';
import { useLanguage } from '../../contex/LanguageContext';
import { notificacionesAPI } from '../../utils/api';
import { socket } from '../../utils/socket';

const Navbar: React.FC = () => {
    const { isAuthenticated, usuario, logout } = useAuth();
    const { t, language, setLanguage } = useLanguage();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [unreadMessages, setUnreadMessages] = useState(0);

    useEffect(() => {
        let interval: any;
        const fetchNotifs = async () => {
            if (isAuthenticated && usuario) {
                try {
                    const token = localStorage.getItem('token') || '';
                    const res: any = await notificacionesAPI.get(usuario.id, token);
                    setUnreadMessages(res.unread_mensajes || 0);
                } catch (e) {
                    console.error('Error fetching notifications', e);
                }
            }
        };

        fetchNotifs();
        if (isAuthenticated) {
            interval = setInterval(fetchNotifs, 15000);
            
            const handleSocketNotif = (data: any) => {
                if (usuario && data.destinatario_id === usuario.id) {
                    fetchNotifs();
                }
            };
            
            socket.on('actualizar_notificaciones', handleSocketNotif);
            
            return () => {
                clearInterval(interval);
                socket.off('actualizar_notificaciones', handleSocketNotif);
            };
        }
    }, [isAuthenticated, usuario]);


    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <nav className="fixed top-0 w-full z-50 glass-nav transition-all duration-300">
            <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 group">
                    <img src="/images/seahive_logo.png" alt="SeaHive" className="w-9 h-9 rounded-full" />
                    <span className="text-xl font-bold tracking-widest text-white uppercase group-hover:text-gold-accent transition-colors">SeaHive</span>
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
                            <Link to="/my-bookings" className="hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white transition-colors relative" title={t('my_bookings')}>
                                <span className="material-icons text-xl">event</span>
                            </Link>
                            <Link to="/messages" className="hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white transition-colors relative" title="Mensajes">
                                <span className="material-icons text-xl">chat</span>
                                {unreadMessages > 0 && (
                                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border border-[#0a1628]"></span>
                                )}
                            </Link>
                            {(usuario.rol === 'admin' || usuario.rol === 'capitan') && (
                                <Link to="/dashboard" className="hidden md:block text-sm font-medium text-gold-accent hover:text-white transition-colors">
                                    {t('nav_dashboard')}
                                </Link>
                            )}
                            <div className="hidden md:flex items-center gap-3">
                                <span className="text-slate-200 text-sm">
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
                <div className="md:hidden fixed top-[70px] left-0 w-full h-[calc(100vh-70px)] bg-[#0a1628]/95 backdrop-blur-2xl z-40 overflow-y-auto border-t border-white/10">
                    <div className="flex flex-col p-8 space-y-6">
                        <Link to="/search?tipo=yacht" onClick={() => setIsMobileMenuOpen(false)} className="text-white text-2xl font-light hover:text-[#d4af37] transition-colors">{t('nav_yachts')}</Link>
                        <Link to="/search?tipo=watercraft" onClick={() => setIsMobileMenuOpen(false)} className="text-white text-2xl font-light hover:text-[#d4af37] transition-colors">{t('nav_jetskis')}</Link>
                        <Link to="/experiences" onClick={() => setIsMobileMenuOpen(false)} className="text-white text-2xl font-light hover:text-[#d4af37] transition-colors">{t('nav_experiences')}</Link>
                        
                        <div className="h-px bg-white/10 w-full my-4"></div>

                        {isAuthenticated ? (
                            <>
                                <Link to="/my-bookings" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 text-white text-2xl font-light hover:text-[#d4af37] transition-colors">
                                    <span className="material-icons">event</span> {t('my_bookings')}
                                </Link>
                                <Link to="/messages" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 text-white text-2xl font-light hover:text-[#d4af37] transition-colors relative w-fit">
                                    <span className="material-icons">chat</span> Mensajes
                                    {unreadMessages > 0 && (
                                        <span className="absolute top-2 -right-3 w-3 h-3 bg-red-500 rounded-full border-2 border-[#0a1628]"></span>
                                    )}
                                </Link>
                                {(usuario?.rol === 'admin' || usuario?.rol === 'capitan') && (
                                    <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="text-[#d4af37] text-2xl font-semibold hover:text-white transition-colors">{t('nav_dashboard')}</Link>
                                )}
                                <div className="pt-6">
                                    <button onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }} className="w-full text-center bg-red-500/10 border border-red-500/30 text-red-400 font-medium py-3 rounded-xl hover:bg-red-500/20 transition-colors">
                                        {t('nav_logout')}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="text-[#d4af37] text-2xl font-light">{t('nav_login')}</Link>
                                <div className="pt-4">
                                    <Link to="/register" onClick={() => setIsMobileMenuOpen(false)} className="block w-full bg-linear-to-r from-[#d4af37] to-[#f4d03f] text-[#0a1628] font-bold text-center text-xl py-4 rounded-full shadow-[0_0_20px_rgba(212,175,55,0.3)]">{t('nav_register')}</Link>
                                </div>
                            </>
                        )}
                        
                        <div className="flex justify-center gap-4 pt-8 mt-auto">
                            <button onClick={() => { setLanguage('es'); setIsMobileMenuOpen(false); }} className={`w-14 h-14 flex items-center justify-center rounded-full font-bold transition-colors ${language === 'es' ? 'bg-[#d4af37] text-[#0a1628]' : 'bg-white/5 text-white hover:bg-white/10'}`}>ES</button>
                            <button onClick={() => { setLanguage('en'); setIsMobileMenuOpen(false); }} className={`w-14 h-14 flex items-center justify-center rounded-full font-bold transition-colors ${language === 'en' ? 'bg-[#d4af37] text-[#0a1628]' : 'bg-white/5 text-white hover:bg-white/10'}`}>EN</button>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
