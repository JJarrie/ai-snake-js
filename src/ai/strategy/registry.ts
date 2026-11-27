import ClassicGa from './ClassicGa';
import DeepGa from './DeepGa';
import type EvolutionStrategy from './EvolutionStrategy';
import MapElites from './MapElites';
import OpenAiEs from './OpenAiEs';
import RandomSearch from './RandomSearch';
import SepCmaEs from './SepCmaEs';

/** Fresh instances of every strategy compared by the app and the benchmark. */
export const createStrategies = (mutationRate: number): EvolutionStrategy[] => [
    new ClassicGa(mutationRate),
    new DeepGa(),
    new OpenAiEs(),
    new SepCmaEs(),
    new MapElites('uniform'),
    new MapElites('novelty'),
];

/** Bench-only references that learn nothing: the floor every strategy must beat. */
export const createBaselines = (): EvolutionStrategy[] => [new RandomSearch()];

/** Strategies and baselines, as the benchmark runs them. */
export const createBenchStrategies = (mutationRate: number): EvolutionStrategy[] => [
    ...createStrategies(mutationRate),
    ...createBaselines(),
];
