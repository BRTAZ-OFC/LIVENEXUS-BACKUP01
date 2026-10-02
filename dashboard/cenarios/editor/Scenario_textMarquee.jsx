import React from 'react';

export function TextMarquee({ text = '', isMainChat = false, forceMarquee = false, className = '', style = {} }) {
  if (isMainChat) {
    return <div className={className} style={style}>{text}</div>;
  }

  const str = String(text || '');
  if (!forceMarquee && str.length <= 35) {
    return (
      <div className={className} style={{ ...style, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {str}
      </div>
    );
  }

  return (
    <div className={`overflow-hidden whitespace-nowrap relative ${className}`} style={style}>
      <div className="inline-block animate-marquee" style={{ display: 'inline-block', paddingLeft: '100%', animation: 'marquee 12s linear infinite' }}>
        {str}
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translate(0, 0); }
          100% { transform: translate(-100%, 0); }
        }
      `}</style>
    </div>
  );
}
