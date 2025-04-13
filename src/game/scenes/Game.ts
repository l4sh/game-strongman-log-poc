import { EventBus } from "../EventBus";
import { Scene } from "phaser";

export class Game extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  background: Phaser.GameObjects.Image;
  gameText: Phaser.GameObjects.Text;

  strongman: Phaser.GameObjects.Sprite;
  log: Phaser.Physics.Matter.Image;

  logWidth: number = 64;
  logHeight: number = 18;

  logXInertia: number = 0;
  logYInertia: number = 0;
  logAngle: number = 0;
  cursors: Phaser.Types.Input.Keyboard.CursorKeys;

  isGameOver: boolean = false;

  constructor() {
    super("Game");
    this.logXInertia = 0;
    this.logYInertia = 0;
    this.logAngle = 0;
  }

  create() {
    this.camera = this.cameras.main;
    this.camera.setBackgroundColor(0x00ff00);

    this.background = this.add.image(512, 384, "background");
    this.background.setAlpha(0.5);

    this.strongman = this.add
      .sprite(
        (this.game.config.width as number) * 0.5,
        (this.game.config.width as number) * 0.5,
        "strongman"
      )
      .setOrigin(0.5);
    this.strongman.setScale(4);
    this.strongman.setDepth(1);

    // Set bounds for world physics
    this.matter.world.setBounds(
      0,
      0,
      this.game.config.width as number,
      (this.game.config.height as number) * 0.9 // 90% so the log seems to fall right behind the strongman
    );

    this.log = this.matter.add.image(
      (this.game.config.width as number) * 0.5,
      (this.game.config.width as number) * 0.5 -
        this.strongman.height -
        this.logHeight * 2,
      "log-wide",
      undefined,
      {
        shape: {
          type: "rectangle",
          width: this.logWidth,
          height: this.logHeight,
        },
      }
    );
    this.log.setIgnoreGravity(true); // TODO: Maybe use this to slam the log on passing level??
    this.log.setScale(4);
    this.log.setDepth(1);
    // Set log gravity to 0
    this.log.setFrictionAir(0);
    this.log.setMass(1);
    this.log.setOrigin(0.5);
    this.log.setBounce(0);
    this.log.setAngle(0);

    this.logXInertia = 0;
    this.logYInertia = 0;
    this.isGameOver = false;

    // Keyboard input
    this.cursors = this.input.keyboard.createCursorKeys();

    EventBus.emit("current-scene-ready", this);
  }

  update() {
    // Make inertia grow over time

    if (this.cursors.left.isDown && !this.isGameOver) {
      this.logXInertia -= 0.1;
      this.log.setAngularVelocity(this.logXInertia / 100);
    } else if (this.cursors.right.isDown && !this.isGameOver) {
      this.logXInertia += 0.1;
      this.log.setAngularVelocity(this.logXInertia / 100);
    }

    if (!this.isGameOver) {
      // Even if cursors are not pressed the log should keep moving
      this.logXInertia *= 1.01;
      this.log.setAngularVelocity(this.logXInertia / 100);
    }

    // Depending on logXInertia update the x position of the log and the strongman
    const Xposition = this.log.x + this.log.angle * 0.05;
    // this.log.setPosition(this.log.x + this.logXInertia, this.log.y);
    this.log.setPosition(Xposition, this.log.y);

    if (!this.isGameOver) {
      this.strongman.setPosition(Xposition, this.strongman.y);
    }

    if (!this.isGameOver && (this.log.angle > 25 || this.log.angle < -25)) {
      // Make log fall
      this.log.setIgnoreGravity(false);
      this.isGameOver = true;
    }

    // If log is touching ground, stop it
    if (this.log.y > (this.game.config.height as number) - this.logHeight * 6) {
      console.log("Log is touching ground");
      this.log.setVelocity(0, 0);
    }
  }

  changeScene() {
    this.scene.start("GameOver");
  }
}
