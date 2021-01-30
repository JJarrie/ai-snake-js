class Gaussian {
    private static y2: number;
    private static previous = false;

    public static random(mean = 0, s = 1): number {
        let y1: number;
        let x1: number;
        let x2: number;
        let w: number;

        if (Gaussian.previous) {
            y1 = Gaussian.y2;
            Gaussian.previous = false;
        } else {
            do {
                x1 = Math.random() * 2 - 1;
                x2 = Math.random() * 2 - 1;
                w = Math.pow(x1, 2) + Math.pow(x2, 2);
            } while (w >= 1);

            w = Math.sqrt((-2 * Math.log(w)) / w);
            y1 = x1 * w;
            Gaussian.y2 = x2 * w;
            Gaussian.previous = true;
        }

        return y1 * s + mean;
    }
}

export default Gaussian;
