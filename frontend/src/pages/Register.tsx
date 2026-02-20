import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contex/AuthContext';
import { toast } from 'sonner';

import { useLanguage } from '../contex/LanguageContext';

const Register: React.FC = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        telefono: '',
        password: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast.error(t('passwords_mismatch'));
            return;
        }

        setLoading(true);

        try {
            await register({
                nombre: formData.nombre,
                email: formData.email,
                telefono: formData.telefono,
                password: formData.password,
            });
            toast.success(t('register_success'));
            navigate('/dashboard');
        } catch (error: any) {
            toast.error(error.message || t('register_error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a1628] flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#d4af37] to-[#f4d03f] rounded-lg flex items-center justify-center">
                            <svg className="w-7 h-7 text-[#0a1628]" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v-2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0 1.26.65 2.62.99 4 .99h2v2h-2z" />
                            </svg>
                        </div>
                        <span className="text-2xl font-bold text-white">NAUTICA</span>
                    </Link>
                    <h2 className="text-3xl font-bold text-white mb-2">{t('register_title')}</h2>
                    <p className="text-white/60">{t('register_subtitle')}</p>
                </div>

                {/* Form */}
                <div className="glass-effect rounded-2xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="text-white/80 text-sm mb-2 block">{t('name_label')}</label>
                            <input
                                type="text"
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                className="input"
                                placeholder="John Doe"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-white/80 text-sm mb-2 block">{t('email_label')}</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="input"
                                placeholder="your@email.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-white/80 text-sm mb-2 block">{t('phone_label')}</label>
                            <input
                                type="tel"
                                value={formData.telefono}
                                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                className="input"
                                placeholder="+1 (555) 000-0000"
                            />
                        </div>

                        <div>
                            <label className="text-white/80 text-sm mb-2 block">{t('password_label')}</label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="input"
                                placeholder="••••••••"
                                required
                                minLength={6}
                            />
                        </div>

                        <div>
                            <label className="text-white/80 text-sm mb-2 block">{t('confirm_password_label')}</label>
                            <input
                                type="password"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                className="input"
                                placeholder="••••••••"
                                required
                                minLength={6}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? t('creating_account') : t('create_account_button')}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-white/60 text-sm">
                            {t('already_account')}{' '}
                            <Link to="/login" className="text-[#d4af37] hover:text-[#f4d03f] transition-colors font-semibold">
                                {t('login_link')}
                            </Link>
                        </p>
                    </div>
                </div>

                <div className="mt-6 text-center">
                    <Link to="/" className="text-white/60 hover:text-white transition-colors text-sm flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to home
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
