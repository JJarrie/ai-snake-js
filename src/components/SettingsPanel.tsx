import * as React from 'react';
import { SETTING_KEYS, SETTING_LIMITS, requiresReset, type SettingKey, type Settings } from '../sim/settings';
import type { Commands } from './commands';

const LABELS: Record<SettingKey, string> = {
    populationSize: 'Snakes per strategy',
    mutationRate: 'Mutation rate (Classic GA)',
    boardSize: 'Board size',
    hiddenNeurons: 'Hidden neurons',
    replayMovesPerSecond: 'Replay speed (moves/s)',
};

interface SettingsPanelProps {
    settings: Settings;
    commands: Commands;
}

const SettingsPanel = ({ settings, commands }: SettingsPanelProps) => {
    // Only the fields being edited; the others show the server's current values.
    const [edits, setEdits] = React.useState<Partial<Record<SettingKey, string>>>({});
    const [message, setMessage] = React.useState<{ error: boolean; text: string }>();

    const draft = Object.fromEntries(SETTING_KEYS.map((key) => [key, Number(edits[key] ?? settings[key])])) as Settings;
    const willReset = requiresReset(settings, draft);

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (willReset && !window.confirm('These settings restart every strategy from scratch. Apply?')) {
            return;
        }
        const error = await commands.configure(draft);
        if (error === undefined) {
            setEdits({});
        }
        setMessage(error === undefined ? { error: false, text: 'Applied' } : { error: true, text: error });
    };

    return (
        <details className="panel settings">
            <summary>Settings</summary>
            <form onSubmit={(event) => void submit(event)}>
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
