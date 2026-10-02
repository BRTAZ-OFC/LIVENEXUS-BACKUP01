// StarRating — exibe ou captura uma nota de 1 a 5 estrelas.
// mode="display" => somente leitura; mode="input" => clicável com hover.
import { useState } from 'react';
import { Star } from 'lucide-react';

export default function StarRating({ value = 0, onChange, size = 16, mode = 'display' }) {
  const [hover, setHover] = useState(0);
  const active = mode === 'input' ? (hover || value) : value;
  return (
    <div className="flex items-center gap-0.5" onMouseLeave={() => mode === 'input' && setHover(0)}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          disabled={mode !== 'input'}
          onClick={() => mode === 'input' && onChange?.(n)}
          onMouseEnter={() => mode === 'input' && setHover(n)}
          className={mode === 'input' ? 'cursor-pointer' : 'cursor-default'}
          aria-label={`${n} estrela${n > 1 ? 's' : ''}`}
        >
          <Star
            size={size}
            className={n <= active ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}
          />
        </button>
      ))}
    </div>
  );
}