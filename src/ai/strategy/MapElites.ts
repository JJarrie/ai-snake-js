import type NeuralNetwork from '../NeuralNetwork';
import Gaussian from '../../utils/Gaussian';
import type EvolutionStrategy from './EvolutionStrategy';
import type { Evaluated } from './EvolutionStrategy';

interface Elite {
    brain: NeuralNetwork;
    fitness: number;
}

/**
 * MAP-Elites (Mouret & Clune, 2015): an archive keeps the best individual of each behaviour cell
 * (here turn rate x left share), and new individuals are mutations of random elites. It favours
 * diverse ways of playing over a single champion.
 */
class MapElites implements EvolutionStrategy {
    readonly name = 'MAP-Elites';
    resolution: number;
    sigma: number;
    cells: (Elite | null)[][];

    constructor(resolution = 10, sigma = 0.05) {
        this.resolution = resolution;
        this.sigma = sigma;
        this.cells = [...Array(resolution)].map(() => new Array<Elite | null>(resolution).fill(null));
    }

    public nextGeneration(evaluated: Evaluated[], best: NeuralNetwork): NeuralNetwork[] {
        evaluated.forEach((e) => this.insert(e));

        const elites = this.cells.flat().filter((e): e is Elite => e !== null);
        const next = [best.clone()];

        while (next.length < evaluated.length) {
            const parent = elites[Math.floor(Math.random() * elites.length)].brain;
            next.push(parent.fromVector(parent.toVector().map((w) => w + this.sigma * Gaussian.random())));
        }

        return next;
    }

    public archive(): (number | null)[][] {
        return this.cells.map((row) => row.map((e) => (e === null ? null : e.fitness)));
    }

    private insert(e: Evaluated): void {
        const [x, y] = e.behavior.map((b) => Math.min(this.resolution - 1, Math.floor(b * this.resolution)));
        const elite = this.cells[y][x];

        if (elite === null || e.fitness > elite.fitness) {
            this.cells[y][x] = { brain: e.brain, fitness: e.fitness };
        }
    }
}

export default MapElites;
