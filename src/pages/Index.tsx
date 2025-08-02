import WhaleGame from '@/components/WhaleGame';

const Index = () => {
  return (
    <div className="min-h-screen bg-ocean-deep flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8 space-y-4">
        <h1 className="text-5xl font-bold text-foreground mb-2">
          Jogo da Baleia Migratória
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          Use as setas do teclado para controlar sua baleia e explore as profundezas do oceano
        </p>
        <div className="flex justify-center gap-4 text-sm text-accent">
          <span>⬅️➡️ Movimento horizontal</span>
          <span>⬅️⬇️ Movimento vertical</span>
        </div>
      </div>
      
      <WhaleGame className="flex justify-center" />
      
      <div className="mt-8 text-center text-muted-foreground text-sm">
        <p>Construído com Phaser 3 e React</p>
      </div>
    </div>
  );
};

export default Index;