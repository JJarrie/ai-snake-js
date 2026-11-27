import * as React from 'react';
import type { EpisodeState } from '../game/Episode';
import Board from './Board';
import CarsView from './CarsView';

interface EpisodeViewProps {
    episode: EpisodeState;
    /** Width and height in pixels. */
    size: number;
    label: string;
    /** Draw what the agent's sensors see (snake lines of sight, car rays). */
    showSensors: boolean;
}

/** Draws an episode with the renderer of its game. */
const EpisodeView = ({ episode, size, label, showSensors }: EpisodeViewProps) => {
    const { view } = episode;
    switch (view.kind) {
        case 'snake':
            return (
                <Board
                    grid={view.grid}
                    size={size}
                    label={label}
                    sight={showSensors ? { head: view.head, vision: view.vision } : undefined}
                />
            );
        case 'cars':
            return <CarsView view={view} size={size} label={label} showRays={showSensors} />;
    }
};

export default EpisodeView;
