import React from "react";
import { AlertCircle } from "lucide-react";
import { ValidationWarning, VALIDATION_CONFIG } from "../types";

interface ValidationWarningsProps {
  warnings: ValidationWarning[];
}

const ValidationWarnings: React.FC<ValidationWarningsProps> = ({
  warnings,
}) => {
  if (warnings.length === 0) return null;

  return (
    <div className="bg-slate-800 rounded-lg shadow-2xl p-6 mb-6 border border-slate-700">
      <div className="space-y-3">
        {warnings.map((warning, index) => {
          const style = VALIDATION_CONFIG[warning.type];
          return (
            <div
              key={index}
              className={`p-4 rounded-lg border-2 ${style.bg} ${style.border}`}
            >
              <div className="flex items-start gap-3">
                <AlertCircle
                  className={`flex-shrink-0 mt-0.5 ${style.icon}`}
                  size={20}
                />
                <div className="flex-1">
                  <div className={`font-semibold mb-1 ${style.text}`}>
                    {style.label}
                  </div>
                  <div className="text-sm text-slate-300">
                    {warning.message}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ValidationWarnings;
