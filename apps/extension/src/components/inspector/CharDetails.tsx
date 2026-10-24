import { useEffect, useState } from 'react';
import { Check, ChevronDown, ChevronUp, Copy, ExternalLink, X } from 'lucide-react';
import { charFlags, type CharDetail } from '@punyguard/core';
import { cn } from '@/lib/utils';
import { FlagPill } from './CharTable';

function fieldsFor(c: CharDetail): Array<[string, string]> {
  const fields: Array<[string, string]> = [
    ['Formal name', c.name],
    ['Code point', c.uPlus],
    ['Hex', `0x${c.hexPadded}`],
    ['Decimal', String(c.decimal)],
    ['Unicode block', c.block],
    ['Script group', c.script],
    ['General category', `${c.category}: ${c.categoryLabel}`],
    ['Combining class', String(c.combiningClass)],
    ['Bidi', c.bidiClass],
    ['HTML escape', c.htmlEscape],
    ['URL escape', c.urlEscape],
    ['JS escape', c.jsEscape],
    ['UTF-8', c.utf8Hex],
    ['UTF-16', c.utf16Hex],
  ];
  if (c.isHomoglyph && c.homoglyphLatin) fields.push(['Looks like (Latin)', c.homoglyphLatin]);
  if (c.isInvisible) fields.push(['Invisible / control', 'yes']);
  return fields;
}

/** Glyph, flags, and every property of one character, each copyable. */
export function CharDetails({ char }: { char: CharDetail }) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-border bg-background font-glyph text-4xl">
          {char.display}
        </div>
        <div className="min-w-0">
          <p className="font-mono text-base font-semibold">{char.uPlus}</p>
          <p className="text-xs text-muted-foreground">{char.name}</p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {charFlags(char).map((f) => (
              <FlagPill key={f} flag={f} />
            ))}
          </div>
        </div>
      </div>
      <dl className="divide-y divide-border text-xs">
        {fieldsFor(char).map(([k, v]) => (
          <Field key={k} label={k} value={v} />
        ))}
      </dl>
      <a
        className="mt-4 inline-flex cursor-pointer items-center gap-1 text-xs text-primary hover:underline"
        href={char.unicodeOrgUrl}
        target="_blank"
        rel="noreferrer"
      >
        Unicode character page <ExternalLink className="size-3" />
      </a>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="group grid grid-cols-[120px_1fr_auto] items-center gap-2 py-1.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="break-all font-mono">{value}</dd>
      <button
        type="button"
        aria-label={`Copy ${label}`}
        onClick={async () => {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1000);
        }}
        className="inline-flex size-6 cursor-pointer items-center justify-center rounded text-muted-foreground opacity-0 hover:bg-muted hover:text-foreground focus:opacity-100 group-hover:opacity-100"
      >
        {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
      </button>
    </div>
  );
}

/** Side drawer for the full-page analyzer; the page reserves room for it on wide screens. */
export function CharDrawer({
  char,
  position,
  total,
  onPrev,
  onNext,
  onClose,
}: {
  char: CharDetail | null;
  position: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  const open = char !== null;

  useEffect(() => {
    document.documentElement.classList.toggle('drawer-open', open);
    return () => document.documentElement.classList.remove('drawer-open');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).matches('input, textarea')) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (e.key === 'ArrowDown') onNext();
        else onPrev();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose, onNext, onPrev]);

  const navBtn =
    'inline-flex size-8 cursor-pointer items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        role="dialog"
        aria-modal="false"
        aria-label="Character details"
        inert={!open}
        className={cn(
          'fixed inset-y-0 right-0 z-40 flex w-full max-w-[420px] flex-col border-l border-border bg-card text-card-foreground shadow-2xl transition-transform duration-200 ease-out',
          open ? 'translate-x-0' : 'pointer-events-none translate-x-full',
        )}
      >
        {char && (
          <>
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold">
                Character {position >= 0 ? `${position + 1} of ${total}` : ''}
              </h3>
              <div className="ml-auto flex items-center gap-1.5">
                <button
                  type="button"
                  className={navBtn}
                  onClick={onPrev}
                  disabled={position <= 0}
                  aria-label="Previous character"
                >
                  <ChevronUp className="size-4" />
                </button>
                <button
                  type="button"
                  className={navBtn}
                  onClick={onNext}
                  disabled={position < 0 || position >= total - 1}
                  aria-label="Next character"
                >
                  <ChevronDown className="size-4" />
                </button>
                <button
                  type="button"
                  className={navBtn}
                  onClick={onClose}
                  aria-label="Close details"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <CharDetails char={char} />
            </div>
            <p className="border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
              Use the arrow keys to move between characters, Esc to close.
            </p>
          </>
        )}
      </aside>
    </>
  );
}
