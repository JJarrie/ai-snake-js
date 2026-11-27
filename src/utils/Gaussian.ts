import type { Random } from './SeededRandom';

class Gaussian {
    /**
     * Normal draw (polar Box-Muller) from `random`. No cached second value: shared between
     * populations, it would mix their draws and break reproducibility.
     */
    public static random(random: Random, mean = 0, s = 1): number {
        let x1: number;
        let x2: number;
        let w: number;

        do {
            x1 = random() * 2 - 1;
            x2 = random() * 2 - 1;
            w = x1 * x1 + x2 * x2;
        } while (w >= 1 || w === 0);

        return x1 * Math.sqrt((-2 * Math.log(w)) / w) * s + mean;
    }
}

export default Gaussian;
