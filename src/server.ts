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

const boardSize = new BoardSize(15, 15);
const population = new Population(5000, 0.1, boardSize);

setInterval(() => {
    if (!population.done()) {
        population.update();
        io.emit('update population', { population: population.toState() });
    } else {
        population.calculateFitness();
        population.naturalSelection();
    }
}, 4);
