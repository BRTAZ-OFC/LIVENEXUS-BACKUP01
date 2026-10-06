import { useEffect, useMemo, useState } from 'react'
import { icons, Search, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { renderToStaticMarkup } from 'react-dom/server'
import { useTranslation } from 'react-i18next'

export type IconPick = {
  name: string
  src: string
}

type IconChoice = {
  name: string
  label: string
  Icon: LucideIcon
}

function iconLabel(name: string) {
  return name
    .replace(/-/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

const ICON_CHOICES: IconChoice[] = Object.entries(icons as Record<string, LucideIcon>)
  .map(([name, Icon]) => ({ name, label: iconLabel(name), Icon }))
  .sort((a, b) => a.label.localeCompare(b.label))

function iconToSvgDataUrl(Icon: LucideIcon) {
  const markup = renderToStaticMarkup(
    <Icon
      size={128}
      color="#ffffff"
      strokeWidth={2}
      absoluteStrokeWidth
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    />,
  )
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`
}

export function IconPickerModal({ onClose, onPick }: { onClose: () => void; onPick: (choice: IconPick) => void }) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')

  // ESC handler
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { e.preventDefault(); onClose() }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onClose])

  const filteredIcons = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return ICON_CHOICES
    return ICON_CHOICES.filter((choice) => (
      choice.name.toLowerCase().includes(normalized)
      || choice.label.toLowerCase().includes(normalized)
    ))
  }, [query])

  function pickIcon(choice: IconChoice) {
    onPick({ name: choice.label, src: iconToSvgDataUrl(choice.Icon) })
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}>
      <div
        className="relative flex flex-col overflow-hidden rounded-xl border"
        style={{
          width: 620,
          maxWidth: '92vw',
          maxHeight: '82vh',
          backgroundColor: 'var(--panel)',
          borderColor: 'var(--border)',
          color: 'var(--text)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-3.5" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-sm font-semibold tracking-wide uppercase" style={{ color: 'var(--text)' }}>
            {t('iconPicker.title', { defaultValue: 'Icons' })}
          </h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
            style={{ color: 'var(--text2)' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="border-b p-3" style={{ borderColor: 'var(--border)' }}>
          <div className="relative flex items-center">
            <Search size={15} className="absolute left-3" style={{ color: 'var(--text3)' }} />
            <input
              type="text"
              autoFocus
              placeholder={t('iconPicker.searchPlaceholder', { defaultValue: 'Search icons...' })}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg border py-2 pl-9 pr-3 text-xs outline-none transition-colors"
              style={{
                backgroundColor: 'var(--input)',
                borderColor: 'var(--input-border)',
                color: 'var(--text)',
              }}
            />
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-6 md:grid-cols-8">
            {filteredIcons.map((choice) => {
              const IconComp = choice.Icon
              return (
                <button
                  key={choice.name}
                  onClick={() => pickIcon(choice)}
                  title={choice.label}
                  className="flex flex-col items-center justify-center gap-1.5 rounded-lg border p-2.5 text-center transition-all hover:scale-105 active:scale-95"
                  style={{
                    backgroundColor: 'var(--bg2)',
                    borderColor: 'var(--border2)',
                    color: 'var(--text)',
                  }}
                >
                  <IconComp size={22} strokeWidth={2} />
                  <span className="w-full truncate text-[10px]" style={{ color: 'var(--text2)' }}>
                    {choice.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
