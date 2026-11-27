import type NeuralNetwork from '../NeuralNetwork';
import Gaussian from '../../utils/Gaussian';
import type { Random } from '../../utils/SeededRandom';
import type EvolutionStrategy from './EvolutionStrategy';
import type { Evaluated } from './EvolutionStrategy';

/**
 * sep-CMA-ES (Ros & Hansen, 2008): CMA-ES with a diagonal covariance, O(n) per sample.
 * shortcut: full covariance would need an n x n eigendecomposition per generation (n = 451 weights here),
 * upgrade if the network gets small enough or a linear algebra library is added.
 */
class SepCmaEs implements EvolutionStrategy {
    readonly name = 'sep-CMA-ES';
    sigma: number;
    mean?: number[];
    /** Per-weight variance (diagonal of C). */
    variance: number[] = [];
    pathSigma: number[] = [];
    pathC: number[] = [];
    generation = 0;
    /** Standard normal sample of each individual of the current generation, same order as `evaluated`. */
    samples: number[][] = [];

    constructor(sigma = 0.2) {
        this.sigma = sigma;
    }

    public nextGeneration(evaluated: Evaluated[], best: NeuralNetwork, random: Random): NeuralNetwork[] {
        // First generation is random networks, not samples: start from the best of them.
        if (this.mean === undefined || this.samples.length !== evaluated.length) {
            this.mean = best.toVector();
            this.variance = this.mean.map(() => 1);
            this.pathSigma = this.mean.map(() => 0);
            this.pathC = this.mean.map(() => 0);
        } else {
            this.update(evaluated);
        }

        const mean = this.mean;
        const deviation = this.variance.map(Math.sqrt);
        this.samples = evaluated.map(() => mean.map(() => Gaussian.random(random)));

        return this.samples.map((z) => best.fromVector(mean.map((m, j) => m + this.sigma * deviation[j] * z[j])));
    }

    /** The mean: what CMA-ES optimizes, never played in training (only its samples are). */
    public policy(template: NeuralNetwork): NeuralNetwork | null {
        return this.mean ? template.fromVector(this.mean) : null;
    }

    private update(evaluated: Evaluated[]): void {
        const mean = this.mean as number[];
        const n = mean.length;
        const lambda = evaluated.length;
        const mu = Math.floor(lambda / 2);

        const rawWeights = [...Array(mu)].map((_, i) => Math.log(mu + 0.5) - Math.log(i + 1));
        const weightSum = rawWeights.reduce((s, w) => s + w, 0);
        const weights = rawWeights.map((w) => w / weightSum);
        const muEff = 1 / weights.reduce((s, w) => s + w * w, 0);

        const cSigma = (muEff + 2) / (n + muEff + 5);
        const dSigma = 1 + 2 * Math.max(0, Math.sqrt((muEff - 1) / (n + 1)) - 1) + cSigma;
        const cC = (4 + muEff / n) / (n + 4 + (2 * muEff) / n);
        const c1Full = 2 / ((n + 1.3) ** 2 + muEff);
        const cMuFull = Math.min(1 - c1Full, (2 * (muEff - 2 + 1 / muEff)) / ((n + 2) ** 2 + muEff));
        // sep-CMA learns n variances instead of n^2 covariances, so it can learn (n + 2) / 3 times faster.
        const c1 = Math.min(1, (c1Full * (n + 2)) / 3);
        const cMu = Math.min(1 - c1, (cMuFull * (n + 2)) / 3);
        const chiN = Math.sqrt(n) * (1 - 1 / (4 * n) + 1 / (21 * n * n));

        const ranked = evaluated
            .map((e, i) => ({ fitness: e.fitness, z: this.samples[i] }))
            .sort((a, b) => b.fitness - a.fitness)
            .slice(0, mu);
        const deviation = this.variance.map(Math.sqrt);

        const zWeighted = mean.map((_, j) => ranked.reduce((s, r, i) => s + weights[i] * r.z[j], 0));
        const yWeighted = zWeighted.map((z, j) => deviation[j] * z);

        for (let j = 0; j < n; ++j) {
            mean[j] = mean[j] + this.sigma * yWeighted[j];
        }

        // With a diagonal C, C^(-1/2) * yWeighted is zWeighted.
        const sigmaFactor = Math.sqrt(cSigma * (2 - cSigma) * muEff);
        this.pathSigma = this.pathSigma.map((p, j) => (1 - cSigma) * p + sigmaFactor * zWeighted[j]);
        const pathSigmaNorm = Math.sqrt(this.pathSigma.reduce((s, p) => s + p * p, 0));

        this.generation = this.generation + 1;
        const stalled =
            pathSigmaNorm / Math.sqrt(1 - (1 - cSigma) ** (2 * this.generation)) >= (1.4 + 2 / (n + 1)) * chiN;
        const hSigma = stalled ? 0 : 1;

        const cFactor = Math.sqrt(cC * (2 - cC) * muEff);
        this.pathC = this.pathC.map((p, j) => (1 - cC) * p + hSigma * cFactor * yWeighted[j]);

        this.variance = this.variance.map((v, j) => {
            const rankMu = ranked.reduce((s, r, i) => s + weights[i] * v * r.z[j] * r.z[j], 0);
            const rankOne = this.pathC[j] ** 2 + (1 - hSigma) * cC * (2 - cC) * v;

            return (1 - c1 - cMu) * v + c1 * rankOne + cMu * rankMu;
        });

        this.sigma = this.sigma * Math.exp((cSigma / dSigma) * (pathSigmaNorm / chiN - 1));
    }
}

export default SepCmaEs;
