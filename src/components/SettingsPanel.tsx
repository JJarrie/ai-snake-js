import * as React from 'react';
import type { GameId } from '../game/Episode';
import { GAME_IDS, GAME_NAMES } from '../game/registry';
import {
    SETTING_KEYS,
    SETTING_LIMITS,
    requiresReset,
    type SettingKey,
    type Settings,
    type VisionModel,
} from '../sim/settings';
import type { Commands } from './commands';

const LABELS: Record<SettingKey, string> = {
    populationSize: 'Individuals per strategy',
    mutationRate: 'Mutation rate (Classic GA)',
    boardSize: 'Board size (Snake)',
    hiddenNeurons: 'Hidden neurons',
    replayMovesPerSecond: 'Replay speed (moves/s)',
    visionRange: 'Vision range (cells)',
    visionFov: 'Field of view (degrees)',
    visionSectors: 'Vision sectors',
};

const VISION_KEYS: SettingKey[] = ['visionRange', 'visionFov', 'visionSectors'];

/** Settings that do not apply to the drafted game and vision: shown disabled. */
const unused = (draft: Settings): SettingKey[] => {
    if (draft.game === 'cars') {
        return ['boardSize', ...VISION_KEYS];
    }
    return draft.vision === 'cone' ? [] : VISION_KEYS;
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
    const [recurrent, setRecurrent] = React.useState<boolean>();
    const [vision, setVision] = React.useState<VisionModel>();
    const [message, setMessage] = React.useState<{ error: boolean; text: string }>();

    const draft: Settings = {
        ...(Object.fromEntries(SETTING_KEYS.map((key) => [key, Number(edits[key] ?? settings[key])])) as Record<
            SettingKey,
            number
        >),
        game: game ?? settings.game,
        obstacles: obstacles ?? settings.obstacles,
        recurrent: recurrent ?? settings.recurrent,
        vision: vision ?? settings.vision,
    };
    const willReset = requiresReset(settings, draft);
    const disabled = unused(draft);

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
            setRecurrent(undefined);
            setVision(undefined);
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
                <label>
                    <span>Memory</span>
                    <span className="checkbox-row">
                        <input
                            type="checkbox"
                            checked={draft.recurrent}
                            onChange={(event) => setRecurrent(event.target.checked)}
                        />
                        Recurrent network
                    </span>
                    <small>remembers what its sensors saw, restarts training</small>
                </label>
                <label>
                    <span>Snake vision</span>
                    <select
                        value={draft.vision}
                        disabled={draft.game !== 'snake'}
                        onChange={(event) => setVision(event.target.value as VisionModel)}
                    >
                        <option value="rays">8 lines of sight (unlimited)</option>
                        <option value="cone">Field of view (range, angle, sectors)</option>
                    </select>
                    <small>restarts training</small>
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
                                disabled={disabled.includes(key)}
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
