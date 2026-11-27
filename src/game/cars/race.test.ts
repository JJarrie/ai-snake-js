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
    const league2 = () => {
        const league = new RaceLeague();
        league.qualify('still', pedalBrain('hold'), 1, false);
        league.qualify('driver', pedalBrain('accelerate'), 1, false);
        return league;
    };

    it('keeps a new car as champion only if it scores better on the qualifying tracks', () => {
        const league = new RaceLeague();
        const still = pedalBrain('hold');
        const driver = pedalBrain('accelerate');
        expect(league.qualifyingScore(driver, false)).toBeGreaterThan(league.qualifyingScore(still, false));

        league.qualify('a', still, 1, false);
        league.qualify('a', driver, 2, false);
        league.qualify('a', still, 3, false);
        league.run(1, false);

        expect(league.toState().standings[0].version).toBe(2);
    });

    it('races every champion on a new track each time and adds up points and wins', () => {
        const league = league2();

        league.run(1, false);
        league.stepReplay();
        const firstTrack = league.toState().replay?.seed;
        league.run(1, false);
        const state = league.toState();

        expect(state.races).toBe(2);
        expect(state.last.map((r) => r.name)).toEqual(['driver', 'still']);
        expect(state.standings).toEqual([
            { name: 'driver', points: 2 * RACE_POINTS[0], wins: 2, races: 2, version: 1 },
            { name: 'still', points: 2 * RACE_POINTS[1], wins: 0, races: 2, version: 1 },
        ]);
        // Race 1 is still on screen: it is played to the end before race 2 is shown.
        expect(state.replayRace).toBe(1);
        expect(state.replay?.seed).toBe(firstTrack);
    });

    it('moves the replay to the newest race once the current one is over', () => {
        const league = league2();
        league.run(1, false);
        league.stepReplay();
        league.run(1, false);
        league.run(1, false);

        for (let i = 0; i < 5000 && league.toState().replayRace === 1; ++i) {
            league.stepReplay();
        }

        expect(league.toState().replayRace).toBe(3);
    });
});
