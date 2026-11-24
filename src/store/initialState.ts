import type State from './State';
import BoardSize from '../rule/BoardSize';

export const generateInitialState = (boardSize: BoardSize): State => ({ boardSize });
