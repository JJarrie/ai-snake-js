import * as React from 'react';
import type { StrategyState } from '../sim/Simulation';
import { colorOf } from './commands';

const WIDTH = 640;
const HEIGHT = 280;
const LEFT = 40;
const RIGHT = 12;
const TOP = 12;
const BOTTOM = 32;

/** About `count` round tick values from 0 to `max`. */
const ticks = (max: number, count: number): number[] => {
    const step = Math.max(1, Math.ceil(max / count));

    return [...Array(Math.floor(max / step) + 1)].map((_, i) => i * step);
};

interface ScoreChartProps {
    populations: StrategyState[];
}

/** Best score per generation, one line per strategy, on shared axes. */
const ScoreChart = ({ populations }: ScoreChartProps) => {
    // Finished generations: the history is reduced, so its length is not the generation count.
    const generations = populations.reduce((max, p) => Math.max(max, p.generation - 1), 1);
    // A loop, not Math.max(...values): spreading a long series exceeds the browser's argument limit.
    const maxScore = populations.reduce((max, p) => p.history.reduce((m, s) => Math.max(m, s), max), 5);
    /** x of generation index `i` (0-based). */
    const x = (i: number) => LEFT + (generations > 1 ? (i / (generations - 1)) * (WIDTH - LEFT - RIGHT) : 0);
    const y = (score: number) => HEIGHT - BOTTOM - (score / maxScore) * (HEIGHT - TOP - BOTTOM);

    return (
        <figure className="panel chart">
            <figcaption>Best score per generation</figcaption>
            <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="Best score per generation for each strategy">
                {ticks(maxScore, 5).map((score) => (
                    <g key={`y_${score}`}>
                        <line x1={LEFT} x2={WIDTH - RIGHT} y1={y(score)} y2={y(score)} className="grid-line" />
                        <text x={LEFT - 6} y={y(score) + 4} textAnchor="end" className="tick">
                            {score}
                        </text>
                    </g>
                ))}
                {ticks(generations, 6)
                    .filter((g) => g >= 1)
                    .map((g) => (
                        <text key={`x_${g}`} x={x(g - 1)} y={HEIGHT - BOTTOM + 16} textAnchor="middle" className="tick">
                            {g}
                        </text>
                    ))}
                <text x={WIDTH - RIGHT} y={HEIGHT - 2} textAnchor="end" className="tick">
                    generation
                </text>
                {populations.map((p, k) => (
                    <polyline
                        key={p.name}
                        fill="none"
                        stroke={colorOf(k)}
                        strokeWidth={2}
                        strokeOpacity={p.paused ? 0.35 : 1}
                        points={p.history.map((score, i) => `${x(i * p.historyStep)},${y(score)}`).join(' ')}
                    />
                ))}
            </svg>
            <ul className="legend">
                {populations.map((p, k) => (
                    <li key={p.name}>
                        <span className="swatch" style={{ background: colorOf(k) }} />
                        {p.name}
                    </li>
                ))}
            </ul>
        </figure>
    );
};

export default ScoreChart;
