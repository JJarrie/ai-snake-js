import type NeuralNetwork from '../../ai/NeuralNetwork';
import { deriveSeed, randomSeed } from '../../utils/SeededRandom';
import CarsEpisode, { MAX_STEPS } from './CarsEpisode';

/** Points by place, from the winner; places past the table score nothing. */
export const RACE_POINTS = [10, 6, 4, 3, 2, 1];

/** One car per strategy: the best of its last generation. */
export interface Racer {
    name: string;
    brain: NeuralNetwork;
}

export interface RaceResult {
    name: string;
    /** 1 for the winner. */
    place: number;
    /** Steps to drive every lap; null when the car crashed or stalled before the line. */
    time: number | null;
    /** Distance driven, in laps (fractional). */
    distance: number;
    points: number;
}

export interface RaceCarState {
    name: string;
    x: number;
    y: number;
    heading: number;
    crashed: boolean;
    finished: boolean;
}

export interface RaceView {
    seed: number;
    laps: number;
    obstacles: boolean;
    cars: RaceCarState[];
}

export interface Standing {
    name: string;
    points: number;
    wins: number;
    races: number;
}

export interface RaceLeagueState {
    /** Best first. */
    standings: Standing[];
    /** Number of races run so far. */
    races: number;
    last: RaceResult[];
    replay: RaceView | null;
}

/** Finished cars first, fastest first; then the others, furthest first. */
export const rank = (entries: { name: string; time: number | null; distance: number }[]): RaceResult[] =>
    [...entries]
        .sort((a, b) => {
            if (a.time !== null && b.time !== null) {
                return a.time - b.time;
            }
            if (a.time !== null || b.time !== null) {
                return a.time !== null ? -1 : 1;
            }
            return b.distance - a.distance;
        })
        .map((entry, i) => ({ ...entry, place: i + 1, points: RACE_POINTS[i] ?? 0 }));

/**
 * Head-to-head race on one track, `laps` laps. Cars do not collide: each drives its own episode on the
 * same track, so the race is fair and a car's result does not depend on the others.
 */
export class Race {
    readonly seed: number;
    readonly laps: number;
    readonly obstacles: boolean;
    readonly cars: { name: string; episode: CarsEpisode }[];

    constructor(racers: Racer[], seed: number, laps: number, obstacles: boolean) {
        this.seed = seed;
        this.laps = laps;
        this.obstacles = obstacles;
        this.cars = racers.map(({ name, brain }) => ({
            name,
            episode: new CarsEpisode(brain.clone(), seed, obstacles, laps * MAX_STEPS),
        }));
    }

    public finishTime(episode: CarsEpisode): number | null {
        return episode.lapSteps.length >= this.laps
            ? episode.lapSteps.slice(0, this.laps).reduce((sum, steps) => sum + steps, 0)
            : null;
    }

    public carDone(episode: CarsEpisode): boolean {
        return this.finishTime(episode) !== null || episode.finished();
    }

    public done(): boolean {
        return this.cars.every(({ episode }) => this.carDone(episode));
    }

    /** One step of every car still racing. */
    public step(): void {
        this.cars.forEach(({ episode }) => {
            if (!this.carDone(episode)) {
                episode.step();
            }
        });
    }

    public reset(): void {
        this.cars.forEach(({ episode }) => episode.reset());
    }

    /** Runs the race to the end, headless. */
    public run(): RaceResult[] {
        while (!this.done()) {
            this.step();
        }
        return this.results();
    }

    public results(): RaceResult[] {
        return rank(
            this.cars.map(({ name, episode }) => ({
                name,
                time: this.finishTime(episode),
                distance: Math.max(0, episode.bestProgress) / episode.track.center.length,
            })),
        );
    }

    public toState(): RaceView {
        return {
            seed: this.seed,
            laps: this.laps,
            obstacles: this.obstacles,
            cars: this.cars.map(({ name, episode }) => ({
                name,
                x: episode.position.x,
                y: episode.position.y,
                heading: episode.heading,
                crashed: episode.crashed,
                finished: this.finishTime(episode) !== null,
            })),
        };
    }
}

/**
 * Races between strategies on tracks never used in training, with cumulated points: a ranking of
 * all-round cars, apart from the records (one run on the generation's track, which an easy track can win).
 */
export class RaceLeague {
    /** Apart from the training seeds: every race is on a new track. */
    private readonly baseSeed = randomSeed();
    private standings = new Map<string, Standing>();
    private last: RaceResult[] = [];
    private replay: Race | null = null;
    races = 0;

    public run(racers: Racer[], laps: number, obstacles: boolean): RaceResult[] {
        const seed = deriveSeed(this.baseSeed, this.races);
        this.races = this.races + 1;
        this.last = new Race(racers, seed, laps, obstacles).run();
        this.last.forEach(({ name, place, points }) => {
            const standing = this.standings.get(name) ?? { name, points: 0, wins: 0, races: 0 };
            this.standings.set(name, {
                name,
                points: standing.points + points,
                wins: standing.wins + (place === 1 ? 1 : 0),
                races: standing.races + 1,
            });
        });
        // Same cars, same track: the replay drives the race again, at display pace.
        this.replay = new Race(racers, seed, laps, obstacles);
        return this.last;
    }

    /** One step of the last race's replay; it starts again once every car is done. */
    public stepReplay(): void {
        if (this.replay === null) {
            return;
        }
        if (this.replay.done()) {
            this.replay.reset();
        }
        this.replay.step();
    }

    public toState(): RaceLeagueState {
        return {
            standings: [...this.standings.values()].sort((a, b) => b.points - a.points || b.wins - a.wins),
            races: this.races,
            last: this.last,
            replay: this.replay?.toState() ?? null,
        };
    }
}
