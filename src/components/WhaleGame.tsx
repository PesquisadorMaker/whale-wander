import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import whaleSprite from '@/assets/whale.png';
import coralSprite from '@/assets/coral.png';
import shipSprite from '@/assets/ship.png';
import sharkSprite from '@/assets/shark.png';
import fishSchoolSprite from '@/assets/fish-school.png';
import brazilWaters from '@/assets/brazil-waters.png';
import atlanticWaters from '@/assets/atlantic-waters.png';
import africaWaters from '@/assets/africa-waters.png';
import indiaWaters from '@/assets/india-waters.png';
import indonesiaWaters from '@/assets/indonesia-waters.png';
import australiaWaters from '@/assets/australia-waters.png';
import MiniMap from './MiniMap';
import InfoBalloon from './InfoBalloon';
import EnergyBar from './EnergyBar';

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
  
  // Energy system
  private energy = 100;
  private maxEnergy = 100;
  private energyDecayRate = 0.005; // Energy lost per second (reduced from 0.02)
  private energyGainRate = 0.008; // Energy gained per second over time
  private lastUpdateTime = 0;
  
  // Obstacles and collectibles
  private ships!: Phaser.Physics.Arcade.Group;
  private predators!: Phaser.Physics.Arcade.Group;
  private fishSchools!: Phaser.Physics.Arcade.Group;
  
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
    this.load.image('ship', shipSprite);
    this.load.image('shark', sharkSprite);
    this.load.image('fish-school', fishSchoolSprite);
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

    // Create groups for obstacles and collectibles
    this.ships = this.physics.add.group();
    this.predators = this.physics.add.group();
    this.fishSchools = this.physics.add.group();

    // Create obstacles and collectibles
    this.createShips();
    this.createPredators();
    this.createFishSchools();

    // Create the whale with physics
    this.whale = this.physics.add.sprite(100, 300, 'whale');
    this.whale.setScale(0.25); // Reduced to 1/3 of original size
    this.whale.setCollideWorldBounds(true);

    // Set up collisions
    this.physics.add.overlap(this.whale, this.ships, this.hitObstacle, undefined, this);
    this.physics.add.overlap(this.whale, this.predators, this.hitPredator, undefined, this);
    this.physics.add.overlap(this.whale, this.fishSchools, this.collectFish, undefined, this);
    
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

    // Initialize time tracking
    this.lastUpdateTime = this.time.now;
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

  createShips() {
    // Add ships as moving obstacles
    const shipPositions = [
      { x: 800, y: 200, direction: 'horizontal' },
      { x: 2500, y: 150, direction: 'vertical' },
      { x: 4800, y: 180, direction: 'horizontal' },
      { x: 7200, y: 220, direction: 'vertical' },
      { x: 9500, y: 160, direction: 'horizontal' },
      { x: 11000, y: 190, direction: 'vertical' }
    ];

    shipPositions.forEach(pos => {
      const ship = this.physics.add.sprite(pos.x, pos.y, 'ship');
      ship.setScale(0.6);
      ship.setData('direction', pos.direction);
      ship.setData('initialY', pos.y);
      ship.setData('initialX', pos.x);
      this.ships.add(ship);

      // Set initial velocity
      if (pos.direction === 'horizontal') {
        ship.setVelocityX(50);
      } else {
        ship.setVelocityY(30);
      }
    });
  }

  createPredators() {
    // Add predators (sharks) that patrol areas
    const predatorPositions = [
      { x: 1200, y: 400, patrolStart: 1000, patrolEnd: 1400 },
      { x: 3500, y: 450, patrolStart: 3200, patrolEnd: 3800 },
      { x: 6000, y: 420, patrolStart: 5800, patrolEnd: 6200 },
      { x: 8800, y: 460, patrolStart: 8500, patrolEnd: 9100 },
      { x: 10800, y: 440, patrolStart: 10500, patrolEnd: 11100 }
    ];

    predatorPositions.forEach(pos => {
      const predator = this.physics.add.sprite(pos.x, pos.y, 'shark');
      predator.setScale(0.7);
      predator.setData('patrolStart', pos.patrolStart);
      predator.setData('patrolEnd', pos.patrolEnd);
      predator.setData('direction', 1);
      predator.setVelocityX(80);
      this.predators.add(predator);
    });
  }

  createFishSchools() {
    // Add fish schools as energy sources
    const fishPositions = [
      { x: 600, y: 350 },
      { x: 1800, y: 380 },
      { x: 2800, y: 320 },
      { x: 4200, y: 360 },
      { x: 5500, y: 340 },
      { x: 6800, y: 370 },
      { x: 8200, y: 330 },
      { x: 9600, y: 350 },
      { x: 10900, y: 380 },
      { x: 11500, y: 340 }
    ];

    fishPositions.forEach(pos => {
      const fishSchool = this.physics.add.sprite(pos.x, pos.y, 'fish-school');
      fishSchool.setScale(0.8);
      this.fishSchools.add(fishSchool);

      // Add floating animation
      this.tweens.add({
        targets: fishSchool,
        y: fishSchool.y - 15,
        duration: 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });
  }

  hitObstacle(whale: Phaser.Physics.Arcade.Sprite, ship: Phaser.Physics.Arcade.Sprite) {
    this.energy = Math.max(0, this.energy - 10); // Reduced from 15
    this.game.events.emit('energyUpdate', this.energy);
    
    // Reset whale position to start
    this.resetWhalePosition();
    
    // Visual feedback
    whale.setTint(0xff0000);
    this.time.delayedCall(200, () => whale.clearTint());
    
    if (this.energy <= 0) {
      this.gameOver();
    }
  }

  hitPredator(whale: Phaser.Physics.Arcade.Sprite, predator: Phaser.Physics.Arcade.Sprite) {
    this.energy = Math.max(0, this.energy - 12); // Reduced from 20
    this.game.events.emit('energyUpdate', this.energy);
    
    // Reset whale position to start
    this.resetWhalePosition();
    
    // Visual feedback
    whale.setTint(0xff0000);
    this.time.delayedCall(300, () => whale.clearTint());
    
    if (this.energy <= 0) {
      this.gameOver();
    }
  }

  collectFish(whale: Phaser.Physics.Arcade.Sprite, fishSchool: Phaser.Physics.Arcade.Sprite) {
    this.energy = Math.min(this.maxEnergy, this.energy + 30); // Increased from 25
    this.game.events.emit('energyUpdate', this.energy);
    
    // Visual feedback
    whale.setTint(0x00ff00);
    this.time.delayedCall(200, () => whale.clearTint());
    
    // Remove fish school
    fishSchool.destroy();
  }

  gameOver() {
    this.physics.pause();
    this.game.events.emit('milestone', '💀 Energia esgotada! A baleia precisa descansar...\n\nPressione F5 para tentar novamente.');
  }

  resetWhalePosition() {
    // Reset whale to starting position
    this.whale.setPosition(100, 300);
    this.whale.setVelocity(0, 0);
    
    // Reset all milestones so they can trigger again
    this.milestones.forEach(milestone => {
      milestone.triggered = false;
    });
    
    // Show message about returning to start
    this.game.events.emit('milestone', '💥 Colisão! A baleia voltou ao início da migração...');
    
    // Update current zone
    this.currentZone = 0;
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
    // Update energy over time
    const currentTime = this.time.now;
    if (currentTime - this.lastUpdateTime > 1000) { // Update every second
      // Gradual energy gain over time (whale recovers naturally)
      this.energy = Math.min(this.maxEnergy, this.energy + this.energyGainRate * 1000);
      
      // Only lose energy if moving (swimming effort)
      if (this.isMoving) {
        this.energy = Math.max(0, this.energy - this.energyDecayRate * 1000);
      }
      
      this.game.events.emit('energyUpdate', this.energy);
      this.lastUpdateTime = currentTime;
      
      if (this.energy <= 0) {
        this.gameOver();
        return;
      }
    }

    // Update moving obstacles
    this.updateObstacles();

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
        this.whale.setScale(0.25); // Maintain reduced size
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

  updateObstacles() {
    // Update ships
    this.ships.children.entries.forEach((ship: any) => {
      const direction = ship.getData('direction');
      
      if (direction === 'horizontal') {
        if (ship.x > ship.getData('initialX') + 200 || ship.x < ship.getData('initialX') - 200) {
          ship.setVelocityX(-ship.body.velocity.x);
        }
      } else {
        if (ship.y > ship.getData('initialY') + 100 || ship.y < ship.getData('initialY') - 100) {
          ship.setVelocityY(-ship.body.velocity.y);
        }
      }
    });

    // Update predators
    this.predators.children.entries.forEach((predator: any) => {
      const patrolStart = predator.getData('patrolStart');
      const patrolEnd = predator.getData('patrolEnd');
      
      if (predator.x >= patrolEnd || predator.x <= patrolStart) {
        const currentVel = predator.body.velocity.x;
        predator.setVelocityX(-currentVel);
        predator.setFlipX(currentVel > 0);
      }
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
  const [energy, setEnergy] = useState(100);
  const [maxEnergy] = useState(100);

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

      phaserGameRef.current.events.on('energyUpdate', (newEnergy: number) => {
        setEnergy(newEnergy);
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
        <EnergyBar energy={energy} maxEnergy={maxEnergy} />
        
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

        <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-muted-foreground border border-accent/20">
          <div>🎮 Setas: Mover | A: Interagir com corais</div>
          <div>🐟 Colete cardumes para recuperar energia (+30)</div>
          <div>⚠️ Colisão com navios (-10) ou predadores (-12) = Volta ao início!</div>
          <div>💚 Energia se regenera naturalmente ao longo do tempo</div>
        </div>
      </div>
    </div>
  );
};

export default WhaleGame;