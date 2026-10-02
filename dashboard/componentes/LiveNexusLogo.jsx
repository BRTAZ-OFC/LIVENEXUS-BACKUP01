import React from 'react';
import { Radio } from 'lucide-react';

export default function LiveNexusLogo({ className = 'h-8 w-8', textClassName = 'text-sm font-bold text-white' }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={`flex items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20 ${className}`}>
        <Radio className="h-5 w-5 animate-pulse text-white" />
      </div>
      <span className={textClassName}>LiveNexus</span>
    </div>
  );
}
