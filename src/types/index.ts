export interface Load {
  id: number;
  startTime: number | null;
  endTime: number | null;
}

export interface RunMarker {
  time: number | null;
  offset: number;
}