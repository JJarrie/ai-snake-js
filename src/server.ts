import * as SocketIo from 'socket.io';
import { createServer } from 'http';
import Population from './ai/Population';
import BoardSize from './rule/BoardSize';
import { envNumber } from './utils/env';

// Validate the config before opening the port.
const port = envNumber('PORT', 3000, 0, 65535);
const populationSize = envNumber('POPULATION_SIZE', 2000, 2, 100000);
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
const population = new Population(populationSize, mutationRate, boardSize);

const EMIT_INTERVAL_MS = 33;
let lastEmit = 0;

setInterval(() => {
    if (!population.done()) {
        population.update();

        const now = Date.now();
        // Throttled, and volatile so a slow client drops frames instead of buffering them.
        if (io.engine.clientsCount > 0 && now - lastEmit >= EMIT_INTERVAL_MS) {
            lastEmit = now;
            io.volatile.emit('update population', { population: population.toState() });
        }
    } else {
        population.calculateFitness();
        population.naturalSelection();
    }
}, 4);
