import Direction, { mapCardinalToCurrentDirection } from '../rule/Direction';
import DirectionCardinal from '../rule/DirectionCardinal';
import Position from '../rule/Position';
import Snake from '../rule/Snake';
import Vector2D from '../utils/Vector2D';

export interface SeenInDirection {
    food: number;
    body: number;
    wall: number;
}

class EyedSnake extends Snake {
    vision: SeenInDirection[] = [];

    public lookInDirection(directionVector: Vector2D, food: Position): SeenInDirection {
        let position = this.head.clone();
        let distance = 1;
        let foodSeen = false;
        let bodySeen = false;
        const seenInDirection = { food: 0, body: 0, wall: 0 };
        position = position.addVector(directionVector);

        while (!this.positionIsOutbound(position)) {
            if (!foodSeen && position.isEqual(food)) {
                foodSeen = true;
                seenInDirection.food = distance;
            }

            if (!bodySeen && this.positionIsInBody(position)) {
                bodySeen = true;
                seenInDirection.body = distance;
            }

            position = position.addVector(directionVector);
            distance = distance + 1;
        }

        seenInDirection.wall = 1 / distance;

        return seenInDirection;
    }

    public look(food: Position): void {
        this.vision = [];
        this.vision[Direction.FRONT] = this.lookInDirection(
            EyedSnake.mapVectorToDirection(mapCardinalToCurrentDirection(this.direction, Direction.FRONT)),
            food,
        );
        this.vision[Direction.BACK] = this.lookInDirection(
            EyedSnake.mapVectorToDirection(mapCardinalToCurrentDirection(this.direction, Direction.BACK)),
            food,
        );
        this.vision[Direction.LEFT] = this.lookInDirection(
            EyedSnake.mapVectorToDirection(mapCardinalToCurrentDirection(this.direction, Direction.LEFT)),
            food,
        );
        this.vision[Direction.RIGHT] = this.lookInDirection(
            EyedSnake.mapVectorToDirection(mapCardinalToCurrentDirection(this.direction, Direction.RIGHT)),
            food,
        );
        this.vision[Direction.FRONT_LEFT] = this.lookInDirection(
            EyedSnake.mapVectorToDirection(mapCardinalToCurrentDirection(this.direction, Direction.FRONT_LEFT)),
            food,
        );
        this.vision[Direction.FRONT_RIGHT] = this.lookInDirection(
            EyedSnake.mapVectorToDirection(mapCardinalToCurrentDirection(this.direction, Direction.FRONT_RIGHT)),
            food,
        );
        this.vision[Direction.BACK_LEFT] = this.lookInDirection(
            EyedSnake.mapVectorToDirection(mapCardinalToCurrentDirection(this.direction, Direction.BACK_LEFT)),
            food,
        );
        this.vision[Direction.BACK_RIGHT] = this.lookInDirection(
            EyedSnake.mapVectorToDirection(mapCardinalToCurrentDirection(this.direction, Direction.BACK_RIGHT)),
            food,
        );
    }

    public getVisionAsArray(): number[] {
        return [
            this.vision[Direction.FRONT].food,
            this.vision[Direction.FRONT].body,
            this.vision[Direction.FRONT].wall,
            this.vision[Direction.BACK].food,
            this.vision[Direction.BACK].body,
            this.vision[Direction.BACK].wall,
            this.vision[Direction.LEFT].food,
            this.vision[Direction.LEFT].body,
            this.vision[Direction.LEFT].wall,
            this.vision[Direction.RIGHT].food,
            this.vision[Direction.RIGHT].body,
            this.vision[Direction.RIGHT].wall,
            this.vision[Direction.FRONT_LEFT].food,
            this.vision[Direction.FRONT_LEFT].body,
            this.vision[Direction.FRONT_LEFT].wall,
            this.vision[Direction.FRONT_RIGHT].food,
            this.vision[Direction.FRONT_RIGHT].body,
            this.vision[Direction.FRONT_RIGHT].wall,
            this.vision[Direction.BACK_LEFT].food,
            this.vision[Direction.BACK_LEFT].body,
            this.vision[Direction.BACK_LEFT].wall,
            this.vision[Direction.BACK_RIGHT].food,
            this.vision[Direction.BACK_RIGHT].body,
            this.vision[Direction.BACK_RIGHT].wall,
        ];
    }

    private static mapVectorToDirection(direction: DirectionCardinal): Vector2D {
        switch (direction) {
            case DirectionCardinal.NORTH:
                return new Vector2D(0, -1);
            case DirectionCardinal.NORTH_EAST:
                return new Vector2D(1, -1);
            case DirectionCardinal.EAST:
                return new Vector2D(1, 0);
            case DirectionCardinal.SOUTH_EAST:
                return new Vector2D(1, 1);
            case DirectionCardinal.SOUTH:
                return new Vector2D(0, 1);
            case DirectionCardinal.SOUTH_WEST:
                return new Vector2D(-1, 1);
            case DirectionCardinal.WEST:
                return new Vector2D(-1, 0);
            case DirectionCardinal.NORTH_WEST:
                return new Vector2D(-1, -1);
        }
    }

    private positionIsInBody(position: Position): boolean {
        return this.body.filter((bodyPosition) => bodyPosition.isEqual(position)).length > 0;
    }

    private positionIsOutbound(position: Position): boolean {
        return (
            position.y < 0 ||
            position.y >= this.boardSize.height ||
            position.x < 0 ||
            position.x >= this.boardSize.width
        );
    }
}

export default EyedSnake;
