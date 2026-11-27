import { describe, expect, it } from 'vitest';
import NeuralNetwork from '../../ai/NeuralNetwork';
import Matrix from '../../utils/Matrix';
import { RAY_ANGLES, THROTTLE_ACTIONS, type ThrottleAction } from './CarsEpisode';
import { Race, RACE_POINTS, RaceLeague, rank } from './race';

/** Drives straight ahead with one pedal action: zero weights, output biases only. */
const pedalBrain = (action: ThrottleAction): NeuralNetwork => {
    const network = new NeuralNetwork(RAY_ANGLES.length + 1, [4], 1 + THROTTLE_ACTIONS.length);
    network.weights = network.weights.map((w) => new Matrix(w.rows, w.cols));
    network.weights.forEach((w) => (w.matrix = w.matrix.map((row) => row.map(() => 0))));
    const last = network.weights[network.weights.length - 1];
    last.matrix[1 + THROTTLE_ACTIONS.indexOf(action)][last.cols - 1] = 1;
    return network;
};

describe('rank', () => {
    it('puts finishers first by time, then the others by distance, with points by place', () => {
        const results = rank([
            { name: 'crashed early', time: null, distance: 0.2 },
            { name: 'slow', time: 300, distance: 1 },
            { name: 'crashed late', time: null, distance: 0.8 },
            { name: 'fast', time: 200, distance: 1 },
        ]);

        expect(results.map((r) => r.name)).toEqual(['fast', 'slow', 'crashed late', 'crashed early']);
        expect(results.map((r) => r.place)).toEqual([1, 2, 3, 4]);
        expect(results.map((r) => r.points)).toEqual(RACE_POINTS.slice(0, 4));
    });
});

describe('Race', () => {
    it('ranks the car that drives further ahead of the one standing still', () => {
        const race = new Race(
            [
                { name: 'still', brain: pedalBrain('hold') },
                { name: 'driver', brain: pedalBrain('accelerate') },
            ],
            3,
            1,
            false,
        );

        const results = race.run();

        expect(race.done()).toBe(true);
        expect(results.map((r) => r.name)).toEqual(['driver', 'still']);
        expect(results[0].distance).toBeGreaterThan(0);
        expect(results[1].distance).toBe(0);
    });

    it('stops a car once it has driven every lap, its time being the sum of its laps', () => {
        const race = new Race([{ name: 'a', brain: pedalBrain('accelerate') }], 3, 2, false);
        const { episode } = race.cars[0];
        episode.lapSteps = [120, 100];

        race.step();

        expect(episode.steps).toBe(0);
        expect(race.done()).toBe(true);
        expect(race.results()[0].time).toBe(220);
    });

    it('lets a race car drive past the training step cap', () => {
        const race = new Race([{ name: 'a', brain: pedalBrain('hold') }], 3, 3, false);
        expect(race.cars[0].episode.maxSteps).toBe(3000);
    });
});

describe('RaceLeague', () => {
    it('adds up points and wins over races on new tracks, and replays the last race', () => {
        const league = new RaceLeague();
        const racers = [
            { name: 'still', brain: pedalBrain('hold') },
            { name: 'driver', brain: pedalBrain('accelerate') },
        ];

        league.run(racers, 1, false);
        const firstTrack = league.toState().replay?.seed;
        league.run(racers, 1, false);
        const state = league.toState();

        expect(state.races).toBe(2);
        expect(state.replay?.seed).not.toBe(firstTrack);
        expect(state.standings).toEqual([
            { name: 'driver', points: 2 * RACE_POINTS[0], wins: 2, races: 2 },
            { name: 'still', points: 2 * RACE_POINTS[1], wins: 0, races: 2 },
        ]);

        const start = state.replay?.cars[1];
        league.stepReplay();
        expect(league.toState().replay?.cars[1].x).not.toBe(start?.x);
    });
});
