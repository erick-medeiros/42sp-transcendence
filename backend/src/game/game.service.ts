import { Injectable, NotFoundException } from '@nestjs/common';
import { GameRoom } from './game.interface';
import { GameEntity, GameStatus } from '../core/entities/game.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../core/entities';
import { Server } from 'socket.io';
import { PowerUp } from './PowerUp';

@Injectable()
export class GameService {
  gamesInMemory: Record<number, GameRoom>;

  server: Server;

  windowWidth = 700;
  windowHeight = 600;

  constructor(
    @InjectRepository(GameEntity)
    private readonly gameRepository: Repository<GameEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {
    this.gamesInMemory = {};

    this.loadGames();
  }

  setServer(server: Server) {
    this.server = server;
  }

  async findAll(): Promise<GameEntity[]> {
    return await this.gameRepository.find({
      relations: {
        playerOne: true,
        playerTwo: true,
        winner: true,
        loser: true,
      },
    });
  }

  async findOne(id: number): Promise<GameEntity> {
    const game = await this.gameRepository.findOne({
      where: {
        id,
      },
      relations: {
        playerOne: true,
        playerTwo: true,
        winner: true,
        loser: true,
      },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    return game;
  }

  async loadGames() {
    const games = await this.gameRepository.find({
      where: {
        status: GameStatus.START,
      },
      relations: {
        playerOne: true,
        playerTwo: true,
      },
    });

    for (const game of games) {
      this.gamesInMemory[game.id] = this.resetDataGame(
        game.id,
        game.playerOne,
        game.playerTwo,
      );
    }
  }

  resetDataGame(
    gameId: number,
    userOne: UserEntity,
    userTwo: UserEntity,
  ): GameRoom {
    const maxScore = this.gamesInMemory[gameId]?.maxScore ?? 10;
    const playerOneScore = this.gamesInMemory[gameId]?.playerOne.score ?? 0;
    const playerTwoScore = this.gamesInMemory[gameId]?.playerTwo.score ?? 0;

    const windowWidth = 700;
    const windowHeight = 600;

    return {
      gameId,
      maxScore,
      windowWidth,
      windowHeight,
      playerOne: {
        playerType: 'left',
        score: playerOneScore,
        user: userOne,
        paddle: {
          x: 10,
          y: this.windowHeight / 2,
          width: 10,
          height: 100,
        },
      },
      playerTwo: {
        playerType: 'right',
        score: playerTwoScore,
        user: userTwo,
        paddle: {
          x: windowWidth - 20,
          y: this.windowHeight / 2,
          width: 10,
          height: 100,
        },
      },
      ball: {
        x: this.windowWidth / 2,
        y: this.windowHeight / 2,
        speedX: this.getRandomElement([-3, 3]),
        speedY: this.getRandomElement([-3, 3]),
        radius: 16,
        speedFactor: 1.075,
        verticalAdjustmentFactor: 8,
      },
      powerUp: new PowerUp(windowWidth),
    };
  }

  getRandomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  async newGame(user1: UserEntity, user2: UserEntity) {
    const game = await this.gameRepository.save({
      playerOne: user1,
      playerTwo: user2,
    });

    this.gamesInMemory[game.id] = this.resetDataGame(game.id, user1, user2);

    return this.gamesInMemory[game.id];
  }

  async updateGame() {
    Object.keys(this.gamesInMemory).forEach((gameId) => {
      const game: GameRoom = this.gamesInMemory[gameId];

      const shouldSpawnPowerUp: boolean = Math.random() < 0.005;
      if (shouldSpawnPowerUp && !game.powerUp.active) {
        game.powerUp.spawnRandom(game);
      }

      game.ball.x += game.ball.speedX;
      game.ball.y += game.ball.speedY;

      if (
        game.ball.y < 0 + game.ball.radius ||
        game.ball.y > this.windowHeight - game.ball.radius
      ) {
        game.ball.speedY = -game.ball.speedY;
      }

      if (game.ball.x <= 0) {
        game.playerTwo.score++;
        return this.gainedAPoint(game.gameId);
      } else if (game.ball.x >= this.windowWidth) {
        game.playerOne.score++;
        return this.gainedAPoint(game.gameId);
      }

      for (const player of [game.playerOne, game.playerTwo]) {
        if (!player) {
          continue;
        }
        const paddle = player.paddle;

        const ballInXRange =
          game.ball.x + game.ball.radius > paddle.x &&
          game.ball.x - game.ball.radius < paddle.x + paddle.width;

        const ballInYRange =
          game.ball.y + game.ball.radius > paddle.y &&
          game.ball.y - game.ball.radius < paddle.y + paddle.height;

        if (ballInXRange && ballInYRange) {
          game.ball.speedX = -game.ball.speedX;
          game.ball.speedX *= game.ball.speedFactor;

          const relativeCollision =
            (game.ball.y - paddle.y) / paddle.height - 0.5;
          game.ball.speedY =
            relativeCollision * game.ball.verticalAdjustmentFactor;
          game.ball.speedY *= game.ball.speedFactor;
        }
      }

      const powerUpHit =
        Math.sqrt(
          Math.pow(game.ball.x - game.powerUp.x, 2) +
            Math.pow(game.ball.y - game.powerUp.y, 2),
        ) <
        game.ball.radius + game.powerUp.radius;
      if (powerUpHit) {
        game.powerUp.activate(game);
        this.server?.to(`game:${gameId}`).emit('pup');
      }

      this.server?.to(`game:${gameId}`).emit('updateBallPosition', {
        x: game.ball.x,
        y: game.ball.y,
        radius: game.ball.radius,
      });

      this.server?.to(`game:${gameId}`).emit('updatePowerUp', {
        x: game.powerUp.x,
        y: game.powerUp.y,
        active: game.powerUp.active,
      });
    });
  }

  async gainedAPoint(gameId: number) {
    const { playerOne, playerTwo, maxScore } = this.gamesInMemory[gameId];

    if (playerOne.score >= maxScore || playerTwo.score >= maxScore) {
      const finishedGame = await this.finishGame(gameId);
      this.server?.to(`game:${gameId}`).emit('gameOver', finishedGame);
      this.updatePlayerStats(playerOne.user.id);
      this.updatePlayerStats(playerTwo.user.id);
      return;
    }

    this.gamesInMemory[gameId] = this.resetDataGame(
      gameId,
      playerOne.user,
      playerTwo.user,
    );

    this.emitUpdatePlayerPosition(gameId);
  }

  async updatePlayerStats(userId: number) {
    const winCount = await this.gameRepository.countBy({
      winner: { id: userId },
    });
    const loseCount = await this.gameRepository.countBy({
      loser: { id: userId },
    });
    const totalMatchPointsAsOne = await this.gameRepository.sum(
      'playerOneMatchPoints',
      { playerOne: { id: userId } },
    );
    const totalMatchPointsAsTwo = await this.gameRepository.sum(
      'playerTwoMatchPoints',
      { playerTwo: { id: userId } },
    );
    const totalMatchPoints = totalMatchPointsAsOne + totalMatchPointsAsTwo;
    await this.userRepository.update(
      { id: userId },
      { winCount, loseCount, totalMatchPoints },
    );
  }

  async finishGame(gameId: number) {
    this.emitUpdatePlayerPosition(gameId);

    let winner: UserEntity;
    let loser: UserEntity;
    let playerOneMatchPoints: number;
    let playerTwoMatchPoints: number;

    const game = this.gamesInMemory[gameId];
    delete this.gamesInMemory[gameId];

    const status = GameStatus.FINISH;
    const playerOneScore = game.playerOne.score;
    const playerTwoScore = game.playerTwo.score;

    if (playerOneScore > playerTwoScore) {
      winner = game.playerOne.user;
      loser = game.playerTwo.user;
      playerOneMatchPoints = playerOneScore * 10 + 30;
      playerTwoMatchPoints = playerTwoScore * 10 - 20;
    } else {
      winner = game.playerTwo.user;
      loser = game.playerOne.user;
      playerTwoMatchPoints = playerTwoScore * 10 + 30;
      playerOneMatchPoints = playerOneScore * 10 - 20;
    }

    await this.gameRepository.update(gameId, {
      status,
      winner,
      loser,
      playerOneScore,
      playerTwoScore,
      playerOneMatchPoints,
      playerTwoMatchPoints,
    });
    return await this.findOne(gameId);
  }

  movePlayers(
    userId: number,
    body: {
      up: boolean;
      down: boolean;
      gameId: number;
    },
  ) {
    if (!this.gamesInMemory[body.gameId]) {
      return;
    }

    const position =
      this.gamesInMemory[body.gameId].playerOne.user.id == userId ? 0 : 1;

    const player =
      position == 0
        ? this.gamesInMemory[body.gameId].playerOne
        : this.gamesInMemory[body.gameId].playerTwo;

    const movementfactor = 20;

    if (body.up) {
      if (player.paddle.y < 10) {
        player.paddle.y = 0;
      } else {
        player.paddle.y -= movementfactor;
      }
    }
    if (body.down) {
      if (player.paddle.y > this.windowHeight - 100 - 10) {
        player.paddle.y = this.windowHeight - 100;
      } else {
        player.paddle.y += movementfactor;
      }
    }

    if (position == 0) {
      this.gamesInMemory[body.gameId].playerOne = player;
    } else {
      this.gamesInMemory[body.gameId].playerTwo = player;
    }

    this.emitUpdatePlayerPosition(body.gameId);
  }

  emitUpdatePlayerPosition(gameId: number) {
    this.server
      ?.to(`game:${gameId}`)
      .emit('updatePlayerPosition', [
        this.gamesInMemory[gameId].playerOne,
        this.gamesInMemory[gameId].playerTwo,
      ]);
  }

  async getAllGames(userId: number) {
    const games = await this.gameRepository.find({
      relations: { playerOne: true, playerTwo: true },
      where: [{ playerOne: { id: userId } }, { playerTwo: { id: userId } }],
    });
    return games;
  }
}
