import type { GameId } from '../game/Episode';
import { GAME_IDS, isGameId } from '../game/registry';

interface Limit {
    min: number;
    max: number;
    integer: boolean;
    /** Applied at once; any other setting only takes effect on a reset. */
    live?: boolean;
}

/** Limits of the numeric settings, shared by the server (validation) and the client (form inputs). */
export const SETTING_LIMITS = {
    populationSize: { min: 10, max: 5000, integer: true },
    mutationRate: { min: 0, max: 1, integer: false },
    boardSize: { min: 10, max: 40, integer: true },
    hiddenNeurons: { min: 4, max: 64, integer: true },
    replayMovesPerSecond: { min: 1, max: 60, integer: true, live: true },
} satisfies Record<string, Limit>;

export type SettingKey = keyof typeof SETTING_LIMITS;

/** On/off settings: random obstacles in the game, memory (recurrent network) in the agents. */
export const SWITCH_KEYS = ['obstacles', 'recurrent'] as const;
export type SwitchKey = (typeof SWITCH_KEYS)[number];

/**
 * The game being trained, the switches, plus the numeric settings.
 * Changing the game or a switch restarts the training.
 */
export type Settings = Record<SettingKey, number> & Record<SwitchKey, boolean> & { game: GameId };

export const SETTING_KEYS = Object.keys(SETTING_LIMITS) as SettingKey[];

/** Settings from an untrusted source (socket payload); throws on anything missing or out of range. */
export const validateSettings = (input: unknown): Settings => {
    if (typeof input !== 'object' || input === null) {
        throw new Error('Settings must be an object');
    }

    const values = input as Record<string, unknown>;
    if (!isGameId(values.game)) {
        throw new Error(`game must be one of ${GAME_IDS.join(', ')}`);
    }
    const switches = Object.fromEntries(
        SWITCH_KEYS.map((key) => {
            if (typeof values[key] !== 'boolean') {
                throw new Error(`${key} must be true or false`);
            }
            return [key, values[key]];
        }),
    ) as Record<SwitchKey, boolean>;

    const numbers = Object.fromEntries(
        SETTING_KEYS.map((key) => {
            const value = values[key];
            const { min, max, integer } = SETTING_LIMITS[key] as Limit;
            if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
                throw new Error(`${key} must be a number between ${min} and ${max}`);
            }
            if (integer && !Number.isInteger(value)) {
                throw new Error(`${key} must be an integer`);
            }

            return [key, value];
        }),
    ) as Record<SettingKey, number>;

    return { ...numbers, ...switches, game: values.game };
};

export const requiresReset = (current: Settings, next: Settings): boolean =>
    current.game !== next.game ||
    SWITCH_KEYS.some((key) => current[key] !== next[key]) ||
    SETTING_KEYS.some((key) => !(SETTING_LIMITS[key] as Limit).live && current[key] !== next[key]);
