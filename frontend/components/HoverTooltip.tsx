import React, { useState } from 'react';

interface HoverTooltipProps {
  title: string;
  description: string;
  clinicalUtility?: string;
  badge?: string;
  badgeColor?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactNode;
}

export const HoverTooltip: React.FC<HoverTooltipProps> = ({
  title,
  description,
  clinicalUtility,
  badge,
  badgeColor = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  position = 'bottom',
  children,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2.5';
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-2.5';
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-2.5';
      case 'bottom':
      default:
        return 'top-full left-1/2 -translate-x-1/2 mt-2.5';
    }
  };

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}

      {isVisible && (
        <div
          role="tooltip"
          className={`absolute z-50 w-72 p-3.5 rounded-xl bg-slate-950/95 backdrop-blur-xl border border-cyan-500/40 shadow-[0_0_25px_rgba(6,182,212,0.25)] text-slate-100 transition-all duration-200 pointer-events-none animate-fadeIn ${getPositionClasses()}`}
        >
          {/* Subtle neon indicator pip */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2 mb-2">
            <span className="font-bold text-xs text-white tracking-wide flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              {title}
            </span>
            {badge && (
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${badgeColor}`}>
                {badge}
              </span>
            )}
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed font-sans mb-1.5">
            {description}
          </p>

          {clinicalUtility && (
            <div className="text-[10px] text-cyan-300/90 font-mono bg-cyan-950/50 p-1.5 rounded border border-cyan-500/20">
              <strong className="text-cyan-200">Utilidad Clínica: </strong>
              {clinicalUtility}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
