/**
 * Utilidades para formatear nombres técnicos a lenguaje natural
 */

export const formatCategory = (category?: string): string => {
  if (!category) return 'N/A';
  
  const mapping: Record<string, string> = {
    'super_yacht': 'Súper Yate',
    'sport_yacht': 'Yate Deportivo',
    'classic_yacht': 'Yate Clásico',
    'luxury_catamaran': 'Catamarán de Lujo',
    'sailing_catamaran': 'Catamarán de Vela',
    'racing_sailboat': 'Velero de Competición',
    'cruiser_sailboat': 'Velero de Crucero',
    'jet_ski': 'Moto de Agua',
    'performance_watercraft': 'Moto de Alta Gama',
    'recreational_watercraft': 'Moto Recreativa',
    'luxury': 'Lujo',
    'standard': 'Estándar',
    'premium': 'Premium',
    'mega_yacht': 'Mega Yate',
    'catamaran': 'Catamarán'
  };

  return mapping[category.toLowerCase()] || category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export const formatType = (type?: string): string => {
  if (!type) return 'Embarcación';
  
  const mapping: Record<string, string> = {
    'yacht': 'Yate',
    'sailboat': 'Velero',
    'watercraft': 'Moto de Agua',
    'catamaran': 'Catamarán'
  };

  return mapping[type.toLowerCase()] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
};
