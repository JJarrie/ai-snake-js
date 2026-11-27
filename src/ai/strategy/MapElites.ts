import type NeuralNetwork from '../NeuralNetwork';
import Gaussian from '../../utils/Gaussian';
import type { Random } from '../../utils/SeededRandom';
import type EvolutionStrategy from './EvolutionStrategy';
import type { Evaluated } from './EvolutionStrategy';

interface Elite {
    brain: NeuralNetwork;
    fitness: number;
    behavior: number[];
}

/** Parent selection: uniform over the archive, or a binary tournament on novelty. */
export type Selection = 'uniform' | 'novelty';

/**
 * Novelty of each behaviour (Lehman & Stanley, 2011): mean distance to its k nearest neighbours
 * among the others. High in sparse regions of the behaviour space.
 */
export const noveltyScores = (behaviors: number[][], k: number): number[] =>
    behaviors.map((b, i) => {
        const distances = behaviors
            .filter((_, j) => j !== i)
            .map((o) => Math.hypot(...b.map((v, d) => v - o[d])))
            .sort((x, y) => x - y)
            .slice(0, k);

        return distances.length > 0 ? distances.reduce((s, d) => s + d, 0) / distances.length : 0;
    });

/**
 * MAP-Elites (Mouret & Clune, 2015): an archive keeps the best individual of each behaviour cell
 * (here turn rate x left share), and new individuals are mutations of elites. It favours diverse
 * ways of playing over a single champion. With novelty selection, elites in sparse regions of the
 * behaviour space are picked more often, pushing the archive toward unexplored behaviours.
 */
class MapElites implements EvolutionStrategy {
    readonly name: string;
    selection: Selection;
    resolution: number;
    sigma: number;
    neighbours: number;
    cells: (Elite | null)[][];

    constructor(selection: Selection = 'uniform', resolution = 10, sigma = 0.05, neighbours = 5) {
        this.name = selection === 'novelty' ? 'MAP-Elites (novelty)' : 'MAP-Elites';
        this.selection = selection;
        this.resolution = resolution;
        this.sigma = sigma;
        this.neighbours = neighbours;
        this.cells = [...Array(resolution)].map(() => new Array<Elite | null>(resolution).fill(null));
    }

    public nextGeneration(evaluated: Evaluated[], best: NeuralNetwork, random: Random): NeuralNetwork[] {
        evaluated.forEach((e) => this.insert(e));

        const elites = this.cells.flat().filter((e): e is Elite => e !== null);
        const novelty =
            this.selection === 'novelty'
                ? noveltyScores(
                      elites.map((e) => e.behavior),
                      this.neighbours,
                  )
                : [];
        const randomIndex = () => Math.floor(random() * elites.length);
        const pickParent = (): NeuralNetwork => {
            const a = randomIndex();
            if (this.selection === 'uniform') {
                return elites[a].brain;
            }
            const b = randomIndex();

            return elites[novelty[a] >= novelty[b] ? a : b].brain;
        };
        const next = [best.clone()];

        while (next.length < evaluated.length) {
            const parent = pickParent();
            next.push(parent.fromVector(parent.toVector().map((w) => w + this.sigma * Gaussian.random(random))));
        }

        return next;
    }

    /** The fittest archived elite, as MAP-Elites would deploy it. */
    public policy(): NeuralNetwork | null {
        const elites = this.cells.flat().filter((e): e is Elite => e !== null);
        if (elites.length === 0) {
            return null;
        }
        return elites.reduce((best, e) => (e.fitness > best.fitness ? e : best)).brain.clone();
    }

    public archive(): (number | null)[][] {
        return this.cells.map((row) => row.map((e) => (e === null ? null : e.fitness)));
    }

    private insert(e: Evaluated): void {
        const [x, y] = e.behavior.map((b) => Math.min(this.resolution - 1, Math.floor(b * this.resolution)));
        const elite = this.cells[y][x];

        if (elite === null || e.fitness > elite.fitness) {
            this.cells[y][x] = { brain: e.brain, fitness: e.fitness, behavior: e.behavior };
        }
    }
}

export default MapElites;
