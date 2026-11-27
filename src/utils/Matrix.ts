import Randomizer from './Randomizer';
import Array2D from './Array2D';
import Gaussian from './Gaussian';

class Matrix extends Array2D<number> {
    public randomize(): void {
        this.matrix = this.matrix.map((row) => row.map(() => Randomizer.floatBetween(-1, 1)));
    }

    public mutate(mutationRate: number): void {
        for (let i = 0; i < this.rows; ++i) {
            for (let j = 0; j < this.cols; ++j) {
                const rand = Math.random();
                if (rand < mutationRate) {
                    this.matrix[i][j] = this.matrix[i][j] + Gaussian.random() / 5;

                    if (this.matrix[i][j] > 1) {
                        this.matrix[i][j] = 1;
                    }

                    if (this.matrix[i][j] < -1) {
                        this.matrix[i][j] = -1;
                    }
                }
            }
        }
    }

    public crossover(partner: Matrix): Matrix {
        const child = new Matrix(this.rows, this.cols);
        const randomCol = Randomizer.intBetween(0, this.cols);
        const randomRow = Randomizer.intBetween(0, this.rows);

        for (let i = 0; i < this.rows; ++i) {
            for (let j = 0; j < this.cols; ++j) {
                child.matrix[i][j] =
                    i < randomRow || (i === randomRow && j <= randomCol) ? this.matrix[i][j] : partner.matrix[i][j];
            }
        }

        return child;
    }

    public clone(): Matrix {
        const clone = new Matrix(this.rows, this.cols);

        for (let i = 0; i < this.rows; ++i) {
            for (let j = 0; j < this.cols; ++j) {
                clone.matrix[i][j] = this.matrix[i][j];
            }
        }

        return clone;
    }
}

export default Matrix;
