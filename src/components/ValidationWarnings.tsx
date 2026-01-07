import React from "react";
import { AlertCircle } from "lucide-react";

interface ValidationWarning {
  type: "overlap" | "invalid-duration" | "outside-run" | "error";
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

 const getWarningColor = (type: string) => {
   switch (type) {
     case "error":
       return "bg-red-950/40 border-red-500 text-red-200";
     case "overlap":
       return "bg-red-900/30 border-red-600 text-red-300";
     case "invalid-duration":
       return "bg-orange-900/30 border-orange-600 text-orange-300";
     case "outside-run":
       return "bg-yellow-900/30 border-yellow-600 text-yellow-300";
     default:
       return "bg-slate-700 border-slate-500 text-slate-300";
   }
 };

 const getIconColor = (type: string) => {
   switch (type) {
     case "error":
     case "overlap":
       return "text-red-400";
     case "invalid-duration":
       return "text-orange-400";
     case "outside-run":
       return "text-yellow-400";
     default:
       return "text-slate-400";
   }
 };

 const getWarningTitle = (type: string) => {
   switch (type) {
     case "error":
       return "Critical Timing Error";
     case "overlap":
       return "Overlapping Loads Detected";
     case "invalid-duration":
       return "Invalid Load Duration";
     case "outside-run":
       return "Load Outside Run Boundaries";
     default:
       return "Validation Issue";
   }
 };

  return (
    <div className="bg-slate-800 rounded-lg shadow-2xl p-6 mb-6">
      <div className="space-y-3">
        {warnings.map((warning, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border-2 ${getWarningColor(
              warning.type
            )}`}
          >
            <div className="flex items-start gap-3">
              <AlertCircle
                className={`flex-shrink-0 mt-0.5 ${getIconColor(warning.type)}`}
                size={20}
              />
              <div className="flex-1">
                <div className={`font-semibold mb-1`}>
                  {getWarningTitle(warning.type)}
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
