export interface Load {
  id: number;
  startTime: number | null;
  endTime: number | null;
}

export interface RunMarker {
  time: number | null;
  offset: number;
}

export interface TimingItem {
  id: string;
  type: "run" | "load";
  label: string;
  startTime: number | null;
  endTime: number | null;
  loadIndex?: number;
  isDeletable: boolean;
}

export type ValidationType = "overlap" | "invalid-duration" | "outside-run" | "error";

export interface ValidationWarning {
  type: ValidationType;
  message: string;
  affectedLoads: number[];
}

export interface ValidationStatus {
  isOverlapping: boolean;
  isInvalidDuration: boolean;
  isOutsideRun: boolean;
  hasError: boolean;
}

export const VALIDATION_CONFIG: Record<ValidationType, { 
  border: string, 
  bg: string, 
  text: string, 
  icon: string, 
  label: string 
}> = {
  error: {
    border: "border-red-500",
    bg: "bg-red-950/40",
    text: "text-red-200",
    icon: "text-red-400",
    label: "Critical Error",
  },
  overlap: {
    border: "border-red-600",
    bg: "bg-red-900/30",
    text: "text-red-300",
    icon: "text-red-400",
    label: "Overlap",
  },
  "invalid-duration": {
    border: "border-orange-600",
    bg: "bg-orange-900/30",
    text: "text-orange-300",
    icon: "text-orange-400",
    label: "Invalid",
  },
  "outside-run": {
    border: "border-yellow-600",
    bg: "bg-yellow-900/30",
    text: "text-yellow-300",
    icon: "text-yellow-400",
    label: "Outside",
  },
};