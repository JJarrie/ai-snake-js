import Randomizer from './Randomizer';
import Array2D from './Array2D';
import Gaussian from './Gaussian';

class Matrix extends Array2D<number> {
    public randomize(): void {
        this.matrix = this.matrix.map((row) => row.map(() => Randomizer.floatBetween(-1, 1)));
    }

    public dot(n: Matrix): Matrix {
        const result = new Matrix(this.rows, n.cols);

        if (this.cols === n.rows) {
            for (let i = 0; i < this.rows; ++i) {
                for (let j = 0; j < n.cols; ++j) {
                    let sum = 0;
                    for (let k = 0; k < this.cols; ++k) {
                        sum = sum + this.matrix[i][k] * n.matrix[k][j];
                    }

                    result.matrix[i][j] = sum;
                }
            }
        }

        return result;
    }

    public singleColumnMatrixFromArray(array: number[]): Matrix {
        const n = new Matrix(array.length, 1);

        for (let i = 0; i < array.length; ++i) {
            n.matrix[i][0] = array[i];
        }

        return n;
    }

    public toArray(): number[] {
        const array = new Array(this.rows * this.cols);

        for (let i = 0; i < this.rows; ++i) {
            for (let j = 0; j < this.cols; ++j) {
                array[j + i * this.cols] = this.matrix[i][j];
            }
        }

        return array;
    }

    public addBias(): Matrix {
        const n = new Matrix(this.rows + 1, 1);

        for (let i = 0; i < this.rows; ++i) {
            n.matrix[i][0] = this.matrix[i][0];
        }

        n.matrix[this.rows][0] = 1;

        return n;
    }

    public activate(c: (x: number) => number): Matrix {
        const n = new Matrix(this.rows, this.cols);

        for (let i = 0; i < this.rows; ++i) {
            for (let j = 0; j < this.cols; ++j) {
                n.matrix[i][j] = c(this.matrix[i][j]);
            }
        }

        return n;
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

    public output(): void {
        console.log(this.matrix.map((row) => row.map((col) => Math.round(col * 100) / 100).join('|')).join('\n'));
    }
}

export default Matrix;
