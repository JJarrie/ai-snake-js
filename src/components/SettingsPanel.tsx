import * as React from 'react';
import type { GameId } from '../game/Episode';
import { GAME_IDS, GAME_NAMES } from '../game/registry';
import { SETTING_KEYS, SETTING_LIMITS, requiresReset, type SettingKey, type Settings } from '../sim/settings';
import type { Commands } from './commands';

const LABELS: Record<SettingKey, string> = {
    populationSize: 'Individuals per strategy',
    mutationRate: 'Mutation rate (Classic GA)',
    boardSize: 'Board size (Snake)',
    hiddenNeurons: 'Hidden neurons',
    replayMovesPerSecond: 'Replay speed (moves/s)',
};

/** Settings that do not apply to a game: shown disabled. */
const UNUSED: Record<GameId, SettingKey[]> = {
    snake: [],
    cars: ['boardSize'],
};

interface SettingsPanelProps {
    settings: Settings;
    commands: Commands;
}

const SettingsPanel = ({ settings, commands }: SettingsPanelProps) => {
    // Only the fields being edited; the others show the server's current values.
    const [edits, setEdits] = React.useState<Partial<Record<SettingKey, string>>>({});
    const [game, setGame] = React.useState<GameId>();
    const [obstacles, setObstacles] = React.useState<boolean>();
    const [message, setMessage] = React.useState<{ error: boolean; text: string }>();

    const draft: Settings = {
        ...(Object.fromEntries(SETTING_KEYS.map((key) => [key, Number(edits[key] ?? settings[key])])) as Record<
            SettingKey,
            number
        >),
        game: game ?? settings.game,
        obstacles: obstacles ?? settings.obstacles,
    };
    const willReset = requiresReset(settings, draft);

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (willReset && !window.confirm('These settings restart every strategy from scratch. Apply?')) {
            return;
        }
        const error = await commands.configure(draft);
        if (error === undefined) {
            setEdits({});
            setGame(undefined);
            setObstacles(undefined);
        }
        setMessage(error === undefined ? { error: false, text: 'Applied' } : { error: true, text: error });
    };

    return (
        <details className="panel settings">
            <summary>Settings</summary>
            <form onSubmit={(event) => void submit(event)}>
                <label>
                    <span>Game</span>
                    <select value={draft.game} onChange={(event) => setGame(event.target.value as GameId)}>
                        {GAME_IDS.map((id) => (
                            <option key={id} value={id}>
                                {GAME_NAMES[id]}
                            </option>
                        ))}
                    </select>
                    <small>restarts training</small>
                </label>
                <label>
                    <span>Random obstacles</span>
                    <span className="checkbox-row">
                        <input
                            type="checkbox"
                            checked={draft.obstacles}
                            onChange={(event) => setObstacles(event.target.checked)}
                        />
                        {draft.game === 'snake' ? 'Walls on the board' : 'Cones on the track'}
                    </span>
                    <small>new layout every generation, restarts training</small>
                </label>
                {SETTING_KEYS.map((key) => {
                    const { min, max, integer } = SETTING_LIMITS[key];
                    return (
                        <label key={key}>
                            <span>{LABELS[key]}</span>
                            <input
                                type="number"
                                min={min}
                                max={max}
                                step={integer ? 1 : 0.01}
                                required
                                disabled={UNUSED[draft.game].includes(key)}
                                value={edits[key] ?? String(settings[key])}
                                onChange={(event) => setEdits({ ...edits, [key]: event.target.value })}
                            />
                            <small>
                                {min} – {max}
                                {'live' in SETTING_LIMITS[key] ? ', applied at once' : ', restarts training'}
                            </small>
                        </label>
                    );
                })}
                <div className="form-actions">
                    <button type="submit" className="primary">
                        {willReset ? 'Apply and reset' : 'Apply'}
                    </button>
                    {message && (
                        <span className={message.error ? 'error' : 'ok'} role="status">
                            {message.text}
                        </span>
                    )}
                </div>
            </form>
        </details>
    );
};

export default SettingsPanel;
