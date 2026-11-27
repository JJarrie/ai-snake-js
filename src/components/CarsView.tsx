import * as React from 'react';
import { RAY_ANGLES, type CarsView as CarsViewState } from '../game/cars/CarsEpisode';
import { CONE_RADIUS, createTrack, type Point } from '../game/cars/track';

const MARGIN = 6;

const toPoints = (points: Point[]): string => points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

interface TrackViewProps {
    seed: number;
    obstacles: boolean;
    /** Width and height in pixels. */
    size: number;
    label: string;
    /** Drawn over the track, in track units. */
    children: React.ReactNode;
}

/** Top view of a track, rebuilt from its seed, with what is on it. */
export const TrackView = ({ seed, obstacles, size, label, children }: TrackViewProps) => {
    const track = React.useMemo(() => createTrack(seed), [seed]);
    const bounds = React.useMemo(() => {
        const xs = track.right.map((p) => p.x);
        const ys = track.right.map((p) => p.y);
        const minX = Math.min(...xs) - MARGIN;
        const minY = Math.min(...ys) - MARGIN;
        return { minX, minY, width: Math.max(...xs) + MARGIN - minX, height: Math.max(...ys) + MARGIN - minY };
    }, [track]);

    return (
        <svg
            className="cars-view"
            width={size}
            height={size}
            viewBox={`${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`}
            role="img"
            aria-label={label}
        >
            <polygon points={toPoints(track.right)} className="asphalt" />
            <polygon points={toPoints(track.left)} className="infield" />
            <line
                x1={track.left[0].x}
                y1={track.left[0].y}
                x2={track.right[0].x}
                y2={track.right[0].y}
                className="start-line"
            />
            {obstacles &&
                track.cones.map((cone, i) => (
                    <circle key={`cone_${i}`} cx={cone.x} cy={cone.y} r={CONE_RADIUS} className="cone" />
                ))}
            {children}
        </svg>
    );
};

interface CarShapeProps {
    x: number;
    y: number;
    heading: number;
    crashed: boolean;
    /** Fill colour; the default car colour when omitted. */
    color?: string;
}

export const CarShape = ({ x, y, heading, crashed, color }: CarShapeProps) => (
    <rect
        x={x - 4}
        y={y - 2}
        width={8}
        height={4}
        rx={1}
        transform={`rotate(${(heading * 180) / Math.PI} ${x} ${y})`}
        className={crashed ? 'car crashed' : 'car'}
        // Out of the race: grey, outlined in its strategy's colour so it stays recognisable.
        style={color ? (crashed ? { stroke: color } : { fill: color }) : undefined}
    />
);

interface CarsViewProps {
    view: CarsViewState;
    /** Width and height in pixels. */
    size: number;
    label: string;
    showRays: boolean;
}

/** One car on its track, with its sensor rays. */
const CarsView = ({ view, size, label, showRays }: CarsViewProps) => {
    const { car, rays } = view;

    return (
        <TrackView seed={view.seed} obstacles={view.obstacles} size={size} label={label}>
            {(showRays ? rays : []).map((length, i) => (
                <line
                    key={`ray_${i}`}
                    x1={car.x}
                    y1={car.y}
                    x2={car.x + Math.cos(car.heading + RAY_ANGLES[i]) * length}
                    y2={car.y + Math.sin(car.heading + RAY_ANGLES[i]) * length}
                    className="ray"
                />
            ))}
            <CarShape x={car.x} y={car.y} heading={car.heading} crashed={view.crashed} />
        </TrackView>
    );
};

export default CarsView;
