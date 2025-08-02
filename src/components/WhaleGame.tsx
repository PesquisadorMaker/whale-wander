import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import whaleSprite from '@/assets/whale.png';
import coralSprite from '@/assets/coral.png';
import brazilWaters from '@/assets/brazil-waters.png';
import atlanticWaters from '@/assets/atlantic-waters.png';
import africaWaters from '@/assets/africa-waters.png';
import indiaWaters from '@/assets/india-waters.png';
import indonesiaWaters from '@/assets/indonesia-waters.png';
import australiaWaters from '@/assets/australia-waters.png';
import MiniMap from './MiniMap';
import InfoBalloon from './InfoBalloon';

interface WhaleGameProps {
  className?: string;
}

class GameScene extends Phaser.Scene {
  private whale!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private aKey!: Phaser.Input.Keyboard.Key;
  private isMoving = false;
  private corals: Phaser.GameObjects.Image[] = [];
  private nearestCoral: Phaser.GameObjects.Image | null = null;
  private camera!: Phaser.Cameras.Scene2D.Camera;
  private backgrounds: Phaser.GameObjects.TileSprite[] = [];
  private currentZone = 0;
  private totalDistance = 12000; // Total migration distance in pixels
  private milestones: { distance: number; message: string; triggered: boolean }[] = [];
  private coralInfo: { [key: string]: { name: string; info: string; country: string } } = {};
  
  // Zones configuration
  private zones = [
    { name: 'Brasil', start: 0, end: 2000, background: 'brazil-waters' },
    { name: 'Atlântico Sul', start: 2000, end: 4000, background: 'atlantic-waters' },
    { name: 'África', start: 4000, end: 6000, background: 'africa-waters' },
    { name: 'Oceano Índico', start: 6000, end: 8000, background: 'india-waters' },
    { name: 'Indonésia', start: 8000, end: 10000, background: 'indonesia-waters' },
    { name: 'Austrália', start: 10000, end: 12000, background: 'australia-waters' }
  ];

  constructor() {
    super({ key: 'GameScene' });
    
    // Initialize milestones
    this.milestones = [
      { distance: 1800, message: 'Deixando as águas brasileiras...', triggered: false },
      { distance: 2200, message: 'Entrando no Atlântico Sul - águas profundas à frente!', triggered: false },
      { distance: 4200, message: 'Aproximando-se das águas africanas!', triggered: false },
      { distance: 6200, message: 'Entrando no Oceano Índico - águas tropicais!', triggered: false },
      { distance: 8200, message: 'Chegando às águas indonésias - lar de corais únicos!', triggered: false },
      { distance: 10200, message: 'Aproximando-se da Austrália - Grande Barreira de Corais!', triggered: false },
      { distance: 11800, message: 'Chegada final - Austrália alcançada!', triggered: false }
    ];

    // Initialize coral information
    this.coralInfo = {
      'coral-brasil': { name: 'Coral Cérebro', info: 'Coral típico das águas brasileiras, importante para a biodiversidade marinha.', country: 'Brasil' },
      'coral-atlantico': { name: 'Coral Atlântico', info: 'Coral resistente das águas profundas do Atlântico Sul.', country: 'Atlântico Sul' },
      'coral-africa': { name: 'Coral Africano', info: 'Coral colorido da costa africana, lar de muitas espécies tropicais.', country: 'África' },
      'coral-india': { name: 'Coral do Índico', info: 'Coral tropical das águas quentes do Oceano Índico.', country: 'Oceano Índico' },
      'coral-indonesia': { name: 'Coral Indonésio', info: 'Coral diversificado das águas indonésias, um dos mais ricos em biodiversidade.', country: 'Indonésia' },
      'coral-australia': { name: 'Coral da Grande Barreira', info: 'Parte da famosa Grande Barreira de Corais da Austrália!', country: 'Austrália' }
    };
  }

  preload() {
    // Load sprites and backgrounds
    this.load.image('whale', whaleSprite);
    this.load.image('coral', coralSprite);
    this.load.image('brazil-waters', brazilWaters);
    this.load.image('atlantic-waters', atlanticWaters);
    this.load.image('africa-waters', africaWaters);
    this.load.image('india-waters', indiaWaters);
    this.load.image('indonesia-waters', indonesiaWaters);
    this.load.image('australia-waters', australiaWaters);
  }

  create() {
    // Set world bounds for migration route
    this.physics.world.setBounds(0, 0, this.totalDistance, 600);
    
    // Create scrolling backgrounds for each zone
    this.createBackgrounds();

    // Add corals throughout the journey
    this.createCorals();

    // Create the whale with physics
    this.whale = this.physics.add.sprite(100, 300, 'whale');
    this.whale.setScale(0.8);
    this.whale.setCollideWorldBounds(true);
    
    // Set up camera to follow whale horizontally
    this.camera = this.cameras.main;
    this.camera.startFollow(this.whale, true, 0.1, 0.05);
    this.camera.setLerp(0.1, 0.05);
    this.camera.setBounds(0, 0, this.totalDistance, 600);
    
    // Set up keyboard controls
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.aKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A);

    // Add floating animation to whale when idle
    this.tweens.add({
      targets: this.whale,
      y: this.whale.y - 10,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Add some bubbles for ambiance
    this.createBubbles();
  }

  createBackgrounds() {
    // Create backgrounds for each zone
    this.zones.forEach((zone, index) => {
      const bg = this.add.tileSprite(
        zone.start + (zone.end - zone.start) / 2, // Center of zone
        300, // Middle of screen height
        zone.end - zone.start, // Width of zone
        600, // Full height
        zone.background
      );
      bg.setOrigin(0.5, 0.5);
      bg.setDepth(-10);
      this.backgrounds.push(bg);
    });
  }

  createCorals() {
    // Add corals throughout the migration route
    const coralPositions = [
      { x: 300, y: 550, scale: 0.8, flip: false, id: 'coral-brasil' },
      { x: 1500, y: 560, scale: 0.7, flip: false, id: 'coral-brasil' },
      { x: 2300, y: 580, scale: 0.5, flip: true, id: 'coral-atlantico' },
      { x: 3200, y: 550, scale: 0.9, flip: false, id: 'coral-atlantico' },
      { x: 4500, y: 575, scale: 0.7, flip: false, id: 'coral-africa' },
      { x: 5200, y: 555, scale: 0.8, flip: true, id: 'coral-africa' },
      { x: 6500, y: 570, scale: 0.6, flip: false, id: 'coral-india' },
      { x: 7200, y: 560, scale: 0.8, flip: true, id: 'coral-india' },
      { x: 8500, y: 580, scale: 0.7, flip: false, id: 'coral-indonesia' },
      { x: 9200, y: 565, scale: 0.9, flip: true, id: 'coral-indonesia' },
      { x: 10500, y: 575, scale: 0.8, flip: false, id: 'coral-australia' },
      { x: 11200, y: 555, scale: 0.7, flip: true, id: 'coral-australia' }
    ];

    coralPositions.forEach(pos => {
      const coral = this.add.image(pos.x, pos.y, 'coral')
        .setScale(pos.scale)
        .setFlipX(pos.flip);
      coral.setDepth(-5);
      coral.setData('coralId', pos.id);
      this.corals.push(coral);
    });
  }

  createBubbles() {
    // Create animated bubbles throughout the route
    for (let i = 0; i < 40; i++) {
      const bubble = this.add.circle(
        Phaser.Math.Between(0, this.totalDistance),
        Phaser.Math.Between(400, 600),
        Phaser.Math.Between(3, 8),
        0x87CEEB,
        0.3
      );

      this.tweens.add({
        targets: bubble,
        y: bubble.y - 400,
        duration: Phaser.Math.Between(5000, 10000),
        repeat: -1,
        ease: 'Linear',
        delay: Phaser.Math.Between(0, 5000)
      });
    }
  }

  checkNearestCoral() {
    let minDistance = Infinity;
    let nearest: Phaser.GameObjects.Image | null = null;
    
    this.corals.forEach(coral => {
      const distance = Phaser.Math.Distance.Between(
        this.whale.x, this.whale.y,
        coral.x, coral.y
      );
      
      if (distance < 100 && distance < minDistance) {
        minDistance = distance;
        nearest = coral;
      }
    });
    
    this.nearestCoral = nearest;
    
    // Visual indicator when near coral
    this.corals.forEach(coral => {
      if (coral === nearest) {
        coral.setTint(0xffff00); // Yellow tint when near
      } else {
        coral.clearTint();
      }
    });
  }

  handleCoralInteraction() {
    if (this.nearestCoral && Phaser.Input.Keyboard.JustDown(this.aKey)) {
      const coralId = this.nearestCoral.getData('coralId');
      const coralData = this.coralInfo[coralId];
      
      if (coralData) {
        const message = `🐠 ${coralData.name} (${coralData.country})\n\n${coralData.info}`;
        this.game.events.emit('milestone', message);
      }
    }
  }

  getCurrentZone(): number {
    const whaleX = this.whale.x;
    for (let i = 0; i < this.zones.length; i++) {
      if (whaleX >= this.zones[i].start && whaleX < this.zones[i].end) {
        return i;
      }
    }
    return this.zones.length - 1; // Return last zone if beyond all
  }

  checkMilestones() {
    const whaleX = this.whale.x;
    this.milestones.forEach(milestone => {
      if (!milestone.triggered && whaleX >= milestone.distance) {
        milestone.triggered = true;
        // Emit event to React component
        this.game.events.emit('milestone', milestone.message);
      }
    });
  }

  update() {
    // Reset movement state
    this.isMoving = false;

    // Handle horizontal movement
    if (this.cursors.left?.isDown && this.whale.x > 50) {
      this.whale.setVelocityX(-200);
      this.whale.setFlipX(true);
      this.isMoving = true;
    } else if (this.cursors.right?.isDown && this.whale.x < this.totalDistance - 50) {
      this.whale.setVelocityX(200);
      this.whale.setFlipX(false);
      this.isMoving = true;
    } else {
      this.whale.setVelocityX(0);
    }

    // Handle vertical movement
    if (this.cursors.up?.isDown) {
      this.whale.setVelocityY(-200);
      this.isMoving = true;
    } else if (this.cursors.down?.isDown) {
      this.whale.setVelocityY(200);
      this.isMoving = true;
    } else {
      this.whale.setVelocityY(0);
    }

    // Animate whale tail when moving
    if (this.isMoving) {
      if (!this.whale.getData('swimming')) {
        this.whale.setData('swimming', true);
        this.tweens.add({
          targets: this.whale,
          scaleY: 0.9,
          duration: 200,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
    } else {
      if (this.whale.getData('swimming')) {
        this.whale.setData('swimming', false);
        this.tweens.killTweensOf(this.whale);
        this.whale.setScale(0.8);
      }
    }

    // Check for zone changes and milestones
    const newZone = this.getCurrentZone();
    if (newZone !== this.currentZone) {
      this.currentZone = newZone;
    }

    this.checkMilestones();
    this.checkNearestCoral();
    this.handleCoralInteraction();

    // Emit whale position for mini map
    this.game.events.emit('whalePosition', {
      position: this.whale.x,
      totalDistance: this.totalDistance
    });
  }
}

const WhaleGame: React.FC<WhaleGameProps> = ({ className }) => {
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);
  const [whalePosition, setWhalePosition] = useState(0);
  const [totalDistance, setTotalDistance] = useState(12000);
  const [balloonMessage, setBalloonMessage] = useState('');
  const [showBalloon, setShowBalloon] = useState(false);

  useEffect(() => {
    if (gameRef.current && !phaserGameRef.current) {
      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        parent: gameRef.current,
        backgroundColor: '#000080',
        physics: {
          default: 'arcade',
          arcade: {
            debug: false,
            gravity: { x: 0, y: 0 }
          }
        },
        scene: GameScene
      };

      phaserGameRef.current = new Phaser.Game(config);

      // Listen for game events
      phaserGameRef.current.events.on('whalePosition', (data: { position: number; totalDistance: number }) => {
        setWhalePosition(data.position);
        setTotalDistance(data.totalDistance);
      });

      phaserGameRef.current.events.on('milestone', (message: string) => {
        setBalloonMessage(message);
        setShowBalloon(true);
      });
    }

    return () => {
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
    };
  }, []);

  const handleBalloonClose = () => {
    setShowBalloon(false);
  };

  return (
    <div className={className}>
      <div className="relative">
        <div 
          ref={gameRef} 
          className="border-2 border-accent rounded-lg overflow-hidden shadow-2xl"
          style={{ width: '800px', height: '600px' }}
        />
        
        <MiniMap 
          whalePosition={whalePosition} 
          totalDistance={totalDistance} 
        />
        
        <InfoBalloon 
          message={balloonMessage}
          isVisible={showBalloon}
          onClose={handleBalloonClose}
        />
      </div>
    </div>
  );
};

export default WhaleGame;