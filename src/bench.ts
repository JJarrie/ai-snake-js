import { mkdirSync, writeFileSync } from 'node:fs';
import { availableParallelism } from 'node:os';
import { join } from 'node:path';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { createStrategies } from './ai/strategy/registry';
import { records, runOnce, summarize } from './bench/benchmark';
import type { GameId } from './game/Episode';
import { createGame, GAME_IDS, isGameId } from './game/registry';
import { SETTING_LIMITS } from './sim/settings';
import { envNumber } from './utils/env';

interface Options {
    runs: number;
    generations: number;
    populationSize: number;
    mutationRate: number;
    strategies: string[];
    game: GameId;
    boardSize: number;
    obstacles: boolean;
}

interface Task {
    strategy: string;
    run: number;
}

interface Result extends Task {
    history: number[];
    ms: number;
}

const readOptions = (): Options => {
    const names = createStrategies(0).map((s) => s.name);
    const wanted = (process.env.BENCH_STRATEGIES ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s !== '');
    const unknown = wanted.filter((w) => !names.includes(w));
    if (unknown.length > 0) {
        throw new Error(`Unknown BENCH_STRATEGIES ${unknown.join(', ')}; known: ${names.join(', ')}`);
    }
    const game = process.env.BENCH_GAME ?? 'snake';
    if (!isGameId(game)) {
        throw new Error(`Unknown BENCH_GAME ${game}; known: ${GAME_IDS.join(', ')}`);
    }

    return {
        game,
        obstacles: process.env.BENCH_OBSTACLES === '1',
        boardSize: envNumber('BOARD_SIZE', 20, SETTING_LIMITS.boardSize.min, SETTING_LIMITS.boardSize.max),
        runs: envNumber('BENCH_RUNS', 5, 1, 1000),
        generations: envNumber('BENCH_GENERATIONS', 50, 1, 100000),
        populationSize: envNumber('BENCH_POPULATION', 300, 2, 100000),
        mutationRate: envNumber('MUTATION_RATE', 0.05, 0, 1),
        strategies: wanted.length > 0 ? wanted : names,
    };
};

/** Worker side: train one (strategy, run) pair and send its history back. */
const work = (): void => {
    const { task, options } = workerData as { task: Task; options: Options };
    const strategy = createStrategies(options.mutationRate).find((s) => s.name === task.strategy);
    if (strategy === undefined) {
        throw new Error(`Unknown strategy ${task.strategy}`);
    }

    const start = Date.now();
    // Run i uses seed i + 1 for every strategy: runs are paired on the same worlds (food, tracks, obstacles).
    const game = createGame(options.game, options.boardSize, options.obstacles);
    const history = runOnce(strategy, game, options.populationSize, options.generations, task.run + 1);
    parentPort?.postMessage({ ...task, history, ms: Date.now() - start } satisfies Result);
};

const runInWorker = (task: Task, options: Options): Promise<Result> =>
    new Promise((resolve, reject) => {
        // The bundle is both the coordinator and the worker script.
        const worker = new Worker(process.argv[1], { workerData: { task, options } });
        worker.once('message', resolve);
        worker.once('error', reject);
        worker.once('exit', (code) => {
            if (code !== 0) {
                reject(new Error(`Worker for ${task.strategy} run ${task.run} exited with code ${code}`));
            }
        });
    });

const format = (values: number[]): string => {
    const { mean, std } = summarize(values);

    return `${mean.toFixed(1)} ± ${std.toFixed(1)}`.padStart(14);
};

const report = (options: Options, results: Result[]): void => {
    const checkpoints = [...new Set([10, 25, 50, 100, 200, 500, options.generations])]
        .filter((g) => g <= options.generations)
        .sort((a, b) => a - b);

    console.log(`\nRecord (best score so far), mean ± std over ${options.runs} runs`);
    console.log(
        'Strategy'.padEnd(22) +
            checkpoints.map((g) => `gen ${g}`.padStart(14)).join('') +
            'last gen best'.padStart(16) +
            'time/run'.padStart(10),
    );

    for (const name of options.strategies) {
        const own = results.filter((r) => r.strategy === name);
        const curves = own.map((r) => records(r.history));
        const seconds = own.reduce((s, r) => s + r.ms, 0) / own.length / 1000;

        console.log(
            name.padEnd(22) +
                checkpoints.map((g) => format(curves.map((c) => c[g - 1]))).join('') +
                format(own.map((r) => r.history[r.history.length - 1])).padStart(16) +
                `${seconds.toFixed(0)} s`.padStart(10),
        );
    }
};

const main = async (): Promise<void> => {
    const options = readOptions();
    const tasks = options.strategies.flatMap((strategy) =>
        [...Array(options.runs)].map((_, run) => ({ strategy, run })),
    );
    const workers = envNumber('BENCH_WORKERS', Math.max(1, availableParallelism() - 1), 1, 1024);
    console.log(
        `${options.game}${options.obstacles ? ' with obstacles' : ''}: ${tasks.length} runs (${options.strategies.length} strategies x ${options.runs}), ` +
            `${options.generations} generations of ${options.populationSize} individuals, ${workers} workers`,
    );

    const results: Result[] = [];
    let next = 0;
    const lane = async (): Promise<void> => {
        while (next < tasks.length) {
            const task = tasks[next++];
            results.push(await runInWorker(task, options));
            console.log(`  ${results.length}/${tasks.length} done (${task.strategy} run ${task.run})`);
        }
    };
    await Promise.all([...Array(Math.min(workers, tasks.length))].map(lane));

    report(options, results);

    const dir = join(process.cwd(), 'build', 'bench');
    mkdirSync(dir, { recursive: true });
    const file = join(dir, `bench-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    writeFileSync(file, JSON.stringify({ options, results }, null, 2));
    console.log(`\nRaw results: ${file}`);
};

if (isMainThread) {
    main().catch((error: unknown) => {
        console.error(error);
        process.exit(1);
    });
} else {
    work();
}
