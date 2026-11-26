import * as React from 'react';
import { connect } from 'react-redux';
import type { SimulationState } from '../sim/Simulation';
import type State from '../store/State';
import { GAME_NAMES } from '../game/registry';
import EpisodeView from './EpisodeView';
import { colorOf, type Commands } from './commands';
import ControlBar from './ControlBar';
import ScoreChart from './ScoreChart';
import SettingsPanel from './SettingsPanel';
import StrategyCard from './StrategyCard';

interface ScreenProps {
    simulation?: SimulationState;
    commands: Commands;
}

const Screen = ({ simulation, commands }: ScreenProps) => {
    if (simulation === undefined || simulation.populations.length === 0) {
        return <p className="waiting">Connecting to the simulation…</p>;
    }

    const { populations, running, settings } = simulation;
    // The big board replays the record game of the strategy holding the best score so far.
    const leader = populations.reduce((best, p, k) => (p.bestScore > populations[best].bestScore ? k : best), 0);
    const champion = populations[leader];
    const generation = Math.min(...populations.filter((p) => !p.paused).map((p) => p.generation), Infinity);

    return (
        <div className="app">
            <ControlBar
                gameName={GAME_NAMES[settings.game]}
                running={running}
                generation={Number.isFinite(generation) ? generation : champion.generation}
                commands={commands}
            />
            <SettingsPanel settings={settings} commands={commands} />
            <section className="overview">
                <figure className="panel champion" style={{ borderTopColor: colorOf(leader) }}>
                    <figcaption>
                        <span style={{ color: colorOf(leader) }}>{champion.name}</span> leads with a record of{' '}
                        <strong>{champion.bestScore}</strong>
                        <span className="replay-score">replay score {champion.replay.score}</span>
                    </figcaption>
                    <EpisodeView episode={champion.replay} size={440} label={`Record replay of ${champion.name}`} />
                </figure>
                <ScoreChart populations={populations} />
            </section>
            <section className="cards">
                {populations.map((p, k) => (
                    <StrategyCard
                        key={p.name}
                        population={p}
                        index={k}
                        leader={k === leader}
                        onToggle={commands.toggle}
                    />
                ))}
            </section>
        </div>
    );
};

const mapStateToProps = (state: State) => ({
    simulation: state.simulation,
});

export default connect(mapStateToProps)(Screen);
