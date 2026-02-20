import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contex/LanguageContext';

const Footer: React.FC = () => {
    const { t } = useLanguage();

    return (
        <footer className="bg-background-dark border-t border-white/5 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    <div className="col-span-1 md:col-span-1">
                        <Link to="/" className="flex items-center gap-2 mb-6 group">
                            <span className="material-icons text-gold-accent text-2xl">sailing</span>
                            <span className="text-lg font-bold tracking-widest text-white uppercase group-hover:text-gold-accent transition-colors">Nautica</span>
                        </Link>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            {t('footer_desc')}
                        </p>
                    </div>
                    <div>
                        <h4 className="text-white font-medium mb-4">{t('discover')}</h4>
                        <ul className="space-y-2 text-sm text-slate-400">
                            <li><Link to="/search" className="hover:text-gold-accent transition-colors">{t('destinations')}</Link></li>
                            <li><Link to="/search?tipo=yacht" className="hover:text-gold-accent transition-colors">{t('yacht_charter')}</Link></li>
                            <li><Link to="/search?tipo=yacht" className="hover:text-gold-accent transition-colors">{t('superyachts')}</Link></li>
                            <li><Link to="/experiences" className="hover:text-gold-accent transition-colors">{t('nav_experiences')}</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-medium mb-4">{t('support')}</h4>
                        <ul className="space-y-2 text-sm text-slate-400">
                            <li><Link to="/contact" className="hover:text-gold-accent transition-colors">{t('concierge')}</Link></li>
                            <li><Link to="/login" className="hover:text-gold-accent transition-colors">{t('login_title')}</Link></li>
                            <li><Link to="/help" className="hover:text-gold-accent transition-colors">{t('help_center')}</Link></li>
                            <li><Link to="/terms" className="hover:text-gold-accent transition-colors">{t('terms')}</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-medium mb-4">{t('newsletter')}</h4>
                        <p className="text-xs text-slate-400 mb-4">{t('newsletter_desc')}</p>
                        <div className="flex">
                            <input
                                className="bg-white/5 border border-white/10 rounded-l px-4 py-2 text-sm text-white focus:outline-none focus:border-primary w-full"
                                placeholder={t('email_placeholder')}
                                type="email"
                            />
                            <button className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-r text-sm transition-colors">{t('join')}</button>
                        </div>
                    </div>
                </div>
                <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-slate-500">{t('copyright')}</p>
                    <div className="flex gap-4">
                        <a className="text-slate-500 hover:text-white transition-colors" href="#"><i className="material-icons text-lg">facebook</i></a>
                        <a className="text-slate-500 hover:text-white transition-colors" href="#"><span className="text-sm font-bold">IG</span></a>
                        <a className="text-slate-500 hover:text-white transition-colors" href="#"><span className="text-sm font-bold">TW</span></a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
