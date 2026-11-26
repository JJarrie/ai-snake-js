import type Population from './Population';

/**
 * One tick of the running populations, kept on the same generation: only the populations at the
 * lowest generation move, and they start their next generation together once all of them are done.
 * A population resumed after a pause catches up while the others wait.
 */
export const stepInLockstep = (running: Population[]): void => {
    if (running.length === 0) {
        return;
    }

    const generation = Math.min(...running.map((p) => p.generation));
    const current = running.filter((p) => p.generation === generation);

    if (current.every((p) => p.done())) {
        current.forEach((p) => {
            p.calculateFitness();
            p.naturalSelection();
        });
    }

    // Always step before emitting: a fresh game has no vision or decision yet.
    current.forEach((p) => p.update());
};
