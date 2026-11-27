class Array2D<T> {
    cols: number;
    rows: number;
    matrix: T[][];

    constructor(rows: number, cols: number) {
        this.rows = rows;
        this.cols = cols;
        this.matrix = [...Array(rows)].map(() => [...Array(cols)]);
    }

    public set(row: number, col: number, value: T): void {
        this.matrix[row][col] = value;
    }
}

export default Array2D;
