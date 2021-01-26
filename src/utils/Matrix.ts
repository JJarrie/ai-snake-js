import Gaussian from "./Gaussian";

class Matrix<T = number> {
    cols: number
    rows: number
    matrix: T[][]

    constructor(cols: number, rows: number, defaultValue?: T) {
        this.cols = cols
        this.rows = rows
        this.matrix = [...Array(this.rows)].map(a => [...Array(this.cols)].map(b => defaultValue ?? null))
    }

    public fillWithCallback(callback: (col: number, row: number) => T) {
        this.matrix = [...Array(this.rows)].map((a, row) => [...Array(this.cols)].map((b, col) => callback(row, col)))
    }

    public setValue(col: number, row: number, value: T): void {
        this.matrix[row][col] = value
    }

    public getValue(col: number, row: number): T {
        return this.matrix[row][col]
    }

    public setMatrix(matrix: T[][]): void {
        this.rows = matrix.length
        this.cols = matrix[0].length
        this.matrix = matrix
    }

    public mutate(mutationRate: number, mutationCallback: (v: T) => T): void {
        for (let i = 0; i < this.rows; ++i) {
            for (let j = 0; j < this.cols; ++j) {
                const rand = Math.random()
                if (rand < mutationRate) {
                    this.matrix[i][j] = mutationCallback(this.matrix[i][j])
                }
            }
        }
    }

    public addBias(biasCallback: () => T): Matrix<T> {
        const n = new Matrix<T>(this.rows + 1, 1)
        for (let i = 0; i < this.rows; ++i) {
            n.matrix[i][0] = this.matrix[i][0]
        }
        n.matrix[this.rows][0] = biasCallback()

        return n
    }

    public singleColumnMatrixFromArray(array: T[]): Matrix<T> {
        const n = new Matrix<T>(array.length, 1)
        array.forEach((v, k) => n.matrix[k][0] = v)

        return n
    }

    public crossover(partner: Matrix<T>): Matrix<T> {
        const child = new Matrix<T>(this.rows, this.cols)
        const randomCol = Math.floor(Math.random() * this.cols)
        const randomRow = Math.floor(Math.random() * this.rows)

        for (let i = 0; i < this.rows; ++i) {
            for (let j = 0; i < this.cols; ++j) {
                child.matrix[i][j] = ((i < randomRow) || (i === randomRow && j <= randomCol))
                    ? this.matrix[i][j]
                    : partner.matrix[i][j]
            }
        }

        return child
    }

    public clone(): Matrix<T> {
        const clone = new Matrix<T>(this.rows, this.cols)

        for (let i = 0; i < this.rows; ++i) {
            for (let j = 0; j < this.cols; ++j) {
                clone.matrix[i][j] = this.matrix[i][j]
            }
        }

        return clone
    }

    public dot(n: Matrix<T>, baseValue: T, product: (curRes: T, a: T, b: T) => T): Matrix<T> {
        const result = new Matrix<T>(this.rows, n.cols)

        if (this.cols === n.rows) {
            for (let i = 0; i < this.rows; ++i) {
                for (let j = 0; j < n.cols; ++j) {
                    let sum = baseValue
                    for (let k = 0; k < this.cols; ++k) {
                        sum = product(sum, this.matrix[i][k], n.matrix[k][j])
                    }

                    result.matrix[i][j] = sum
                }
            }
        }

        return result
    }

    public activate(activation: (v: T) => T): Matrix<T> {
        const n = new Matrix<T>(this.rows, this.cols)

        for (let i = 0; i < this.rows; ++i) {
            for (let j = 0; j < n.cols; ++j) {
                n.matrix[i][j] = activation(this.matrix[i][j])
            }
        }

        return n
    }

    public toArray(): T[] {
        const array = new Array<T>(this.rows * this.cols)
        for (let i = 0; i < this.rows; ++i) {
            for (let j = 0; j < this.cols; ++j) {
                array[j + i * this.cols] = this.matrix[i][j]
            }
        }

        return array
    }
}

export default Matrix