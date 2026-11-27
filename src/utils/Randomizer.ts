import type { Random } from './SeededRandom';

class Randomizer {
    public static floatBetween(a: number, b: number, random: Random): number {
        const min = Math.min(a, b);
        const max = Math.max(a, b);

        return random() * (max - min) + min;
    }

    public static intBetween(a: number, b: number, random: Random): number {
        return Math.floor(Randomizer.floatBetween(a, b, random));
    }
}

export default Randomizer;
