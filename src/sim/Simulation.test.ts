import { describe, expect, it } from 'vitest';
import type { Settings } from './settings';
import Simulation from './Simulation';

const settings: Settings = {
    populationSize: 10,
    mutationRate: 0.05,
    boardSize: 12,
    hiddenNeurons: 6,
    replayMovesPerSecond: 10,
};

const lifetime = (simulation: Simulation) => simulation.populations[0].games[0].snake.lifetime;

describe('Simulation', () => {
    it('builds every strategy from the settings', () => {
        const simulation = new Simulation(settings);
        const game = simulation.populations[0].games[0];

        expect(simulation.populations).toHaveLength(6);
        expect(simulation.populations[0].games).toHaveLength(10);
        expect(game.boardSize.width).toBe(12);
        expect(game.snake.neuralNetwork.hiddenLayers).toEqual([6]);
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
        expect(simulation.populations[0].boardSize.width).toBe(15);
    });

    it('keeps its settings when the new ones are invalid', () => {
        const simulation = new Simulation(settings);

        expect(() => simulation.configure({ ...settings, boardSize: 1000 })).toThrow();
        expect(simulation.settings).toEqual(settings);
    });

    it('moves the replays at the configured pace, only while running', () => {
        const simulation = new Simulation(settings);
        const replay = () => simulation.populations[0].bestGame.snake.lifetime;

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
