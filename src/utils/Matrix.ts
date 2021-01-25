class Matrix<T> {
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
}

export default Matrix