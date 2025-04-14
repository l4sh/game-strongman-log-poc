import { EventBus } from "../EventBus";
import { Scene } from "phaser";

const X_INERTIA = 0.05;
const Y_INERTIA = 0.05;

export class Game extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  background: Phaser.GameObjects.Image;
  gameText: Phaser.GameObjects.Text;

  strongman: Phaser.GameObjects.Sprite;
  log: Phaser.Physics.Matter.Image;
  ghostLog: Phaser.Physics.Matter.Image;
  boxes: Phaser.Physics.Matter.Image[];

  logWidth: number = 96;
  logHeight: number = 20;

  logXInertia: number = 0;
  logYInertia: number = 0;

  strongmanYInertia: number = 0;
  strongmanXInertia: number = 0;

  visualLines: Phaser.GameObjects.Sprite[] = [];

  cursors: Phaser.Types.Input.Keyboard.CursorKeys;

  isGameOver: boolean = false;

  constructor() {
    super("Game");
    this.logXInertia = 0;
    this.logYInertia = 0;
  }

  create() {
    this.camera = this.cameras.main;
    this.camera.setBackgroundColor(0x00ff00);

    this.background = this.add.image(0, 0, "background");
    this.background.setOrigin(0);
    this.background.setScale(3.3);
    // this.background.setAlpha(0.5);

    this.strongman = this.add
      .sprite(
        (this.game.config.width as number) * 0.5,
        (this.game.config.width as number) * 0.5,
        "strongman"
      )
      .setOrigin(0.5);
    this.strongman.setScale(4);
    this.strongman.setDepth(1);

    const logCategory = this.matter.world.nextCategory();
    const ghostLogCategory = this.matter.world.nextCategory();
    const boxCategory = this.matter.world.nextCategory();

    // Set bounds for world physics
    this.matter.world.setBounds(
      0,
      0,
      this.game.config.width as number,
      (this.game.config.height as number) * 0.97 // 90% so the log seems to fall right behind the strongman
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
    this.log.setDensity(1000);
    this.log.setCollisionCategory(logCategory);

    // Ghost log (static and invisible)
    this.ghostLog = this.matter.add.image(
      this.log.x,
      this.log.y,
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
    this.ghostLog.setScale(4);
    this.ghostLog.setStatic(true); // Make the ghost log immovable
    this.ghostLog.setVisible(false); // Hide the ghost log
    this.ghostLog.setCollisionCategory(ghostLogCategory);
    this.ghostLog.setCollidesWith([boxCategory]); // Only collide with boxes

    this.logXInertia = 0;
    this.logYInertia = 0;
    this.strongmanYInertia = 0;
    this.strongmanXInertia = 0;
    this.isGameOver = false;

    // add between 1-3 boxes on top of the log, these are controlled by matter physics
    const boxCount = Phaser.Math.Between(1, 5);

    this.boxes = Array.from({ length: boxCount }, (_, i) => {
      const box = this.matter.add.image(
        this.log.x,
        this.log.y - this.logHeight * 2 - 100 * i,
        "box",
        undefined,
        {
          shape: {
            type: "rectangle",
            width: 16,
            height: 16,
          },
        }
      );
      box.setScale(4);
      box.setOrigin(0.5);
      box.setFrictionAir(0);
      box.setMass(0.0001);
      box.setBounce(0);
      box.setAngle(0);
      box.setIgnoreGravity(false);
      box.setVelocity(0, 0);
      box.setAngularVelocity(0);

      box.setCollisionCategory(boxCategory);
      // Disable collisions between boxes and the main log
      box.setCollidesWith([ghostLogCategory, boxCategory]); // Only collide with the ghost log
      return box;
    });

    //

    const lineCount = 6;

    this.visualLines = Array.from({ length: lineCount }, (_, i) => {
      // X Position is random but between 0.33 and 0.66 of the screen
      const Yoffset = (this.game.config.height as number) * 0.6;

      let posX = (this.game.config.width as number) * 0.5;
      posX += i % 2 === 0 ? -30 * i : 30 * i;
      const posY = Yoffset + i * 50;

      const line = this.add.sprite(posX, posY, "line");

      line.setOrigin(0.5);
      line.setScale(3);
      line.setAlpha(0.5);
      return line;
    });

    // Keyboard input
    this.cursors = this.input.keyboard.createCursorKeys();

    EventBus.emit("current-scene-ready", this);
  }

  update() {
    // Make inertia grow over time

    if (this.cursors.left.isDown && !this.isGameOver) {
      this.logXInertia -= X_INERTIA;
      this.log.setAngularVelocity(this.logXInertia / 100);
    } else if (this.cursors.right.isDown && !this.isGameOver) {
      this.logXInertia += X_INERTIA;
      this.log.setAngularVelocity(this.logXInertia / 100);
    }

    if (this.cursors.up.isDown && !this.isGameOver) {
      this.strongmanYInertia -= Y_INERTIA;
      this.logYInertia -= Y_INERTIA;
    } else if (this.cursors.down.isDown && !this.isGameOver) {
      this.strongmanYInertia += Y_INERTIA;
      this.logYInertia += Y_INERTIA;
    } else if (this.cursors.space.isDown && !this.isGameOver) {
      this.strongmanYInertia = 0;
      this.logYInertia = 0;
    }

    if (!this.isGameOver) {
      // Even if cursors are not pressed the log should keep moving
      if (this.logXInertia === 0) {
        this.logXInertia = (Math.random() - 0.5) / 10;
      }

      this.logXInertia *= 1.01;
      this.log.setAngularVelocity(this.logXInertia / 100);

      this.logYInertia *= 1.01;
      this.strongmanYInertia *= 1.01;
    }

    // Depending on logXInertia update the x position of the log and the strongman
    const Xposition = this.log.x + this.log.angle * 0.05;
    // this.log.setPosition(this.log.x + this.logXInertia, this.log.y);
    const strongmanYPosition = this.strongman.y + this.strongmanYInertia;
    const logYPosition = this.log.y + (this.isGameOver ? 0 : this.logYInertia);

    this.log.setPosition(Xposition, logYPosition); // Update log's Y position based on inertia

    if (!this.isGameOver) {
      this.strongman.setPosition(Xposition, strongmanYPosition);
      this.boxes.forEach((box) => {
        // Update boxes position relative to the log while the game is not over
        const boxPosition = box.x + this.log.angle * 0.05;
        box.setPosition(boxPosition, box.y);
      });
    }

    if (!this.isGameOver && (this.log.angle > 25 || this.log.angle < -25)) {
      // Make log fall
      this.log.setIgnoreGravity(false);
      this.isGameOver = true;
    }

    // Positions used to trigger walk forward and backward
    const strongmanForwardPos = (this.game.config.height as number) / 2 + 120; // 120
    const strongmanBackwardPos = (this.game.config.height as number) / 2 + 155;

    if (
      !this.isGameOver &&
      (this.strongman.y < strongmanForwardPos - 100 ||
        this.strongman.y > strongmanBackwardPos + 50)
    ) {
      // Jiggle the log if player goes too far forwards or backwards
      const newAngularVelocity = Math.random() - 0.5;

      this.log.setAngularVelocity(newAngularVelocity);
    }

    const halfScreenX = (this.game.config.width as number) / 2;

    if (
      !this.isGameOver &&
      (this.strongman.y < strongmanForwardPos ||
        this.strongman.y > strongmanBackwardPos)
    ) {
      // Strongman moves forward, lines move down

      this.visualLines.forEach((line) => {
        const isStrongmanAdvancing = this.strongman.y < strongmanForwardPos;

        let ySpeedRatio = isStrongmanAdvancing
          ? strongmanForwardPos / this.strongman.y
          : this.strongman.y / strongmanBackwardPos;
        ySpeedRatio *= 1.5;
        console.log("ySpeedRatio", ySpeedRatio);
        // If the strongman is moving forward, the lines should separate otherwise they should come together
        let xDiff = line.x < halfScreenX ? -1 : 1;
        xDiff = isStrongmanAdvancing ? xDiff : -xDiff;
        const yDiff = this.strongman.y < strongmanForwardPos ? 1.1 : -1.1;
        line.setPosition(line.x + xDiff * 0.2, line.y + yDiff * ySpeedRatio);
      });
    }

    // Move lines to the top if they go out of bounds
    this.visualLines.forEach((line) => {
      const newTopXPos =
        line.x < halfScreenX ? halfScreenX - 0.1 : halfScreenX + 0.1;
      const newBottomXPos =
        line.x > halfScreenX ? halfScreenX + 100 : halfScreenX - 100;
      if (line.y > (this.game.config.height as number)) {
        line.setPosition(newTopXPos, (this.game.config.height as number) * 0.6);
      } else if (line.y < (this.game.config.height as number) * 0.6) {
        line.setPosition(newBottomXPos, this.game.config.height as number);
      }
    });
    // if (this.strongmanYInertia > 0.5) {

    // // If log is touching ground, stop it
    // if (this.log.y > (this.game.config.height as number) - this.logHeight * 8) {
    //   console.log("Log is touching ground");
    //   this.log.setVelocity(0, 0);
    // }

    this.ghostLog.setPosition(this.log.x, this.log.y);
    this.ghostLog.setAngle(this.log.angle);
  }

  changeScene() {
    this.scene.start("GameOver");
  }
}
