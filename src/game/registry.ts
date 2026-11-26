import { createCarsGame } from './cars/CarsEpisode';
import type { GameDefinition, GameId } from './Episode';
import { createSnakeGame } from './snake/SnakeEpisode';

export const GAME_NAMES: Record<GameId, string> = {
    snake: 'Snake',
    cars: 'Car racing',
};

export const GAME_IDS = Object.keys(GAME_NAMES) as GameId[];

export const isGameId = (value: unknown): value is GameId => GAME_IDS.includes(value as GameId);

/** `boardSize` only applies to the snake. */
export const createGame = (id: GameId, boardSize: number): GameDefinition => {
    switch (id) {
        case 'snake':
            return createSnakeGame(boardSize);
        case 'cars':
            return createCarsGame();
    }
};
