import * as React from 'react';
import { Dispatch } from 'react';
import Direction from '../rule/Direction';
import State from '../store/State';
import GameAction from '../store/actions';
import { connect } from 'react-redux';
import GameDisplayer from './GameDisplayer';
import { GameState } from '../rule/Game';
import { PopulationState } from '../ai/Population';
import DirectionCardinal from '../rule/DirectionCardinal';
import { IntelligentSnakeState } from '../ai/IntelligentSnake';
import { SeenInDirection } from '../ai/EyedSnake';

interface ScreenProps {
    changeDirection: (direction: GameAction) => void;
    game?: GameState;
    population?: PopulationState;
}

class Screen extends React.Component<ScreenProps> {
    componentDidMount() {
        document.addEventListener('keydown', (e: KeyboardEvent) => {
            switch (e.code) {
                case 'KeyW':
                case 'ArrowUp':
                    this.props.changeDirection(GameAction.up);
                    break;
                case 'KeyA':
                case 'ArrowLeft':
                    this.props.changeDirection(GameAction.left);
                    break;
                case 'KeyS':
                case 'ArrowDown':
                    this.props.changeDirection(GameAction.down);
                    break;
                case 'KeyD':
                case 'ArrowRight':
                    this.props.changeDirection(GameAction.right);
                    break;
            }
        });
    }

    public render() {
        if (this.props.game !== undefined) {
            return <GameDisplayer game={this.props.game} />;
        }

        const showVision = (label: string, visionPart: SeenInDirection) => {
            const food = Math.round(visionPart.food * 100) / 100;
            const body = Math.round(visionPart.body * 100) / 100;
            const wall = Math.round(visionPart.wall * 100) / 100;
            return (
                <>
                    <tr>
                        <td colSpan={2}>{label}</td>
                    </tr>
                    <tr>
                        <td>Food</td>
                        <td style={food > 0 ? { color: 'red' } : {}}>{food}</td>
                    </tr>
                    <tr>
                        <td>Body</td>
                        <td>{body}</td>
                    </tr>
                    <tr>
                        <td>Wall</td>
                        <td>{wall}</td>
                    </tr>
                </>
            );
        };

        if (this.props.population !== undefined) {
            const numberFormatter = Intl.NumberFormat('fr-FR', { useGrouping: true });
            const snakeState = this.props.population.bestGame.snake as IntelligentSnakeState;
            return (
                <div style={{ display: 'flex' }}>
                    <GameDisplayer game={this.props.population.bestGame} />
                    <ul style={{ margin: '10px' }}>
                        <li>Generation: {this.props.population.generation}</li>
                        <li>Best Generation: {this.props.population.bestGeneration}</li>
                        <li>Best score: {this.props.population.bestScore}</li>
                        <li>Fitness sum: {numberFormatter.format(this.props.population.fitnessSum)}</li>
                        <li>Best fitness: {numberFormatter.format(this.props.population.bestFitness)}</li>
                        <li>--------------------</li>
                        <li>Finish: {this.props.population.bestGame.finish ? 'Oui' : 'Non'}</li>
                        <li>
                            Direction:{' '}
                            {(() => {
                                switch (snakeState.direction) {
                                    case DirectionCardinal.EAST:
                                        return 'East';
                                    case DirectionCardinal.NORTH:
                                        return 'North';
                                    case DirectionCardinal.SOUTH:
                                        return 'South';
                                    case DirectionCardinal.WEST:
                                        return 'West';
                                }
                            })()}
                        </li>
                        <li>Head: {`{ x: ${snakeState.head.x}, y : ${snakeState.head.y} }`}</li>
                        <li>Lifetime: {snakeState.lifetime}</li>
                        <li>Lifeleft: {snakeState.lifeleft}</li>
                        <li>Fitness: {numberFormatter.format(snakeState.fitness)}</li>
                    </ul>
                    <table className={'vision'} style={{ margin: '10px' }}>
                        <tbody>
                            {showVision('Front', snakeState.vision[Direction.FRONT])}
                            {showVision('Front right', snakeState.vision[Direction.FRONT_RIGHT])}
                            {showVision('Right', snakeState.vision[Direction.RIGHT])}
                            {showVision('Back right', snakeState.vision[Direction.BACK_RIGHT])}
                            {showVision('Back', snakeState.vision[Direction.BACK])}
                            {showVision('Back left', snakeState.vision[Direction.BACK_LEFT])}
                            {showVision('Left', snakeState.vision[Direction.LEFT])}
                            {showVision('Front left', snakeState.vision[Direction.FRONT_LEFT])}
                        </tbody>
                    </table>
                    <table className={'vision'} style={{ margin: '10px' }}>
                        {snakeState.lastDecision.map((d, k) => (
                            <tr key={`d_${k}`}>
                                <td>
                                    {(() => {
                                        switch (k) {
                                            case 0:
                                                return 'Continue';
                                            case 1:
                                                return 'Left';
                                            case 2:
                                                return 'Right';
                                        }
                                    })()}
                                </td>
                                <td>{Math.round(d * 100) / 100}</td>
                            </tr>
                        ))}
                    </table>
                </div>
            );
        }

        return null;
    }
}

const mapStateToProps = (state: State) => ({
    population: state.population,
    game: state.game,
});

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    changeDirection: (direction: GameAction) => dispatch({ type: direction }),
});

export default connect(mapStateToProps, mapDispatchToProps)(Screen);
