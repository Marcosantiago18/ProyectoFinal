import React, { useState, useEffect } from 'react';
import type { Embarcacion } from '../types';
import { embarcacionesAPI } from '../utils/api';
import Navbar from '../components/shared/Navbar';
import Footer from '../components/shared/Footer';
import Hero from '../components/home/Hero';
import FeaturedFleet from '../components/home/FeaturedFleet';
import MarketingSection from '../components/home/MarketingSection';

const Home: React.FC = () => {
    const [embarcaciones, setEmbarcaciones] = useState<Embarcacion[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadEmbarcaciones();
    }, []);

    const loadEmbarcaciones = async () => {
        try {
            const data: any = await embarcacionesAPI.getAll({ estado: 'disponible' });
            // Ensure we have an array and limit to 3 for the featured section
            if (Array.isArray(data)) {
                setEmbarcaciones(data.slice(0, 3));
            } else {
                console.error('Data received is not an array:', data);
                setEmbarcaciones([]);
            }
        } catch (error) {
            console.error('Error cargando embarcaciones:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col font-display">
            <Navbar />
            <main className="flex-grow">
                <Hero />
                <FeaturedFleet embarcaciones={embarcaciones} loading={loading} />
                <MarketingSection />
            </main>
            <Footer />
        </div>
    );
};

export default Home;
