import * as React from 'react';
import type { StrategyState } from '../store/State';

const WIDTH = 600;
const HEIGHT = 200;
const PADDING = 30;

interface ScoreChartProps {
    populations: StrategyState[];
    colors: string[];
}

/** Best score per generation, one line per strategy, on shared axes. */
const ScoreChart = ({ populations, colors }: ScoreChartProps) => {
    const maxGeneration = Math.max(2, ...populations.map((p) => p.history.length));
    const maxScore = Math.max(1, ...populations.flatMap((p) => p.history));
    const x = (i: number) => PADDING + (i / (maxGeneration - 1)) * (WIDTH - 2 * PADDING);
    const y = (score: number) => HEIGHT - PADDING - (score / maxScore) * (HEIGHT - 2 * PADDING);

    return (
        <svg
            width={WIDTH}
            height={HEIGHT}
            role="img"
            aria-label="Best score per generation for each strategy"
            style={{ margin: '10px' }}
        >
            <line x1={PADDING} y1={HEIGHT - PADDING} x2={WIDTH - PADDING} y2={HEIGHT - PADDING} stroke="gray" />
            <line x1={PADDING} y1={PADDING} x2={PADDING} y2={HEIGHT - PADDING} stroke="gray" />
            <text x={PADDING - 5} y={PADDING} textAnchor="end" fontSize={12}>
                {maxScore}
            </text>
            <text x={PADDING - 5} y={HEIGHT - PADDING} textAnchor="end" fontSize={12}>
                0
            </text>
            <text x={WIDTH - PADDING} y={HEIGHT - PADDING + 15} textAnchor="end" fontSize={12}>
                Generation {maxGeneration}
            </text>
            {populations.map((p, k) => (
                <polyline
                    key={p.name}
                    fill="none"
                    stroke={colors[k % colors.length]}
                    strokeWidth={1.5}
                    points={p.history.map((score, i) => `${x(i)},${y(score)}`).join(' ')}
                />
            ))}
        </svg>
    );
};

export default ScoreChart;
