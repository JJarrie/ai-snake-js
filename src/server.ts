import * as SocketIo from 'socket.io';
import { createServer } from 'http';
import { SETTING_LIMITS, validateSettings, type SettingKey } from './sim/settings';
import Simulation, { type CommandResult } from './sim/Simulation';
import { envNumber } from './utils/env';

// Validate the config before opening the port.
const port = envNumber('PORT', 3000, 0, 65535);
const envSetting = (name: string, key: SettingKey, fallback: number): number =>
    envNumber(name, fallback, SETTING_LIMITS[key].min, SETTING_LIMITS[key].max);
// Start-up defaults; the UI can change them afterwards.
const simulation = new Simulation(
    validateSettings({
        // Per strategy: all strategies run in the same loop.
        populationSize: envSetting('POPULATION_SIZE', 'populationSize', 500),
        mutationRate: envSetting('MUTATION_RATE', 'mutationRate', 0.05),
        boardSize: envSetting('BOARD_SIZE', 'boardSize', 20),
        hiddenNeurons: envSetting('HIDDEN_NEURONS', 'hiddenNeurons', 16),
        // Display pace of the record replays, independent of the training speed.
        replayMovesPerSecond: envSetting('REPLAY_MOVES_PER_SECOND', 'replayMovesPerSecond', 15),
        game: process.env.GAME ?? 'snake',
        // OBSTACLES=1 turns them on at start-up; any other value or none leaves them off.
        obstacles: process.env.OBSTACLES === '1',
    }),
);

const httpServer = createServer();
const io = new SocketIo.Server(httpServer, {
    cors: {
        origin: process.env.CORS_ORIGIN ?? 'http://localhost:8080',
        methods: ['GET', 'POST'],
    },
});

/** Runs a client command and answers through the socket.io acknowledgement, if the client asked for one. */
const answer = (ack: unknown, command: () => void): void => {
    let result: CommandResult;
    try {
        command();
        result = {};
    } catch (error) {
        result = { error: error instanceof Error ? error.message : String(error) };
    }
    if (typeof ack === 'function') {
        ack(result);
    }
};

io.on('connection', (socket) => {
    console.log('an user connected');
    socket.on('control', (action: unknown, ack: unknown) => answer(ack, () => simulation.control(action)));
    socket.on('configure', (settings: unknown, ack: unknown) => answer(ack, () => simulation.configure(settings)));
    socket.on('toggle strategy', (name: unknown) => simulation.toggle(name));
});

// Local only by default: the stream has no authentication.
const host = process.env.HOST ?? '127.0.0.1';
httpServer.listen(port, host, () => {
    console.log(`listening on ${host}:${port}`);
});

const EMIT_INTERVAL_MS = 33;
let lastEmit = 0;

setInterval(() => {
    simulation.tick();
    const now = Date.now();
    simulation.stepReplays(now);

    // Throttled, and volatile so a slow client drops frames instead of buffering them.
    if (io.engine.clientsCount > 0 && now - lastEmit >= EMIT_INTERVAL_MS) {
        lastEmit = now;
        io.volatile.emit('update simulation', simulation.toState());
    }
}, 4);
