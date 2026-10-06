import React from 'react';

export default function LabPhotoshop2Section() {
  return (
    <div className="w-full h-[calc(100vh-80px)] min-h-[700px] relative overflow-hidden rounded-xl border border-zinc-800 bg-[#141414] shadow-2xl flex flex-col">
      <iframe
        src="/lab-nemo/index.html"
        className="w-full h-full border-0 rounded-xl"
        title="Nemo Motion Editor"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      />
    </div>
  );
}
