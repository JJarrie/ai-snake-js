import * as React from 'react';
import { connect } from 'react-redux';
import type State from '../store/State';
import type { StrategyState } from '../store/State';
import ArchiveMap from './ArchiveMap';
import Board from './Board';
import GameDisplayer from './GameDisplayer';
import ScoreChart from './ScoreChart';

const COLORS = ['#e6194b', '#3cb44b', '#4363d8', '#f58231', '#911eb4', '#008080'];

interface ScreenProps {
    populations?: StrategyState[];
    onToggle: (name: string) => void;
}

const Screen = ({ populations, onToggle }: ScreenProps) => {
    if (populations === undefined || populations.length === 0) {
        return null;
    }

    // The big board replays the record game of the strategy holding the best score so far.
    const leader = populations.reduce((best, p, k) => (p.bestScore > populations[best].bestScore ? k : best), 0);

    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div style={{ margin: '10px' }}>
                <h2 style={{ color: COLORS[leader % COLORS.length], margin: 0 }}>{populations[leader].name}</h2>
                <GameDisplayer game={populations[leader].bestGame} />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', flex: 1 }}>
                <ScoreChart populations={populations} colors={COLORS} />
                {populations.map((p, k) => (
                    <div key={p.name} className={`strategy${k === leader ? ' leader' : ''}`}>
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
                        <div className="mini">
                            <Board grid={p.bestGame.grid} />
                        </div>
                        {p.archive && <ArchiveMap archive={p.archive} color={COLORS[k % COLORS.length]} />}
                    </div>
                ))}
            </div>
        </div>
    );
};

const mapStateToProps = (state: State) => ({
    populations: state.populations,
});

export default connect(mapStateToProps)(Screen);
