import * as SocketIo from 'socket.io';
import { createServer } from 'http';
import Population from './ai/Population';
import ClassicGa from './ai/strategy/ClassicGa';
import DeepGa from './ai/strategy/DeepGa';
import OpenAiEs from './ai/strategy/OpenAiEs';
import { randomSeed } from './utils/SeededRandom';
import BoardSize from './rule/BoardSize';
import { envNumber } from './utils/env';

// Validate the config before opening the port.
const port = envNumber('PORT', 3000, 0, 65535);
// Per strategy: all strategies run in the same loop.
const populationSize = envNumber('POPULATION_SIZE', 500, 2, 100000);
const mutationRate = envNumber('MUTATION_RATE', 0.05, 0, 1);

const httpServer = createServer();
const io = new SocketIo.Server(httpServer, {
    cors: {
        origin: process.env.CORS_ORIGIN ?? 'http://localhost:8080',
        methods: ['GET', 'POST'],
    },
});

io.on('connection', () => console.log('an user connected'));

// Local only by default: the stream has no authentication.
const host = process.env.HOST ?? '127.0.0.1';
httpServer.listen(port, host, () => {
    console.log(`listening on ${host}:${port}`);
});

const boardSize = new BoardSize(20, 20);
// One base seed for all: at the same generation, every strategy plays the same food sequence.
const baseSeed = randomSeed();
const populations = [new ClassicGa(mutationRate), new DeepGa(), new OpenAiEs()].map(
    (strategy) => new Population(populationSize, boardSize, strategy, baseSeed),
);
const paused = new Set<string>();

io.on('connection', (socket) => {
    socket.on('toggle strategy', (name: unknown) => {
        if (!populations.some((p) => p.strategy.name === name)) {
            return;
        }
        const strategyName = name as string;
        if (!paused.delete(strategyName)) {
            paused.add(strategyName);
        }
    });
});

const EMIT_INTERVAL_MS = 33;
let lastEmit = 0;

setInterval(() => {
    for (const population of populations) {
        if (paused.has(population.strategy.name)) {
            continue;
        }

        if (population.done()) {
            population.calculateFitness();
            population.naturalSelection();
        }
        // Always step before emitting: a fresh game has no vision or decision yet.
        population.update();
    }

    const now = Date.now();
    // Throttled, and volatile so a slow client drops frames instead of buffering them.
    if (io.engine.clientsCount > 0 && now - lastEmit >= EMIT_INTERVAL_MS) {
        lastEmit = now;
        io.volatile.emit('update populations', {
            populations: populations.map((p) => ({ ...p.toState(), paused: paused.has(p.strategy.name) })),
        });
    }
}, 4);
