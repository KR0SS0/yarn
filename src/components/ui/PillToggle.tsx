const PillToggle: React.FC<{
  checked: boolean;
  onChange: (val: boolean) => void;
}> = ({ checked, onChange }) => (
  <button
    onClick={() => onChange(!checked)}
    onMouseDown={(e) => e.preventDefault()}
    className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
      checked ? "bg-blue-500" : "bg-slate-600"
    }`}
  >
    <span
      className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${
        checked ? "translate-x-4" : "translate-x-0.5"
      }`}
    />
  </button>
);
export default PillToggle;