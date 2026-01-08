const Tooltip: React.FC<{
  text: string;
  children: React.ReactNode;
  className?: string;
}> = ({ text, children, className = "flex-1" }) => (
  /* - flex-1: stretches to fill the row (fixes the tiny buttons)
     - relative: keeps the bubble attached to this container
     - cursor-help: gives the info cursor
  */
  <div className={`group relative ${className} cursor-help`}>
    {children}

    {/* Tooltip Positioning */}
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 flex flex-col items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
      <span className="bg-slate-950 text-white text-[12px] px-3 py-1.5 rounded-md border border-slate-700 whitespace-nowrap shadow-2xl font-medium tracking-wide">
        {text}
      </span>
      <div className="w-2.5 h-2.5 -mt-1.5 rotate-45 bg-slate-950 border-r border-b border-slate-700"></div>
    </div>
  </div>
);
export default Tooltip;