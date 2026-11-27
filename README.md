# ai-snake-js

Small neural networks learn to play a game by **neuroevolution**: no gradient descent and no examples, only populations of networks that are scored, selected and mutated. Six evolution strategies train side by side on the same worlds, and a dashboard shows them live.

Two games:

- **Snake** on a grid, optionally with random walls.
- **Car racing** on generated tracks, optionally with cones. The car steers and chooses to accelerate, brake or hold, and is rewarded for distance and lap time.

## Design rule: sensors only

The agents only know their world through local sensors that obstacles can block, like eyes:

- the snake has rays or a field of view that report food, its own body and walls;
- the car has wall-distance rays and its own speed.

There is no food direction, no map and no absolute position. Poor scores in hard, partially observable settings are a valid result, not a bug to hide with extra inputs.

## Run it

Node 24 or newer.

```sh
npm ci
npm run watch
```

`npm run watch` builds and restarts the socket.io server (port 3000) and serves the dashboard with webpack-dev-server (http://localhost:8080). The two run separately: the dashboard connects to the server through `SOCKET_URL`.

The server listens on `127.0.0.1` only by default: its stream has no authentication.

### Server settings

Every setting can be changed live from the dashboard's Settings panel. The environment variables only set the start-up values.

| Variable | Default | Meaning |
|---|---|---|
| `GAME` | `snake` | `snake` or `cars` |
| `POPULATION_SIZE` | 500 | individuals per strategy |
| `MUTATION_RATE` | 0.05 | Classic GA mutation rate |
| `HIDDEN_NEURONS` | 16 | size of the hidden layer |
| `BOARD_SIZE` | 20 | snake board width and height |
| `OBSTACLES` | off | `1`: walls (snake) or cones (cars) |
| `RECURRENT` | off | `1`: networks with memory (Elman recurrence) |
| `VISION` | `rays` | snake vision: `rays` (8 lines of sight) or `cone` |
| `VISION_RANGE`, `VISION_FOV`, `VISION_SECTORS` | 10, 180, 7 | snake field of view |
| `RACE_LAPS` | 1 | laps per race between strategies (cars) |
| `REPLAY_MOVES_PER_SECOND` | 15 | replay speed on the dashboard |
| `PORT`, `HOST`, `CORS_ORIGIN` | 3000, 127.0.0.1, http://localhost:8080 | server address and allowed dashboard origin |
| `SOCKET_URL` (client build) | http://localhost:3000 | where the dashboard finds the server |

## The strategies

| Strategy | How it searches |
|---|---|
| Classic GA | roulette selection on fitness, crossover, sparse mutation, one elite |
| Deep GA | top 10% copied with Gaussian noise on every weight, a few elites, no crossover |
| OpenAI-ES | moves a mean network along the gradient estimated from mirrored noisy copies |
| sep-CMA-ES | moves a mean network and adapts the step size per weight |
| MAP-Elites | keeps the best network per style of play (behaviour cell) and mutates them |
| MAP-Elites (novelty) | MAP-Elites that favours the rarest styles |
| Random search | bench-only baseline: new random networks every generation, learns nothing |

## What the numbers mean

- **Score**: what one game counts, apples for the snake and checkpoints for the car (40 per lap).
- **Fitness**: what the strategies select on. It is hand-made and differs from the score: it adds lifetime for the snake and squared distance plus a lap-time bonus for the car.
- **Record** (best game): the best single game ever played by a strategy. It is the best of thousands of noisy games, so it is optimistic. Luck can hold it for a long time, and the random baseline reaches records as high as some strategies.
- **Policy score**: the honest level.
  - Each strategy names the network it stands for: the mean for the ES family, the best archived elite for MAP-Elites, the fittest network of the last generation otherwise.
  - That network plays 10 worlds that are never used in training or selection, and the policy score is its mean score.
  - It drives the Leader badge in Snake.
- **Races** (cars): one race per generation on a new track, between each strategy's champion. The champion is the car with the best mean on 5 fixed selection tracks so far. The race standings drive the Leader badge in the car game.

Every run is reproducible: the same seed gives the same worlds and the same evolution.

## Benchmark

```sh
npm run bench
```

The benchmark trains every strategy headless several times in worker threads. It prints:

1. the held-out policy score at checkpoints, plus the area under that learning curve;
2. a paired comparison of every strategy with the best one: run *i* of every strategy faces the same worlds, so the table shows the mean difference ± a 95% interval and the runs won;
3. the record, for reference.

The raw results are saved to `build/bench/`.

| Variable | Default | Meaning |
|---|---|---|
| `BENCH_RUNS` | 5 | runs per strategy (seeds 1 to N, paired) |
| `BENCH_GENERATIONS` | 50 | generations per run |
| `BENCH_POPULATION` | 300 | individuals per strategy |
| `BENCH_STRATEGIES` | all | comma-separated names, e.g. `Deep GA,Random search` |
| `BENCH_GAME` | `snake` | `snake` or `cars` |
| `BENCH_OBSTACLES`, `BENCH_RECURRENT` | off | `1` to turn on |
| `BENCH_VISION` | `rays` | `cone` uses `VISION_RANGE`, `VISION_FOV`, `VISION_SECTORS` |
| `BENCH_WORKERS` | CPUs − 1 | worker threads |
| `BOARD_SIZE`, `MUTATION_RATE` | 20, 0.05 | as for the server |

## Develop

```sh
npm test         # Vitest
npm run lint     # Oxlint (type-aware) and Prettier check
npm run format   # Prettier
npm run build    # production build of client and server into build/
```

Code map:

- `src/ai`: networks, populations, the strategies, held-out evaluation.
- `src/game`: the generic `Episode` interface, the snake and car games, the races.
- `src/rule`: the snake rules.
- `src/sim`: the live simulation and its settings.
- `src/bench`: the benchmark.
- `src/components`: the React dashboard.
