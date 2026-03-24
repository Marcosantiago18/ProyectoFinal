import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contex/AuthContext';
import Navbar from '../components/shared/Navbar';
import Footer from '../components/shared/Footer';
import ChatInterface from '../components/chat/ChatInterface';

const Messages: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated, navigate]);

    return (
        <div className="bg-[#0a1628] min-h-screen flex flex-col font-display">
            <Navbar />
            <main className="grow pt-24 pb-12 px-6">
                <div className="max-w-7xl mx-auto h-[600px]">
                    <h1 className="text-3xl font-bold text-white mb-8">Centro de Mensajes</h1>
                    <ChatInterface />
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Messages;
