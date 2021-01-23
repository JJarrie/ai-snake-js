import * as React from 'react';
import SquareValue from "../rule/SquareValue";
import {connect} from "react-redux";
import State from "../store/State";
import Grid from "../rule/Grid";

interface BoardState {
    grid: Grid,
    width: number,
    height: number
}

interface BoardLineState {
    grid: Grid,
    width: number,
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

const BoardLine = ({width, grid, index}: BoardLineState) => (
    <tr>
        {[...Array(width)].map((v, i) =>
            <BoardSquare key={`boardsquare_${i}`} value={grid.getValue({x: i, y: index})}/>
        )}
    </tr>
);

const Board = ({grid, width, height}: BoardState) => (
    <table>
        <tbody>
        {[...Array(height)].map((v, i) =>
            <BoardLine key={`boardline_${i}`} width={width} index={i} grid={grid}/>
        )}
        </tbody>
    </table>
)

const mapStateToProps = (state: State): BoardState => ({
    grid: state.grid,
    width: state.boardSize.width,
    height: state.boardSize.height
})

export default connect(mapStateToProps)(Board)