import * as React from 'react';
import type { StrategyState } from '../sim/Simulation';
import ArchiveMap from './ArchiveMap';
import EpisodeView from './EpisodeView';
import { colorOf } from './commands';

interface StrategyCardProps {
    population: StrategyState;
    index: number;
    leader: boolean;
    /** What a score counts: apples, checkpoints. */
    unit: string;
    onToggle: (name: string) => void;
}

/** One line on how each strategy searches, for an audience that does not know them. */
const DESCRIPTIONS: Record<string, string> = {
    'Classic GA': 'Picks parents in proportion to fitness, crosses them over, mutates a few weights.',
    'Deep GA': 'Copies the top 10% with Gaussian noise on every weight; no crossover.',
    'OpenAI-ES': 'Moves an average network along the gradient its noisy copies estimate.',
    'sep-CMA-ES': 'Moves an average network and adapts how far it explores along each weight.',
    'MAP-Elites': 'Keeps the best network for each style of play (turning, speed) and mutates them.',
    'MAP-Elites (novelty)': 'MAP-Elites that favours the rarest styles of play.',
};

const StrategyCard = ({ population: p, index, leader, unit, onToggle }: StrategyCardProps) => {
    const color = colorOf(index);
    const { lastBest } = p;

    return (
        <article
            className={`panel card${leader ? ' leader' : ''}${p.paused ? ' is-paused' : ''}`}
            style={{ borderTopColor: color }}
        >
            <header>
                <h3 style={{ color }}>{p.name}</h3>
                {leader && <span className="badge">Leader</span>}
                <label className="switch">
                    <input
                        type="checkbox"
                        aria-label={`Run ${p.name}`}
                        checked={!p.paused}
                        onChange={() => onToggle(p.name)}
                    />
                    <span>{p.paused ? 'Paused' : 'On'}</span>
                </label>
            </header>
            {DESCRIPTIONS[p.name] && <p className="card-note">{DESCRIPTIONS[p.name]}</p>}
            {p.paused && <p className="card-note">Paused at generation {p.generation}</p>}
            <dl className="stats">
                <div title={`Mean ${unit} of the strategy's current network on worlds it never trained on`}>
                    <dt>Policy, unseen worlds</dt>
                    <dd>{p.policyScore === null ? '—' : p.policyScore.toFixed(1)}</dd>
                </div>
                <div title={`Best single game so far, generation ${p.bestGeneration}: the best of many noisy games`}>
                    <dt>Record (best game)</dt>
                    <dd>{p.bestScore}</dd>
                </div>
                <div title="Best single game of the last generation">
                    <dt>Last gen. best</dt>
                    <dd>{lastBest}</dd>
                </div>
            </dl>
            <p className="card-note">
                Scores in {unit} · generation {p.generation}
            </p>
            <div className="card-boards">
                <EpisodeView episode={p.replay} size={150} label={`Record replay of ${p.name}`} showSensors={false} />
                {p.archive && <ArchiveMap archive={p.archive} color={color} />}
            </div>
        </article>
    );
};

export default StrategyCard;
