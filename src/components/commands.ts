import type { Settings } from '../sim/settings';
import type { Control } from '../sim/Simulation';

/** What the UI can ask the server; promises resolve with an error message, or undefined on success. */
export interface Commands {
    control: (action: Control) => Promise<string | undefined>;
    configure: (settings: Settings) => Promise<string | undefined>;
    toggle: (name: string) => void;
}

/** One color per strategy, in registry order. */
export const COLORS = ['#ff5c7a', '#4ade80', '#60a5fa', '#fb923c', '#c084fc', '#2dd4bf'];

export const colorOf = (index: number): string => COLORS[index % COLORS.length];
