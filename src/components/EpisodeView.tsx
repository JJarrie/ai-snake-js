import * as React from 'react';
import type { EpisodeState } from '../game/Episode';
import Board from './Board';

interface EpisodeViewProps {
    episode: EpisodeState;
    /** Width and height in pixels. */
    size: number;
    label: string;
}

/** Draws an episode with the renderer of its game. */
const EpisodeView = ({ episode, size, label }: EpisodeViewProps) => {
    switch (episode.view.kind) {
        case 'snake':
            return <Board grid={episode.view.grid} size={size} label={label} />;
    }
};

export default EpisodeView;
