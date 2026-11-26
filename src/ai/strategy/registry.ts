import ClassicGa from './ClassicGa';
import DeepGa from './DeepGa';
import type EvolutionStrategy from './EvolutionStrategy';
import MapElites from './MapElites';
import OpenAiEs from './OpenAiEs';
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
