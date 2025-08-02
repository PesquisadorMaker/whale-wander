import React from 'react';

interface MiniMapProps {
  whalePosition: number;
  totalDistance: number;
}

const MiniMap: React.FC<MiniMapProps> = ({ whalePosition, totalDistance }) => {
  // Calculate progress percentage
  const progress = Math.min((whalePosition / totalDistance) * 100, 100);
  
  // Define zones
  const zones = [
    { name: 'Brasil', start: 0, end: 33, color: 'bg-emerald-500' },
    { name: 'Atlântico Sul', start: 33, end: 66, color: 'bg-blue-600' },
    { name: 'África', start: 66, end: 100, color: 'bg-orange-500' }
  ];

  const getCurrentZone = () => {
    return zones.find(zone => progress >= zone.start && progress < zone.end) || zones[zones.length - 1];
  };

  const currentZone = getCurrentZone();

  return (
    <div className="fixed top-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 border border-accent/30 min-w-[200px]">
      <h3 className="text-accent text-sm font-semibold mb-2">Rota Migratória</h3>
      
      {/* Progress bar */}
      <div className="relative w-full h-3 bg-muted/30 rounded-full mb-3 overflow-hidden">
        {zones.map((zone, index) => (
          <div
            key={index}
            className={`absolute h-full ${zone.color} opacity-50`}
            style={{
              left: `${zone.start}%`,
              width: `${zone.end - zone.start}%`
            }}
          />
        ))}
        
        {/* Whale position indicator */}
        <div 
          className="absolute top-0 h-full w-1 bg-white shadow-lg transition-all duration-300"
          style={{ left: `${progress}%` }}
        />
      </div>

      {/* Current location */}
      <div className="text-center">
        <p className="text-foreground text-xs">Localização atual:</p>
        <p className={`text-sm font-bold ${currentZone.color.replace('bg-', 'text-')}`}>
          {currentZone.name}
        </p>
        <p className="text-muted-foreground text-xs mt-1">
          {Math.round(progress)}% da jornada
        </p>
      </div>

      {/* Distance markers */}
      <div className="grid grid-cols-3 gap-1 mt-3 text-xs">
        {zones.map((zone, index) => (
          <div key={index} className="text-center">
            <div className={`w-3 h-3 ${zone.color} rounded-full mx-auto mb-1 opacity-60`} />
            <p className="text-muted-foreground text-[10px]">{zone.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MiniMap;