import Direction from "../rule/Direction"

export type DistanceByDirection = {
    [K in Direction]?: number
}

class SnakeVision {
    food: DistanceByDirection
    body: DistanceByDirection
    bounds: DistanceByDirection

    constructor(food: DistanceByDirection, body: DistanceByDirection, bounds: DistanceByDirection) {
        this.food = food
        this.body = body
        this.bounds = bounds
    }

    public toArray(): number[] {
        return [
            this.food[Direction.NORTH],
            this.body[Direction.NORTH],
            this.bounds[Direction.NORTH],
            this.food[Direction.NORTH_EAST],
            this.body[Direction.NORTH_EAST],
            this.bounds[Direction.NORTH_EAST],
            this.food[Direction.EAST],
            this.body[Direction.EAST],
            this.bounds[Direction.EAST],
            this.food[Direction.SOUTH_EAST],
            this.body[Direction.SOUTH_EAST],
            this.bounds[Direction.SOUTH_EAST],
            this.food[Direction.SOUTH],
            this.body[Direction.SOUTH],
            this.bounds[Direction.SOUTH],
            this.food[Direction.SOUTH_WEST],
            this.body[Direction.SOUTH_WEST],
            this.bounds[Direction.SOUTH_WEST],
            this.food[Direction.WEST],
            this.body[Direction.WEST],
            this.bounds[Direction.WEST],
            this.food[Direction.NORTH_WEST],
            this.body[Direction.NORTH_WEST],
            this.bounds[Direction.NORTH_WEST],
        ]
    }
}

export default SnakeVision