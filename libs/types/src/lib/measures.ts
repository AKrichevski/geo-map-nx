export enum MEASURE_NAMES {
  SQUARE_KILOMETER = 'km²',
  SQUARE_METER = 'm²',
}

export type AreaUnit = MEASURE_NAMES.SQUARE_KILOMETER | MEASURE_NAMES.SQUARE_METER;

export interface AreaResult {
  value: number;
  unit: AreaUnit;
}
