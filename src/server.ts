import * as SocketIo from 'socket.io';
import { createServer } from 'http';
import Population from './ai/Population';
import BoardSize from './rule/BoardSize';

const httpServer = createServer();
const io = new SocketIo.Server(httpServer, {
    cors: {
        origin: process.env.CORS_ORIGIN ?? 'http://localhost:8080',
        methods: ['GET', 'POST'],
    },
});

io.on('connection', () => console.log('an user connected'));

const port = Number(process.env.PORT ?? 3000);
httpServer.listen(port, () => {
    console.log(`listening on *:${port}`);
});

const boardSize = new BoardSize(20, 20);
const population = new Population(
    Number(process.env.POPULATION_SIZE ?? 2000),
    Number(process.env.MUTATION_RATE ?? 0.05),
    boardSize,
);

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
