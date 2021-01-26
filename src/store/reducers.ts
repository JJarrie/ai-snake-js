import {Reducer} from "redux";
import Direction from "../rule/Direction";
import State from "./State";
import GameAction from "./actions";
import SnakeRule from "../rule/SnakeRule";
import Position from "../rule/Position";
import Grid from "../rule/Grid";
import SquareValue from "../rule/SquareValue";
import {generateInitialState} from "./initialState";
import EyedSnake from "../ai/EyedSnake";
import AwareSnake from "../ai/AwareSnake";

const nextState = (state: State): State => {
    const rule = new SnakeRule(state.boardSize)
    let food = state.food
    let score = state.score
    let snake = rule.updateBody(state.snake)
    let vision = state.vision
    snake = rule.updateHead(snake)

    const alive = rule.isAlive(snake)
    const grid = new Grid(state.boardSize)

    if (alive) {
        const isEating = rule.isEating(snake.head, state.food)

        if (isEating) {
            snake.body.unshift(state.food)
            do {
                food = Position.createRandom(state.boardSize)
            } while (snake.body.filter(p => p.x === food.x && p.y === food.y).length > 0);
            score = score + 1
        }
        grid.setSquareValue(SquareValue.FOOD, food)
        grid.setSquareValue(SquareValue.SNAKE, snake.head)
        grid.setSquareForSnake(snake)

        if (snake instanceof AwareSnake) {
            console.log('aware')
            snake.grid = grid
        }

        if (snake instanceof EyedSnake) {
            console.log('eyed')
            snake.look()
            vision = snake.getVision()
            console.log(vision)
        }
    }


    return {...state, grid, alive, score, food, snake, vision}
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

const reducer: Reducer<State> = (state, action): State => {
    switch (action.type) {
        case GameAction.newGame:
            return generateInitialState(state.playerType, state.boardSize);
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
        case GameAction.pause:
            return {...state, alive: false}
        default:
            return {...state}
    }
}
export default reducer