import { type PointConfig } from "./scoring";

export interface Grade {
  id: string;
  name: string;
  sortOrder: number;
  pointConfig: PointConfig;
}

const DEFAULT_POINT_CONFIG: PointConfig = {
  flash: 1000,
  attempts: { "2": 800, "3": 600, "4": 500 },
  maxAttempts: 10,
  minPoints: 100,
};

let _counter = 0;
export function gradeId(): string {
  return `g_${Date.now()}_${++_counter}`;
}

const GRADE_NAMES = [
  "Yellow",
  "Blue",
  "Purple",
  "Green",
  "Orange",
  "Red",
  "Black",
  "White",
];

export const DEFAULT_GRADES: Grade[] = GRADE_NAMES.map((name, i) => ({
  id: gradeId(),
  name,
  sortOrder: i,
  pointConfig: { ...DEFAULT_POINT_CONFIG, attempts: { ...DEFAULT_POINT_CONFIG.attempts } },
}));
