const Tooltip: React.FC<{ text: string; children: React.ReactNode }> = ({
  text,
  children,
}) => (
  <div className="group relative flex flex-1">
    {/* flex-1 ensures the wrapper fills the same space the button would */}
    {children}

    {/* Tooltip Positioning */}
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 flex flex-col items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
      <span className="bg-slate-950 text-white text-[12px] px-3 py-1.5 rounded-md border border-slate-700 whitespace-nowrap shadow-2xl font-medium tracking-wide">
        {text}
      </span>
      {/* Slightly larger Arrow */}
      <div className="w-2.5 h-2.5 -mt-1.5 rotate-45 bg-slate-950 border-r border-b border-slate-700"></div>
    </div>
  </div>
);

export default Tooltip;
