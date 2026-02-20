import React from 'react';
import { useLanguage } from '../../contex/LanguageContext';

const MarketingSection: React.FC = () => {
    const { t } = useLanguage();

    return (
        <section className="py-24 bg-navy-deep text-white relative overflow-hidden">
            {/* Abstract background pattern */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-linear-to-l from-primary/10 to-transparent"></div>
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <div>
                        <h2 className="text-4xl md:text-5xl font-light mb-6">{t('navigating_extraordinary')} <span className="text-gold-accent font-serif italic">{t('extraordinary')}</span></h2>
                        <p className="text-slate-300 text-lg mb-8 leading-relaxed">
                            {t('marketing_desc')}
                        </p>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="flex flex-col">
                                <span className="text-3xl font-bold text-white mb-1">500+</span>
                                <span className="text-sm text-slate-400 uppercase tracking-wider">{t('luxury_vessels')}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-3xl font-bold text-white mb-1">45</span>
                                <span className="text-sm text-slate-400 uppercase tracking-wider">{t('global_destinations')}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-3xl font-bold text-white mb-1">24/7</span>
                                <span className="text-sm text-slate-400 uppercase tracking-wider">{t('concierge_service')}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-3xl font-bold text-white mb-1">100%</span>
                                <span className="text-sm text-slate-400 uppercase tracking-wider">{t('verified_owners')}</span>
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute -inset-4 bg-gold-accent/20 rounded-2xl blur-lg"></div>
                        <img
                            alt="Aerial view of yacht in deep blue water"
                            className="relative rounded-2xl shadow-2xl border border-white/10"
                            src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800"
                        />
                        <div className="absolute -bottom-6 -left-6 bg-background-dark p-6 rounded-xl border border-white/10 shadow-xl max-w-xs">
                            <div className="flex items-center gap-4 mb-3">
                                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white">
                                    <span className="material-icons">verified_user</span>
                                </div>
                                <div>
                                    <h5 className="text-white font-medium">{t('premium_guarantee')}</h5>
                                    <p className="text-xs text-slate-400">{t('insured_fleet')}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default MarketingSection;
