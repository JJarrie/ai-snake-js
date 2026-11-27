import * as React from 'react';
import { connect } from 'react-redux';
import type { SimulationState } from '../sim/Simulation';
import type State from '../store/State';
import { GAME_NAMES } from '../game/registry';
import EpisodeView from './EpisodeView';
import { colorOf, type Commands } from './commands';
import ControlBar from './ControlBar';
import RacePanel from './RacePanel';
import ScoreChart from './ScoreChart';
import SettingsPanel from './SettingsPanel';
import StrategyCard from './StrategyCard';

interface ScreenProps {
    simulation?: SimulationState;
    commands: Commands;
}

const Screen = ({ simulation, commands }: ScreenProps) => {
    // Display only: the agents sense the same either way.
    const [showSensors, setShowSensors] = React.useState(true);

    if (simulation === undefined || simulation.populations.length === 0) {
        return <p className="waiting">Connecting to the simulation…</p>;
    }

    const { populations, running, settings, race } = simulation;
    const indexOf = (name: string) => populations.findIndex((p) => p.name === name);
    // Car game with races run: the race standings lead (a record can come from one easy track).
    // Otherwise the big board replays the record game of the strategy holding the best score so far.
    const raced = race !== null && race.standings.length > 0;
    const leader = raced
        ? Math.max(0, indexOf(race.standings[0].name))
        : populations.reduce((best, p, k) => (p.bestScore > populations[best].bestScore ? k : best), 0);
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
                {raced && <RacePanel race={race} colorFor={(name) => colorOf(indexOf(name))} size={440} />}
                {!raced && (
                    <figure className="panel champion" style={{ borderTopColor: colorOf(leader) }}>
                        <figcaption>
                            <span style={{ color: colorOf(leader) }}>{champion.name}</span> leads with a record of{' '}
                            <strong>{champion.bestScore}</strong>
                            <span className="replay-score">
                                {champion.bestGeneration > 0
                                    ? `replay of generation ${champion.bestGeneration} · score ${champion.replay.score}`
                                    : `replay score ${champion.replay.score}`}
                                {champion.replay.view.kind === 'cars' &&
                                    champion.replay.view.bestLap !== null &&
                                    ` · best lap ${champion.replay.view.bestLap} steps`}
                            </span>
                        </figcaption>
                        <EpisodeView
                            episode={champion.replay}
                            size={440}
                            label={`Record replay of ${champion.name}`}
                            showSensors={showSensors}
                        />
                        <div className="sensor-bar">
                            <label className="switch-inline">
                                <input
                                    type="checkbox"
                                    checked={showSensors}
                                    onChange={(event) => setShowSensors(event.target.checked)}
                                />{' '}
                                Show sensors
                            </label>
                            {showSensors && settings.game === 'snake' && (
                                <p className="sensor-legend">
                                    <span className="legend-sight">
                                        {settings.vision === 'cone' ? 'field of view' : 'line of sight'}
                                    </span>
                                    <span className="legend-food">food seen</span>
                                    <span className="legend-body">own body seen</span>
                                </p>
                            )}
                        </div>
                    </figure>
                )}
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
