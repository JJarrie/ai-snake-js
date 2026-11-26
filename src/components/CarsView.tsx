import * as React from 'react';
import { RAY_ANGLES, type CarsView as CarsViewState } from '../game/cars/CarsEpisode';
import { CONE_RADIUS, createTrack, type Point } from '../game/cars/track';

interface CarsViewProps {
    view: CarsViewState;
    /** Width and height in pixels. */
    size: number;
    label: string;
}

const MARGIN = 6;

const toPoints = (points: Point[]): string => points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

/** Top view of the track (rebuilt from its seed), the car and its sensor rays. */
const CarsView = ({ view, size, label }: CarsViewProps) => {
    const track = React.useMemo(() => createTrack(view.seed), [view.seed]);
    const bounds = React.useMemo(() => {
        const xs = track.right.map((p) => p.x);
        const ys = track.right.map((p) => p.y);
        const minX = Math.min(...xs) - MARGIN;
        const minY = Math.min(...ys) - MARGIN;
        return { minX, minY, width: Math.max(...xs) + MARGIN - minX, height: Math.max(...ys) + MARGIN - minY };
    }, [track]);
    const { car, rays } = view;

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
            {view.obstacles &&
                track.cones.map((cone, i) => (
                    <circle key={`cone_${i}`} cx={cone.x} cy={cone.y} r={CONE_RADIUS} className="cone" />
                ))}
            {rays.map((length, i) => (
                <line
                    key={`ray_${i}`}
                    x1={car.x}
                    y1={car.y}
                    x2={car.x + Math.cos(car.heading + RAY_ANGLES[i]) * length}
                    y2={car.y + Math.sin(car.heading + RAY_ANGLES[i]) * length}
                    className="ray"
                />
            ))}
            <rect
                x={car.x - 4}
                y={car.y - 2}
                width={8}
                height={4}
                rx={1}
                transform={`rotate(${(car.heading * 180) / Math.PI} ${car.x} ${car.y})`}
                className={view.crashed ? 'car crashed' : 'car'}
            />
        </svg>
    );
};

export default CarsView;
