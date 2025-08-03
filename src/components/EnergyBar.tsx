import React from 'react';

interface EnergyBarProps {
  energy: number;
  maxEnergy: number;
}

const EnergyBar: React.FC<EnergyBarProps> = ({ energy, maxEnergy }) => {
  const percentage = (energy / maxEnergy) * 100;
  
  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
      <div className="bg-background/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-accent/20">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-foreground">Energia</span>
          <span className="text-xs text-muted-foreground">{Math.ceil(energy)}/{maxEnergy}</span>
        </div>
        <div className="w-48 h-3 bg-muted rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${
              percentage > 60 ? 'bg-green-500' : 
              percentage > 30 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.max(0, percentage)}%` }}
          />
        </div>
        {energy <= 20 && (
          <div className="text-xs text-red-500 mt-1 animate-pulse font-semibold">
            ⚠️ Energia baixa!
          </div>
        )}
      </div>
    </div>
  );
};

export default EnergyBar;