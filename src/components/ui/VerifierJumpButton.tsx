const VerifierJumpButton: React.FC<{
  label: string;
  offset: number;
  time: number | null;
  onClick: (time: number | null, offset: number) => void;
  primary?: boolean;
}> = ({ label, offset, time, onClick, primary }) => (
  <button
    onClick={() => onClick(time, offset)}
    disabled={time === null}
    onMouseDown={(e) => e.preventDefault()}
    className={`py-2 rounded text-[10px] font-bold transition-all active:scale-95 disabled:opacity-20 ${
      primary
        ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40 col-span-1"
        : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
    }`}
  >
    {label}
  </button>
);
export default VerifierJumpButton;