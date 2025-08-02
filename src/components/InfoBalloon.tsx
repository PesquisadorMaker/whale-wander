import React from 'react';

interface InfoBalloonProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
}

const InfoBalloon: React.FC<InfoBalloonProps> = ({ message, isVisible, onClose }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
      <div className="bg-secondary/95 backdrop-blur-sm border-2 border-accent rounded-lg p-6 max-w-md shadow-2xl animate-scale-in">
        <div className="text-center">
          <div className="text-4xl mb-3">🐋</div>
          <p className="text-secondary-foreground text-lg font-semibold mb-4">
            {message}
          </p>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-accent text-accent-foreground rounded-md hover:bg-accent/80 transition-colors font-medium"
          >
            Continuar
          </button>
        </div>
        
        {/* Balloon tail */}
        <div className="absolute bottom-[-10px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[10px] border-r-[10px] border-t-[10px] border-l-transparent border-r-transparent border-t-accent"></div>
      </div>
    </div>
  );
};

export default InfoBalloon;