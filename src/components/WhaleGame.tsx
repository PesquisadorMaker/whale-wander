import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import whaleSprite from '@/assets/whale.png';
import coralSprite from '@/assets/coral.png';

interface WhaleGameProps {
  className?: string;
}

class GameScene extends Phaser.Scene {
  private whale!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private isMoving = false;

  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    // Load sprites
    this.load.image('whale', whaleSprite);
    this.load.image('coral', coralSprite);
  }

  create() {
    // Create ocean gradient background
    this.createOceanBackground();

    // Add coral to the ocean floor
    this.add.image(200, 550, 'coral').setScale(0.8);
    this.add.image(600, 570, 'coral').setScale(0.6).setFlipX(true);

    // Create the whale with physics
    this.whale = this.physics.add.sprite(400, 300, 'whale');
    this.whale.setScale(0.8);
    this.whale.setCollideWorldBounds(true);
    
    // Set up keyboard controls
    this.cursors = this.input.keyboard!.createCursorKeys();

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

  createOceanBackground() {
    // Create gradient effect using multiple rectangles
    const colors = [
      0x87CEEB, // Sky blue (surface)
      0x4169E1, // Royal blue
      0x191970, // Midnight blue
      0x000080  // Navy (deep)
    ];

    for (let i = 0; i < colors.length; i++) {
      const rect = this.add.rectangle(
        400, 
        (i * 150) + 75, 
        800, 
        150, 
        colors[i]
      );
      rect.setAlpha(0.8 - i * 0.1);
    }
  }

  createBubbles() {
    // Create animated bubbles
    for (let i = 0; i < 5; i++) {
      const bubble = this.add.circle(
        Phaser.Math.Between(50, 750),
        Phaser.Math.Between(400, 600),
        Phaser.Math.Between(3, 8),
        0x87CEEB,
        0.3
      );

      this.tweens.add({
        targets: bubble,
        y: bubble.y - 400,
        duration: Phaser.Math.Between(3000, 6000),
        repeat: -1,
        ease: 'Linear',
        delay: Phaser.Math.Between(0, 3000)
      });
    }
  }

  update() {
    // Reset movement state
    this.isMoving = false;

    // Handle horizontal movement
    if (this.cursors.left?.isDown) {
      this.whale.setVelocityX(-200);
      this.whale.setFlipX(true);
      this.isMoving = true;
    } else if (this.cursors.right?.isDown) {
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
  }
}

const WhaleGame: React.FC<WhaleGameProps> = ({ className }) => {
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);

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
    }

    return () => {
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
    };
  }, []);

  return (
    <div className={className}>
      <div 
        ref={gameRef} 
        className="border-2 border-accent rounded-lg overflow-hidden shadow-2xl"
        style={{ width: '800px', height: '600px' }}
      />
    </div>
  );
};

export default WhaleGame;