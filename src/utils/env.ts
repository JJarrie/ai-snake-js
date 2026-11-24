/** Reads a numeric env var; throws on a non-numeric or out-of-range value instead of silently using NaN. */
export const envNumber = (name: string, fallback: number, min: number, max: number): number => {
    const raw = process.env[name];
    if (raw === undefined || raw === '') {
        return fallback;
    }

    const value = Number(raw);
    if (!Number.isFinite(value) || value < min || value > max) {
        throw new Error(`${name} must be a number between ${min} and ${max}, got "${raw}"`);
    }

    return value;
};
