import * as React from 'react';
import type { StrategyState } from '../sim/Simulation';
import ArchiveMap from './ArchiveMap';
import EpisodeView from './EpisodeView';
import { colorOf } from './commands';

interface StrategyCardProps {
    population: StrategyState;
    index: number;
    leader: boolean;
    onToggle: (name: string) => void;
}

const StrategyCard = ({ population: p, index, leader, onToggle }: StrategyCardProps) => {
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
            {p.paused && <p className="card-note">Paused at generation {p.generation}</p>}
            <dl className="stats">
                <div>
                    <dt>Record</dt>
                    <dd>{p.bestScore}</dd>
                </div>
                <div>
                    <dt>Best generation</dt>
                    <dd>{p.bestGeneration > 0 ? p.bestGeneration : '—'}</dd>
                </div>
                <div>
                    <dt>Last gen. best</dt>
                    <dd>{lastBest}</dd>
                </div>
            </dl>
            <div className="card-boards">
                <EpisodeView episode={p.replay} size={150} label={`Record replay of ${p.name}`} showSensors={false} />
                {p.archive && <ArchiveMap archive={p.archive} color={color} />}
            </div>
        </article>
    );
};

export default StrategyCard;
