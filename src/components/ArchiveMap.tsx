import * as React from 'react';

const CELL = 12;

interface ArchiveMapProps {
    archive: (number | null)[][];
    color: string;
}

/** Quality-diversity archive: one cell per behaviour, darker = fitter (log scale), empty = not found yet. */
const ArchiveMap = ({ archive, color }: ArchiveMapProps) => {
    const filled = archive.flat().filter((f): f is number => f !== null);
    const maxLog = Math.max(1, ...filled.map((f) => Math.log10(1 + f)));
    const size = archive.length * CELL;

    return (
        <figure className="archive">
            <svg
                width={size}
                height={size}
                role="img"
                aria-label={`Behaviour archive: ${filled.length} of ${archive.length ** 2} cells filled`}
            >
                {archive.map((row, y) =>
                    row.map((fitness, x) => (
                        <rect
                            key={`${x}_${y}`}
                            x={x * CELL}
                            // Left share grows upward.
                            y={(archive.length - 1 - y) * CELL}
                            width={CELL - 1}
                            height={CELL - 1}
                            fill={fitness === null ? '#262b36' : color}
                            fillOpacity={fitness === null ? 1 : 0.15 + (0.85 * Math.log10(1 + fitness)) / maxLog}
                        >
                            <title>{fitness === null ? 'empty' : `fitness ${Math.round(fitness)}`}</title>
                        </rect>
                    )),
                )}
            </svg>
            <figcaption>
                → turn rate, ↑ left share · {filled.length}/{archive.length ** 2} cells
            </figcaption>
        </figure>
    );
};

export default ArchiveMap;
