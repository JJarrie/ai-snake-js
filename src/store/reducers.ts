import {Reducer} from "redux";
import Direction from "../rule/Direction";
import State from "./State";
import GameAction from "./actions";
import SnakeRule from "../rule/SnakeRule";
import Position from "../rule/Position";
import Grid from "../rule/Grid";
import SquareValue from "../rule/SquareValue";

const nextState = (state: State): State => {
    const rule = new SnakeRule(state.boardSize)
    let food = state.food
    let score = state.score
    let snake = rule.updateBody(state.snake)
    snake = rule.updateHead(snake)

    const alive = rule.isAlive(snake)
    const grid = new Grid(state.boardSize)

    if (alive) {
        const isEating = rule.isEating(snake.head, state.food)

        if (isEating) {
            snake.body.unshift(state.food)
            food = Position.createRandom(state.boardSize)
            score = score + 1
        }
        grid.setValue(SquareValue.FOOD, food)
        grid.setValue(SquareValue.SNAKE, snake.head)
        snake.body.forEach(position => grid.setValue(SquareValue.SNAKE, position))
    }

    return {...state, grid, alive, score, food, snake};
}

const getNewDirection = (currentDirection: Direction, newDirection: Direction, oppositeDirection: Direction): Direction => {
    return currentDirection === oppositeDirection ? currentDirection : newDirection
}

const getNewDirectionState = (state: State, newDirection: Direction, opppositeDirection: Direction): State => ({
    ...state,
    snake: {
        ...state.snake,
        direction: getNewDirection(state.snake.direction, newDirection, opppositeDirection)
    }
})

const gameReducer: Reducer<State> = (state, action): State => {
    switch (action.type) {
        case GameAction.nextFrame:
            return nextState(state)
        case GameAction.up:
            return getNewDirectionState(state, Direction.NORTH, Direction.SOUTH)
        case GameAction.down:
            return getNewDirectionState(state, Direction.SOUTH, Direction.NORTH)
        case GameAction.left:
            return getNewDirectionState(state, Direction.WEST, Direction.EAST)
        case GameAction.right:
            return getNewDirectionState(state, Direction.EAST, Direction.WEST)
        default:
            return {...state}
    }
}
export default gameReducer