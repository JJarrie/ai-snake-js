import Snake from "../rule/Snake";
import Direction from "../rule/Direction";
import Position from "../rule/Position";
import Vector2D from "../utils/Vector2D";

export interface SeenInDirection {
    food: number
    body: number
    wall: number
}

class EyedSnake extends Snake {
    vision: SeenInDirection[] = []

    public lookInDirection(directionVector: Vector2D, food: Position): SeenInDirection {
        let position = this.head.clone()
        let distance = 1
        let foodSeen = false
        let bodySeen = false
        const seenInDirection = {food: 0, body: 0, wall: 0}
        position = position.addVector(directionVector)

        while (!this.positionIsOutbound(position)) {
            if (!foodSeen && position.isEqual(food)) {
                foodSeen = true
                seenInDirection.food = 1
            }

            if (!bodySeen && this.positionIsInBody(position)) {
                bodySeen = true
                seenInDirection.body = 1
            }

            position = position.addVector(directionVector)
            distance = distance + 1
        }

        seenInDirection.wall = 1 / distance

        return seenInDirection
    }

    public look(food: Position): void {
        this.vision = []
        this.vision[Direction.NORTH] = this.lookInDirection(new Vector2D(0, -1), food)
        this.vision[Direction.NORTH_EAST] = this.lookInDirection(new Vector2D(1, -1), food)
        this.vision[Direction.EAST] = this.lookInDirection(new Vector2D(1, 0), food)
        this.vision[Direction.SOUTH_EAST] = this.lookInDirection(new Vector2D(1, 1), food)
        this.vision[Direction.SOUTH] = this.lookInDirection(new Vector2D(0, 1), food)
        this.vision[Direction.SOUTH_WEST] = this.lookInDirection(new Vector2D(-1, 1), food)
        this.vision[Direction.WEST] = this.lookInDirection(new Vector2D(-1, 0), food)
        this.vision[Direction.NORTH_WEST] = this.lookInDirection(new Vector2D(-1, -1), food)
    }

    public getVisionAsArray(): number[] {
        return [
            this.vision[Direction.NORTH].food,
            this.vision[Direction.NORTH].body,
            this.vision[Direction.NORTH].wall,
            this.vision[Direction.NORTH_EAST].food,
            this.vision[Direction.NORTH_EAST].body,
            this.vision[Direction.NORTH_EAST].wall,
            this.vision[Direction.EAST].food,
            this.vision[Direction.EAST].body,
            this.vision[Direction.EAST].wall,
            this.vision[Direction.SOUTH_EAST].food,
            this.vision[Direction.SOUTH_EAST].body,
            this.vision[Direction.SOUTH_EAST].wall,
            this.vision[Direction.SOUTH].food,
            this.vision[Direction.SOUTH].body,
            this.vision[Direction.SOUTH].wall,
            this.vision[Direction.SOUTH_WEST].food,
            this.vision[Direction.SOUTH_WEST].body,
            this.vision[Direction.SOUTH_WEST].wall,
            this.vision[Direction.WEST].food,
            this.vision[Direction.WEST].body,
            this.vision[Direction.WEST].wall,
            this.vision[Direction.NORTH_WEST].food,
            this.vision[Direction.NORTH_WEST].body,
            this.vision[Direction.NORTH_WEST].wall,
        ]
    }

    private positionIsInBody(position: Position): boolean {
        return this.body.filter(bodyPosition => bodyPosition.isEqual(position)).length > 0
    }

    private positionIsOutbound(position: Position): boolean {
        return position.y < 0 || position.y >= this.boardSize.height || position.x < 0 || position.x >= this.boardSize.width
    }
}

export default EyedSnake