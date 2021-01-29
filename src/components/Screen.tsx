import * as React from "react"
import {Dispatch} from "react"
import State from "../store/State";
import GameAction from "../store/actions";
import {connect} from "react-redux";
import GameDisplayer from "./GameDisplayer";
import {GameState} from "../rule/Game";
import {PopulationState} from "../ai/Population";
import Direction from "../rule/Direction";
import {IntelligentSnakeState} from "../ai/IntelligentSnake";
import {SeenInDirection} from "../ai/EyedSnake";

interface ScreenProps {
    changeDirection: (direction: GameAction) => void,
    game?: GameState,
    population?: PopulationState
}

class Screen extends React.Component<ScreenProps> {
    componentDidMount() {
        document.addEventListener('keydown', (e: KeyboardEvent) => {
            switch (e.code) {
                case 'KeyW':
                case 'ArrowUp':
                    this.props.changeDirection(GameAction.up)
                    break
                case 'KeyA':
                case 'ArrowLeft':
                    this.props.changeDirection(GameAction.left)
                    break
                case 'KeyS':
                case 'ArrowDown':
                    this.props.changeDirection(GameAction.down)
                    break
                case 'KeyD':
                case 'ArrowRight':
                    this.props.changeDirection(GameAction.right)
                    break
            }
        });
    }

    public render() {
        if (this.props.game !== undefined) {
            return <GameDisplayer game={this.props.game}/>
        }

        const showVision = (label: string, visionPart: SeenInDirection) => (
            <>
                <tr>
                    <td colSpan={2}>{label}</td>
                </tr>
                <tr>
                    <td>Food</td>
                    <td>{Math.round(visionPart.food * 100) / 100}</td>
                </tr>
                <tr>
                    <td>Body</td>
                    <td>{Math.round(visionPart.body * 100) / 100}</td>
                </tr>
                <tr>
                    <td>Wall</td>
                    <td>{Math.round(visionPart.wall * 100) / 100}</td>
                </tr>
            </>
        )

        if (this.props.population !== undefined) {
            const snakeState = (this.props.population.bestGame.snake as IntelligentSnakeState)
            return (<div style={{display: "flex"}}>
                <GameDisplayer game={this.props.population.bestGame || this.props.population.games[0]}/>
                <ul>
                    <li>Generation: {this.props.population.generation}</li>
                    <li>Best Generation: {this.props.population.bestGeneration}</li>
                    <li>Best score: {this.props.population.bestScore}</li>
                    <li>Fitness sum: {this.props.population.fitnessSum}</li>
                    <li>Best fitness: {this.props.population.bestFitness}</li>
                    <li>--------------------</li>
                    <li>Finish: {this.props.population.bestGame.finish ? 'Oui' : 'Non'}</li>
                    <li>Direction: {(() => {
                        switch (snakeState.direction) {
                            case Direction.EAST:
                                return 'East'
                            case Direction.NORTH:
                                return 'North'
                            case Direction.SOUTH:
                                return 'South'
                            case Direction.WEST:
                                return 'West'
                        }
                    })()}</li>
                    <li>Head: {`{ x: ${snakeState.head.x}, y : ${snakeState.head.y} }`}</li>
                    <li>Lifetime: {snakeState.lifetime}</li>
                    <li>Lifeleft: {snakeState.lifeleft}</li>
                    <li>Fitness: {snakeState.fitness}</li>
                </ul>
                <table className={'vision'}>
                    <tbody>
                    {showVision('North', snakeState.vision[Direction.NORTH])}
                    {showVision('North-east', snakeState.vision[Direction.NORTH_EAST])}
                    {showVision('East', snakeState.vision[Direction.EAST])}
                    {showVision('South-east', snakeState.vision[Direction.SOUTH_EAST])}
                    {showVision('South', snakeState.vision[Direction.SOUTH])}
                    {showVision('South-west', snakeState.vision[Direction.SOUTH_WEST])}
                    {showVision('West', snakeState.vision[Direction.WEST])}
                    {showVision('North-west', snakeState.vision[Direction.NORTH_WEST])}
                    </tbody>
                </table>
            </div>)
        }

        return null;
    }
}

const mapStateToProps = (state: State) => ({
    population: state.population,
    game: state.game
})

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    changeDirection: (direction: GameAction) => dispatch({type: direction})
})

export default connect(mapStateToProps, mapDispatchToProps)(Screen);
