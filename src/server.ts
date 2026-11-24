import * as SocketIo from 'socket.io';
import { createServer } from 'http';
import Population from './ai/Population';
import BoardSize from './rule/BoardSize';

const httpServer = createServer();
const io = new SocketIo.Server(httpServer, {
    cors: {
        origin: 'http://localhost:8080',
        methods: ['GET', 'POST'],
    },
});

io.on('connection', () => console.log('an user connected'));

httpServer.listen(3000, () => {
    console.log('listening on *:3000s');
});

const boardSize = new BoardSize(20, 20);
const population = new Population(2000, 0.05, boardSize);

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
