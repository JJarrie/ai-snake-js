class Array2D<T> {
    cols: number;
    rows: number;
    matrix: T[][];

    constructor(rows: number, cols: number) {
        this.rows = rows;
        this.cols = cols;
        this.matrix = [...Array(rows)].map((_) => [...Array(cols)]);
    }

    public get(row: number, col: number): T {
        return this.matrix[row][col];
    }

    public set(row: number, col: number, value: T): void {
        this.matrix[row][col] = value;
    }

    public clone(): Array2D<T> {
        const clone = new Array2D<T>(this.rows, this.cols);

        for (let i = 0; i < this.rows; ++i) {
            for (let j = 0; j < this.cols; ++j) {
                clone.matrix[i][j] = this.matrix[i][j];
            }
        }

        return clone;
    }
}

export default Array2D;
