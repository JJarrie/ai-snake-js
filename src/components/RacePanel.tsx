import * as React from 'react';
import type { RaceLeagueState, RaceResult } from '../game/cars/race';
import { CarShape, TrackView } from './CarsView';

interface RacePanelProps {
    race: RaceLeagueState;
    /** Colour of a strategy, by name. */
    colorFor: (name: string) => string;
    size: number;
}

const lastRace = (result: RaceResult | undefined): string => {
    if (result === undefined) {
        return '—';
    }
    const detail = result.time !== null ? `${result.time} steps` : `out at ${Math.round(result.distance * 100)} %`;
    return `${result.place}. · ${detail}`;
};

/** Standings of the races between strategies, and a replay of the last race with every car on the track. */
const RacePanel = ({ race, colorFor, size }: RacePanelProps) => {
    const { replay, standings, last } = race;

    return (
        <figure className="panel champion race">
            <figcaption>
                Race {race.races}
                {replay && ` · ${replay.laps} ${replay.laps > 1 ? 'laps' : 'lap'} on a track never seen in training`}
                <span className="replay-score">
                    The best car of each strategy's last generation, every few generations; no collisions.
                </span>
            </figcaption>
            {replay && (
                <TrackView
                    seed={replay.seed}
                    obstacles={replay.obstacles}
                    size={size}
                    label={`Replay of race ${race.races}`}
                >
                    {replay.cars.map((car) => (
                        <CarShape key={car.name} {...car} color={colorFor(car.name)} />
                    ))}
                </TrackView>
            )}
            <table className="standings">
                <caption>Standings</caption>
                <thead>
                    <tr>
                        <th scope="col">#</th>
                        <th scope="col">Strategy</th>
                        <th scope="col">Points</th>
                        <th scope="col">Wins</th>
                        <th scope="col">Last race</th>
                    </tr>
                </thead>
                <tbody>
                    {standings.map((s, i) => (
                        <tr key={s.name}>
                            <td>{i + 1}</td>
                            <th scope="row" style={{ color: colorFor(s.name) }}>
                                {s.name}
                            </th>
                            <td>{s.points}</td>
                            <td>{s.wins}</td>
                            <td>{lastRace(last.find((r) => r.name === s.name))}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </figure>
    );
};

export default RacePanel;
