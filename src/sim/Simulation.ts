import { stepInLockstep } from '../ai/lockstep';
import Population, { type PopulationState } from '../ai/Population';
import { createStrategies } from '../ai/strategy/registry';
import { RaceLeague, type RaceLeagueState } from '../game/cars/race';
import { createGame } from '../game/registry';
import { randomSeed } from '../utils/SeededRandom';
import { requiresReset, snakeVisionOf, validateSettings, type Settings } from './settings';

export interface StrategyState extends PopulationState {
    paused: boolean;
}

export interface SimulationState {
    running: boolean;
    settings: Settings;
    populations: StrategyState[];
    /** Races between strategies; car game only. */
    race: RaceLeagueState | null;
}

/** Answer to a client command: empty on success. */
export interface CommandResult {
    error?: string;
}

const CONTROLS = ['start', 'pause', 'reset'] as const;
export type Control = (typeof CONTROLS)[number];

/** All strategies trained side by side, driven by the UI: start, pause, reset, settings, per-strategy pause. */
class Simulation {
    settings: Settings;
    running = true;
    paused = new Set<string>();
    populations: Population[];
    league: RaceLeague;
    /** Last generation of each strategy whose best car tried to qualify. */
    private qualified = new Map<string, number>();
    /** Finished generations at the last race: one race per generation. */
    private lastRace = 0;
    private lastReplay = -Infinity;

    constructor(settings: Settings) {
        this.settings = settings;
        this.restart();
    }

    /** `action` comes from a client: anything else than a known control is refused. */
    public control(action: unknown): void {
        if (!CONTROLS.includes(action as Control)) {
            throw new Error(`Unknown control ${String(action)}`);
        }

        switch (action as Control) {
            case 'start':
                this.running = true;
                break;
            case 'pause':
                this.running = false;
                break;
            case 'reset':
                this.restart();
                break;
        }
    }

    /** Validates first, so invalid settings leave the simulation untouched. */
    public configure(input: unknown): void {
        const next = validateSettings(input);
        const reset = requiresReset(this.settings, next);
        this.settings = next;
        if (reset) {
            this.restart();
        }
    }

    /** Pauses or resumes one strategy; unknown names are ignored. */
    public toggle(name: unknown): void {
        if (typeof name !== 'string' || !this.populations.some((p) => p.strategy.name === name)) {
            return;
        }
        if (!this.paused.delete(name)) {
            this.paused.add(name);
        }
    }

    public tick(): void {
        if (!this.running) {
            return;
        }
        const running = this.populations.filter((p) => !this.paused.has(p.strategy.name));
        stepInLockstep(running);
        running.forEach((p) => p.measurePolicy());

        if (this.settings.game === 'cars') {
            this.race(running);
        }
    }

    /**
     * Once per finished generation: each new generation best tries to qualify as its strategy's champion,
     * then the champions race on a new track.
     */
    private race(running: Population[]): void {
        running.forEach((p) => {
            const generation = p.generation - 1;
            if (p.generationBest && generation > (this.qualified.get(p.strategy.name) ?? 0)) {
                this.qualified.set(p.strategy.name, generation);
                this.league.qualify(p.strategy.name, p.generationBest, generation, this.settings.obstacles);
            }
        });

        const finished = Math.min(...running.map((p) => p.generation)) - 1;
        if (finished > this.lastRace) {
            this.lastRace = finished;
            this.league.run(this.settings.raceLaps, this.settings.obstacles);
        }
    }

    /** Moves every record replay one step when its display interval has passed (`now` in ms). */
    public stepReplays(now: number): void {
        if (!this.running || now - this.lastReplay < 1000 / this.settings.replayMovesPerSecond) {
            return;
        }
        this.lastReplay = now;
        this.populations.forEach((p) => p.stepReplay());
        this.league.stepReplay();
    }

    public toState(): SimulationState {
        return {
            running: this.running,
            settings: this.settings,
            populations: this.populations.map((p) => ({ ...p.toState(), paused: this.paused.has(p.strategy.name) })),
            race: this.settings.game === 'cars' ? this.league.toState() : null,
        };
    }

    /** Training and races start over. */
    private restart(): void {
        this.populations = this.createPopulations();
        this.league = new RaceLeague();
        this.qualified = new Map();
        this.lastRace = 0;
    }

    private createPopulations(): Population[] {
        const { populationSize, mutationRate, boardSize, hiddenNeurons, recurrent } = this.settings;
        const game = createGame(this.settings.game, boardSize, this.settings.obstacles, snakeVisionOf(this.settings));
        // One base seed for all: at the same generation, every strategy faces the same world.
        const baseSeed = randomSeed();

        return createStrategies(mutationRate).map(
            (strategy) => new Population(populationSize, game, strategy, baseSeed, hiddenNeurons, recurrent),
        );
    }
}

export default Simulation;
