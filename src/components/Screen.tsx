import * as React from 'react';
import { connect } from 'react-redux';
import type State from '../store/State';
import type { StrategyState } from '../store/State';
import Board from './Board';
import PopulationDetail from './PopulationDetail';
import ScoreChart from './ScoreChart';

const COLORS = ['#e6194b', '#3cb44b', '#4363d8', '#f58231', '#911eb4'];

interface ScreenProps {
    populations?: StrategyState[];
    onToggle: (name: string) => void;
}

const Screen = ({ populations, onToggle }: ScreenProps) => {
    const [selected, setSelected] = React.useState(0);

    if (populations === undefined) {
        return null;
    }

    const detail = populations[selected] ?? populations[0];

    return (
        <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <ScoreChart populations={populations} colors={COLORS} />
                {populations.map((p, k) => (
                    <div key={p.name} className={`strategy${k === selected ? ' selected' : ''}`}>
                        <h3 style={{ color: COLORS[k % COLORS.length] }}>{p.name}</h3>
                        <label>
                            <input
                                type="checkbox"
                                aria-label={`Run ${p.name}`}
                                checked={!p.paused}
                                onChange={() => onToggle(p.name)}
                            />{' '}
                            Running
                        </label>
                        <div>
                            Generation {p.generation} · Best score {p.bestScore}
                        </div>
                        <button
                            type="button"
                            className="mini"
                            aria-pressed={k === selected}
                            aria-label={`Show details of ${p.name}`}
                            onClick={() => setSelected(k)}
                        >
                            <Board grid={p.bestGame.grid} />
                        </button>
                    </div>
                ))}
            </div>
            <PopulationDetail population={detail} />
        </div>
    );
};

const mapStateToProps = (state: State) => ({
    populations: state.populations,
});

export default connect(mapStateToProps)(Screen);
