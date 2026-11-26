import * as React from 'react';
import type { Control } from '../sim/Simulation';
import type { Commands } from './commands';

interface ControlBarProps {
    running: boolean;
    generation: number;
    commands: Commands;
}

const ControlBar = ({ running, generation, commands }: ControlBarProps) => {
    const [error, setError] = React.useState<string>();

    const run = async (action: Control) => setError(await commands.control(action));
    const reset = () => {
        // Reset throws away every population trained so far.
        if (window.confirm('Reset every strategy and lose the current training?')) {
            void run('reset');
        }
    };

    return (
        <header className="control-bar">
            <h1>Snake neuroevolution</h1>
            <span className={`status ${running ? 'running' : 'paused'}`} role="status">
                {running ? 'Running' : 'Paused'} · generation {generation}
            </span>
            <div className="buttons">
                <button type="button" className="primary" onClick={() => void run(running ? 'pause' : 'start')}>
                    {running ? '❚❚ Pause' : '▶ Start'}
                </button>
                <button type="button" onClick={reset}>
                    ↺ Reset
                </button>
            </div>
            {error && (
                <p className="error" role="alert">
                    {error}
                </p>
            )}
        </header>
    );
};

export default ControlBar;
