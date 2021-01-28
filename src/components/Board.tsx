import * as React from 'react';
import SquareValue from "../rule/SquareValue";
import {GridState} from "../rule/Grid";

interface BoardState {
    grid: GridState
}

interface BoardLineState {
    grid: GridState,
    index: number
}

interface BoardSquareState {
    value: SquareValue
}

const BoardSquare = (props: BoardSquareState) => (
    <td className={
        (() => {
            switch (props.value) {
                case SquareValue.FOOD:
                    return 'food';
                case SquareValue.SNAKE:
                    return 'snake';
                case SquareValue.EMPTY:
                default:
                    return 'empty'
            }
        })()
    }/>
);

const BoardLine = ({grid, index}: BoardLineState) => (
    <tr>
        {[...Array(grid.boardSize.width)].map((v, i) =>
            <BoardSquare key={`boardsquare_${i}`} value={grid.innerGrid[index][i].value}/>
        )}
    </tr>
);

const Board = ({grid}: BoardState) => (
    <table style={{margin: '10px'}}>
        <tbody>
        {[...Array(grid.boardSize.height)].map((v, i) =>
            <BoardLine key={`boardline_${i}`} index={i} grid={grid}/>
        )}
        </tbody>
    </table>
)

export default Board