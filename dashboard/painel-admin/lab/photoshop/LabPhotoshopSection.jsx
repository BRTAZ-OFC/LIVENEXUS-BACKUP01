import React from 'react';
import MotionApp from './App';
import './index.css';
import './i18n';

export default function LabPhotoshopSection() {
  return (
    <div className="w-full h-[calc(100vh-80px)] min-h-[700px] relative overflow-hidden rounded-xl border border-zinc-800 bg-[#1e1e1e] text-foreground font-sans">
      <MotionApp />
    </div>
  );
}
