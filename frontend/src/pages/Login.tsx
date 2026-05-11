import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contex/AuthContext';
import { useLanguage } from '../contex/LanguageContext';
import { toast } from 'sonner';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const user = await login(formData.email, formData.password);
            toast.success(t('login_success'));
            if (user.rol === 'admin' || user.rol === 'capitan') {
                navigate('/dashboard');
            } else {
                navigate('/');
            }
        } catch (error: any) {
            toast.error(error.message || t('login_error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0 w-full h-full z-0">
                <img
                    alt="Luxury yacht background"
                    className="object-cover w-full h-full brightness-50"
                    src="https://images.unsplash.com/photo-1605281317010-fe5ffe798166?q=80&w=2044&auto=format&fit=crop"
                />
                <div className="absolute inset-0 bg-linear-to-tr from-navy-deep/90 via-navy-deep/60 to-background-dark/80"></div>
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-3 mb-4">
                        <img src="/images/seahive_logo.png" alt="SeaHive" className="w-12 h-12 rounded-full" />
                        <span className="text-2xl font-bold text-white">SEAHIVE</span>
                    </Link>
                    <h2 className="text-3xl font-bold text-white mb-2">{t('login_title')}</h2>
                    <p className="text-white/60">{t('login_subtitle')}</p>
                </div>

                {/* Form */}
                <div className="glass-effect rounded-2xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
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
                            <label className="text-white/80 text-sm mb-2 block">{t('password_label')}</label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="input"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-white/5" />
                                <span className="text-white/60 text-sm">{t('remember_me')}</span>
                            </label>
                            <Link to="/forgot-password" className="text-[#4a90e2] hover:text-[#00d4ff] text-sm transition-colors">
                                {t('forgot_password')}
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? t('signing_in') : t('sign_in_button')}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-white/60 text-sm">
                            {t('no_account')}{' '}
                            <Link to="/register" className="text-[#d4af37] hover:text-[#f4d03f] transition-colors font-semibold">
                                {t('sign_up_link')}
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

export default Login;
