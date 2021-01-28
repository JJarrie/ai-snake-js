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
import {DistanceByDirection} from "../ai/SnakeVision";

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

        const showVision = (visionPart: DistanceByDirection) => (
            <ul>
                <li>North: {visionPart[Direction.NORTH]}</li>
                <li>North East: {visionPart[Direction.NORTH_EAST]}</li>
                <li>East: {visionPart[Direction.EAST]}</li>
                <li>South East: {visionPart[Direction.SOUTH_EAST]}</li>
                <li>South: {visionPart[Direction.SOUTH]}</li>
                <li>South West: {visionPart[Direction.SOUTH_WEST]}</li>
                <li>West: {visionPart[Direction.WEST]}</li>
                <li>North West: {visionPart[Direction.NORTH_WEST]}</li>
            </ul>
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
                    <li>
                        Food
                        {showVision(snakeState.vision.food)}
                    </li>
                    <li>
                        Body
                        {showVision(snakeState.vision.body)}
                    </li>
                    <li>
                        Bounds
                        {showVision(snakeState.vision.bounds)}
                    </li>

                    <li>Lifetime: {snakeState.lifetime}</li>
                    <li>Lifeleft: {snakeState.lifeleft}</li>
                    <li>Fitness: {snakeState.fitness}</li>
                </ul>
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
