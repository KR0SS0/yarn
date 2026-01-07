import React from "react";
import { AlertCircle } from "lucide-react";

interface ValidationWarning {
  type: "overlap" | "error";
  message: string;
  affectedLoads: number[];
}

interface ValidationWarningsProps {
  warnings: ValidationWarning[];
}

const ValidationWarnings: React.FC<ValidationWarningsProps> = ({
  warnings,
}) => {
  if (warnings.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-800 rounded-lg shadow-2xl p-6 mb-6">
      <div className="space-y-3">
        {warnings.map((warning, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border-2 ${
              warning.type === "overlap"
                ? "bg-red-900/30 border-red-600"
                : "bg-yellow-900/30 border-yellow-600"
            }`}
          >
            <div className="flex items-start gap-3">
              <AlertCircle
                className={`flex-shrink-0 mt-0.5 ${
                  warning.type === "overlap"
                    ? "text-red-400"
                    : "text-yellow-400"
                }`}
                size={20}
              />
              <div className="flex-1">
                <div
                  className={`font-semibold mb-1 ${
                    warning.type === "overlap"
                      ? "text-red-300"
                      : "text-yellow-300"
                  }`}
                >
                  {warning.type === "overlap"
                    ? "Overlapping Loads Detected"
                    : "Warning"}
                </div>
                <div className="text-sm text-slate-300">{warning.message}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ValidationWarnings;