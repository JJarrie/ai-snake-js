import { createCarsGame } from './cars/CarsEpisode';
import type { GameDefinition, GameId } from './Episode';
import { createSnakeGame, RAYS, type SnakeVisionConfig } from './snake/SnakeEpisode';

export const GAME_NAMES: Record<GameId, string> = {
    snake: 'Snake',
    cars: 'Car racing',
};

export const GAME_IDS = Object.keys(GAME_NAMES) as GameId[];

export const isGameId = (value: unknown): value is GameId => GAME_IDS.includes(value as GameId);

/**
 * `boardSize` and `snakeVision` only apply to the snake; obstacles are walls for the snake, cones
 * for the cars.
 */
export const createGame = (
    id: GameId,
    boardSize: number,
    obstacles = false,
    snakeVision: SnakeVisionConfig = RAYS,
): GameDefinition => {
    switch (id) {
        case 'snake':
            return createSnakeGame(boardSize, obstacles, snakeVision);
        case 'cars':
            return createCarsGame(obstacles);
    }
};
