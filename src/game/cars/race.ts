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
    /** Generation the strategy's racing car (its champion) comes from. */
    version: number;
}

export interface RaceLeagueState {
    /** Best first. */
    standings: Standing[];
    /** Number of races run so far. */
    races: number;
    last: RaceResult[];
    /** Number of the race being replayed: it is played to the end before the newest one is shown. */
    replayRace: number;
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

/** Unseen tracks a new car drives to qualify as its strategy's champion. */
export const QUALIFYING_TRACKS = 5;

interface Champion {
    brain: NeuralNetwork;
    /** Mean fitness over the qualifying tracks. */
    score: number;
    generation: number;
}

/**
 * Races between strategies, one per generation on a new track, with cumulated points. Each strategy races
 * its best car of all time, its champion: a generation's best car replaces it only if it scores better on
 * the same qualifying tracks, all unseen in training. The records cannot do that: they come from one run
 * on one track, which an easy track can win for thousands of generations.
 */
export class RaceLeague {
    /** Apart from the training seeds: every race is on a new track. */
    private readonly baseSeed = randomSeed();
    private readonly qualifyingSeeds = [...Array(QUALIFYING_TRACKS)].map((_, i) => deriveSeed(randomSeed(), i));
    private champions = new Map<string, Champion>();
    private standings = new Map<string, Standing>();
    private last: RaceResult[] = [];
    private replay: Race | null = null;
    private replayRace = 0;
    /** Newest race, shown once the replay in progress is over. */
    private next: Race | null = null;
    races = 0;

    /** Mean fitness of `brain` over the qualifying tracks, with the training step cap. */
    public qualifyingScore(brain: NeuralNetwork, obstacles: boolean): number {
        const total = this.qualifyingSeeds.reduce((sum, seed) => {
            const episode = new CarsEpisode(brain.clone(), seed, obstacles);
            while (!episode.finished()) {
                episode.step();
            }
            return sum + episode.fitness();
        }, 0);
        return total / QUALIFYING_TRACKS;
    }

    /** `brain` becomes the strategy's champion if it beats the current one on the qualifying tracks. */
    public qualify(name: string, brain: NeuralNetwork, generation: number, obstacles: boolean): void {
        const score = this.qualifyingScore(brain, obstacles);
        const champion = this.champions.get(name);
        if (champion === undefined || score > champion.score) {
            this.champions.set(name, { brain: brain.clone(), score, generation });
        }
    }

    /** One race of every champion on a new track. */
    public run(laps: number, obstacles: boolean): RaceResult[] {
        const racers = [...this.champions].map(([name, { brain }]) => ({ name, brain }));
        if (racers.length === 0) {
            return [];
        }
        const seed = deriveSeed(this.baseSeed, this.races);
        this.races = this.races + 1;
        this.last = new Race(racers, seed, laps, obstacles).run();
        this.last.forEach(({ name, place, points }) => {
            const standing = this.standings.get(name) ?? { name, points: 0, wins: 0, races: 0, version: 0 };
            this.standings.set(name, {
                ...standing,
                points: standing.points + points,
                wins: standing.wins + (place === 1 ? 1 : 0),
                races: standing.races + 1,
            });
        });
        // Same cars, same track: the replay drives the race again, at display pace.
        this.next = new Race(racers, seed, laps, obstacles);
        return this.last;
    }

    /**
     * One step of the replayed race. A race lasts longer on screen than a generation, so the replay plays
     * its race to the end, then moves to the newest one (races in between are scored, not shown).
     */
    public stepReplay(): void {
        if (this.replay === null || this.replay.done()) {
            if (this.next !== null) {
                this.replay = this.next;
                this.replayRace = this.races;
                this.next = null;
            } else {
                this.replay?.reset();
            }
        }
        this.replay?.step();
    }

    public toState(): RaceLeagueState {
        return {
            standings: [...this.standings.values()]
                .map((s) => ({ ...s, version: this.champions.get(s.name)?.generation ?? 0 }))
                .sort((a, b) => b.points - a.points || b.wins - a.wins),
            races: this.races,
            last: this.last,
            replayRace: this.replayRace,
            replay: this.replay?.toState() ?? null,
        };
    }
}
