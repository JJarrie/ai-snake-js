import Direction from "../rule/Direction"

export type DistanceByDirection = {
    [K in Direction]?: number
}

interface SnakeVision {
    food: DistanceByDirection
    body: DistanceByDirection
    bounds: DistanceByDirection
}

export default SnakeVision