export type Side = 'player' | 'enemy';

export const otherSide = (s: Side): Side => (s === 'player' ? 'enemy' : 'player');
