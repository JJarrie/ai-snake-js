import DirectionCardinal from './DirectionCardinal';

enum Direction {
    FRONT = 0b1,
    BACK = 0b10,
    RIGHT = 0b100,
    LEFT = 0b1000,
    FRONT_LEFT = 0b1001,
    FRONT_RIGHT = 0b101,
    BACK_LEFT = 0b1010,
    BACK_RIGHT = 0b110,
}

export const flipDirection = (direction: DirectionCardinal): DirectionCardinal => {
    switch (direction) {
        case DirectionCardinal.EAST:
            return DirectionCardinal.WEST;
        case DirectionCardinal.NORTH:
            return DirectionCardinal.SOUTH;
        case DirectionCardinal.NORTH_EAST:
            return DirectionCardinal.SOUTH_WEST;
        case DirectionCardinal.NORTH_WEST:
            return DirectionCardinal.SOUTH_EAST;
        case DirectionCardinal.SOUTH:
            return DirectionCardinal.NORTH;
        case DirectionCardinal.SOUTH_EAST:
            return DirectionCardinal.NORTH_WEST;
        case DirectionCardinal.SOUTH_WEST:
            return DirectionCardinal.NORTH_EAST;
        case DirectionCardinal.WEST:
            return DirectionCardinal.EAST;
    }
};

export const turnLeft45 = (direction: DirectionCardinal): DirectionCardinal => {
    switch (direction) {
        case DirectionCardinal.EAST:
            return DirectionCardinal.NORTH_EAST;
        case DirectionCardinal.NORTH_EAST:
            return DirectionCardinal.NORTH;
        case DirectionCardinal.NORTH:
            return DirectionCardinal.NORTH_WEST;
        case DirectionCardinal.NORTH_WEST:
            return DirectionCardinal.WEST;
        case DirectionCardinal.WEST:
            return DirectionCardinal.SOUTH_WEST;
        case DirectionCardinal.SOUTH_WEST:
            return DirectionCardinal.SOUTH;
        case DirectionCardinal.SOUTH:
            return DirectionCardinal.SOUTH_EAST;
        case DirectionCardinal.SOUTH_EAST:
            return DirectionCardinal.EAST;
    }
};

export const turnRight45 = (direction: DirectionCardinal): DirectionCardinal => {
    switch (direction) {
        case DirectionCardinal.EAST:
            return DirectionCardinal.SOUTH_EAST;
        case DirectionCardinal.NORTH_EAST:
            return DirectionCardinal.EAST;
        case DirectionCardinal.NORTH:
            return DirectionCardinal.NORTH_EAST;
        case DirectionCardinal.NORTH_WEST:
            return DirectionCardinal.NORTH;
        case DirectionCardinal.WEST:
            return DirectionCardinal.NORTH_WEST;
        case DirectionCardinal.SOUTH_WEST:
            return DirectionCardinal.WEST;
        case DirectionCardinal.SOUTH:
            return DirectionCardinal.SOUTH_WEST;
        case DirectionCardinal.SOUTH_EAST:
            return DirectionCardinal.SOUTH;
    }
};

export const turnLeft90 = (direction: DirectionCardinal): DirectionCardinal => {
    switch (direction) {
        case DirectionCardinal.EAST:
            return DirectionCardinal.NORTH;
        case DirectionCardinal.NORTH:
            return DirectionCardinal.WEST;
        case DirectionCardinal.SOUTH:
            return DirectionCardinal.EAST;
        case DirectionCardinal.WEST:
            return DirectionCardinal.SOUTH;
        case DirectionCardinal.NORTH_EAST:
            return DirectionCardinal.NORTH_WEST;
        case DirectionCardinal.SOUTH_WEST:
            return DirectionCardinal.SOUTH_EAST;
        case DirectionCardinal.SOUTH_EAST:
            return DirectionCardinal.NORTH_EAST;
        case DirectionCardinal.NORTH_WEST:
            return DirectionCardinal.SOUTH_WEST;
    }
};

export const turnRight90 = (direction: DirectionCardinal): DirectionCardinal => {
    switch (direction) {
        case DirectionCardinal.EAST:
            return DirectionCardinal.SOUTH;
        case DirectionCardinal.NORTH:
            return DirectionCardinal.EAST;
        case DirectionCardinal.SOUTH:
            return DirectionCardinal.WEST;
        case DirectionCardinal.WEST:
            return DirectionCardinal.NORTH;
        case DirectionCardinal.NORTH_EAST:
            return DirectionCardinal.SOUTH_EAST;
        case DirectionCardinal.SOUTH_WEST:
            return DirectionCardinal.NORTH_WEST;
        case DirectionCardinal.SOUTH_EAST:
            return DirectionCardinal.SOUTH_WEST;
        case DirectionCardinal.NORTH_WEST:
            return DirectionCardinal.NORTH_EAST;
    }
};

export const mapCardinalToCurrentDirection = (
    currentDirection: DirectionCardinal,
    wantedDirection: Direction,
): DirectionCardinal => {
    switch (wantedDirection) {
        case Direction.FRONT:
            return currentDirection;
        case Direction.BACK:
            return flipDirection(currentDirection);
        case Direction.LEFT:
            return turnLeft90(currentDirection);
        case Direction.RIGHT:
            return turnRight90(currentDirection);
        case Direction.BACK_LEFT:
            return turnLeft90(turnLeft45(currentDirection));
        case Direction.BACK_RIGHT:
            return turnRight90(turnRight45(currentDirection));
        case Direction.FRONT_RIGHT:
            return turnRight45(currentDirection);
        case Direction.FRONT_LEFT:
            return turnLeft45(currentDirection);
    }
};

export default Direction;
