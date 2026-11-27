import { describe, expect, it } from 'vitest';
import type { Episode } from '../game/Episode';
import type SnakeEpisode from '../game/snake/SnakeEpisode';
import type { Settings } from './settings';
import Simulation from './Simulation';

const settings: Settings = {
    populationSize: 10,
    mutationRate: 0.05,
    boardSize: 12,
    hiddenNeurons: 6,
    replayMovesPerSecond: 10,
    game: 'snake',
    obstacles: false,
    recurrent: false,
    vision: 'rays',
    visionRange: 10,
    visionFov: 180,
    visionSectors: 7,
    raceLaps: 1,
};

const snakeGame = (episode: Episode) => (episode as SnakeEpisode).game;
const lifetime = (simulation: Simulation) => snakeGame(simulation.populations[0].episodes[0]).snake.lifetime;

describe('Simulation', () => {
    it('builds every strategy from the settings', () => {
        const simulation = new Simulation(settings);
        const episode = simulation.populations[0].episodes[0];

        expect(simulation.populations).toHaveLength(6);
        expect(simulation.populations[0].episodes).toHaveLength(10);
        expect(snakeGame(episode).boardSize.width).toBe(12);
        expect(episode.brain.hiddenLayers).toEqual([6]);
    });

    it('trains only while running', () => {
        const simulation = new Simulation(settings);

        simulation.control('pause');
        simulation.tick();
        expect(lifetime(simulation)).toBe(0);

        simulation.control('start');
        simulation.tick();
        expect(lifetime(simulation)).toBe(1);
    });

    it('reset starts new populations and keeps the running state', () => {
        const simulation = new Simulation(settings);
        const before = simulation.populations[0];
        simulation.control('pause');

        simulation.control('reset');

        expect(simulation.populations[0]).not.toBe(before);
        expect(simulation.running).toBe(false);
    });

    it('ignores unknown control actions and strategy names', () => {
        const simulation = new Simulation(settings);

        expect(() => simulation.control('explode')).toThrow();
        simulation.toggle('Nope');
        simulation.toggle(42);

        expect(simulation.paused.size).toBe(0);
    });

    it('applies a replay speed change live and resets for anything else', () => {
        const simulation = new Simulation(settings);
        const before = simulation.populations[0];

        simulation.configure({ ...settings, replayMovesPerSecond: 30 });
        expect(simulation.populations[0]).toBe(before);
        expect(simulation.settings.replayMovesPerSecond).toBe(30);

        simulation.configure({ ...settings, replayMovesPerSecond: 30, boardSize: 15 });
        expect(simulation.populations[0]).not.toBe(before);
        expect(snakeGame(simulation.populations[0].episodes[0]).boardSize.width).toBe(15);
    });

    it('switches every strategy to another game with the same algorithms', () => {
        const simulation = new Simulation(settings);

        simulation.configure({ ...settings, game: 'cars' });

        simulation.populations.forEach((p) => {
            expect(p.game.id).toBe('cars');
            expect(p.episodes[0].brain.inputsNodes).toBe(8);
        });
        simulation.tick();
        expect(simulation.toState().populations[0].replay.view.kind).toBe('cars');
    });

    it('races the strategy champions once per generation in the car game, never in snake', () => {
        const snake = new Simulation(settings);
        expect(snake.toState().race).toBeNull();

        const simulation = new Simulation({ ...settings, game: 'cars' });
        while (simulation.populations[0].generation <= 3) {
            simulation.tick();
        }
        const { race } = simulation.toState();

        expect(race?.races).toBe(3);
        expect(race?.standings.map((s) => s.name).sort()).toEqual(
            simulation.populations.map((p) => p.strategy.name).sort(),
        );
        expect(race?.last).toHaveLength(6);

        simulation.control('reset');
        expect(simulation.toState().race?.races).toBe(0);
    });

    it('gives every snake a field of view after a reset, with matching network inputs', () => {
        const simulation = new Simulation(settings);

        simulation.configure({ ...settings, vision: 'cone', visionSectors: 5 });

        simulation.populations.forEach((p) => {
            expect(p.game.inputs).toBe(15);
            expect(p.episodes[0].brain.inputsNodes).toBe(15);
        });
    });

    it('gives every strategy memory after a reset', () => {
        const simulation = new Simulation(settings);

        simulation.configure({ ...settings, recurrent: true });

        simulation.populations.forEach((p) => expect(p.episodes[0].brain.recurrent).toBe(true));
    });

    it('turns obstacles on for every strategy after a reset', () => {
        const simulation = new Simulation(settings);
        expect(snakeGame(simulation.populations[0].episodes[0]).withObstacles).toBe(false);

        simulation.configure({ ...settings, obstacles: true });

        simulation.populations.forEach((p) => {
            // The flag, not the wall count: on a small board a seed can put every wall in the start area.
            expect(snakeGame(p.episodes[0]).withObstacles).toBe(true);
        });
    });

    it('keeps its settings when the new ones are invalid', () => {
        const simulation = new Simulation(settings);

        expect(() => simulation.configure({ ...settings, boardSize: 1000 })).toThrow();
        expect(simulation.settings).toEqual(settings);
    });

    it('moves the replays at the configured pace, only while running', () => {
        const simulation = new Simulation(settings);
        const replay = () => snakeGame(simulation.populations[0].replay).snake.lifetime;

        simulation.stepReplays(1000);
        simulation.stepReplays(1050);
        expect(replay()).toBe(1);

        simulation.stepReplays(1100);
        expect(replay()).toBe(2);

        simulation.control('pause');
        simulation.stepReplays(2000);
        expect(replay()).toBe(2);
    });
});
