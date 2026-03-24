import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Reemplazar con la clave pública de test proporcionada
const stripePromise = loadStripe('pk_test_51TDqhiA5eiO95UcZrTjF1VVQxw7zVfYLU7vhbHasY1g5kr6Ly6RJPthQmjrM8vGNVDynO5eLU2TbQQVGIBBOEC6500bMzZzR2i');

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    amount: number;
    description: string;
}

const CheckoutForm: React.FC<{ onSuccess: () => void; isProcessing: boolean; setIsProcessing: (v: boolean) => void }> = ({ onSuccess, isProcessing, setIsProcessing }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsProcessing(true);
        setError(null);

        const { error: submitError } = await elements.submit();
        if (submitError) {
            setError(submitError.message || 'Error en el formulario');
            setIsProcessing(false);
            return;
        }

        const { error: paymentError, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                // Return URL no requerida si no usamos redirect
            },
            redirect: 'if_required' 
        });

        if (paymentError) {
            setError(paymentError.message || 'Pago rechazado');
            setIsProcessing(false);
        } else if (paymentIntent && paymentIntent.status === 'succeeded') {
            onSuccess();
        } else {
            setError('Estado de pago inesperado');
            setIsProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-6">
            <div className="mb-4">
                <PaymentElement 
                    options={{ 
                        layout: 'tabs'
                    }} 
                />
            </div>
            
            {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-500 text-sm">
                    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={!stripe || isProcessing}
                className="w-full mt-6 bg-[#d4af37] text-[#0a1628] font-bold py-3.5 rounded-xl hover:bg-[#f4d03f] transition-all disabled:opacity-50 flex justify-center items-center gap-2 group"
            >
                {isProcessing ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-[#0a1628]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Procesando Pago...
                    </>
                ) : (
                    <>
                        Confirmar y Pagar
                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </>
                )}
            </button>
            <div className="mt-4 flex items-center justify-center gap-2 text-white/40 text-xs">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                Pago seguro procesado por Stripe
            </div>
        </form>
    );
};

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onSuccess, amount, description }) => {
    const [clientSecret, setClientSecret] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (isOpen && amount > 0) {
            fetch('http://127.0.0.1:5000/api/pagos/create-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount }),
            })
            .then((res) => res.json())
            .then((data) => setClientSecret(data.clientSecret))
            .catch((err) => console.error('Error fetching secret:', err));
        }
    }, [isOpen, amount]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={!isProcessing ? onClose : undefined} />
            
            <div className="relative bg-[#0a1628] border border-white/10 rounded-2xl w-full max-w-md overflow-y-auto overflow-x-hidden max-h-[90vh] shadow-2xl animate-fade-in-up transition-all">
                {/* Header */}
                <div className="bg-linear-to-r from-[#d4af37] to-[#f4d03f] p-6 text-[#0a1628]">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-xl font-bold">Pago Seguro</h3>
                        <button onClick={!isProcessing ? onClose : undefined} className="hover:scale-110 transition-transform disabled:opacity-50" disabled={isProcessing}>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <p className="text-sm font-medium opacity-80">{description}</p>
                    <div className="mt-4 flex items-end justify-between">
                        <span className="text-sm font-semibold uppercase tracking-wider">Total a Pagar</span>
                        <span className="text-3xl font-black">${amount.toLocaleString()}</span>
                    </div>
                </div>

                {/* Body elements */}
                {clientSecret ? (
                    <Elements stripe={stripePromise} options={{ 
                        clientSecret, 
                        appearance: { 
                            theme: 'night',
                            variables: {
                                colorPrimary: '#d4af37',
                                colorBackground: '#0a1628',
                                colorText: '#ffffff',
                                colorDanger: '#ff4d4d',
                                fontFamily: 'system-ui, sans-serif',
                                spacingUnit: '4px',
                                borderRadius: '8px',
                            }
                        } 
                    }}>
                        <CheckoutForm onSuccess={onSuccess} isProcessing={isProcessing} setIsProcessing={setIsProcessing} />
                    </Elements>
                ) : (
                    <div className="p-12 flex justify-center items-center flex-col">
                        <svg className="animate-spin h-8 w-8 text-[#d4af37] mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-white/60">Conectando pasarela...</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentModal;
