import { useState } from 'react';
import { Check, Copy, ShieldAlert, ShieldCheck } from 'lucide-react';
import type { DomainThreat, IdnConversion } from '@punyguard/core';
import { cn } from '@/lib/utils';

const TONE = {
  danger: {
    card: 'border-red-500/60 from-red-500/10',
    icon: 'text-red-600 dark:text-red-400',
    pill: 'bg-red-500/15 text-red-700 dark:text-red-300',
  },
  watch: {
    card: 'border-amber-500/60 from-amber-500/10',
    icon: 'text-amber-600 dark:text-amber-400',
    pill: 'bg-amber-500/15 text-amber-800 dark:text-amber-300',
  },
  safe: {
    card: 'border-emerald-500/50 from-emerald-500/10',
    icon: 'text-emerald-600 dark:text-emerald-400',
    pill: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  },
};

/** The Unicode and ASCII (Punycode) forms side by side, with the risky parts highlighted. */
export function IdnCard({
  idn,
  threat,
  compact = false,
}: {
  idn: IdnConversion;
  threat: DomainThreat | null;
  compact?: boolean;
}) {
  const level = idn.hasIdn ? (threat?.level === 'danger' ? 'danger' : 'watch') : 'safe';
  const tone = TONE[level];
  const Icon = level === 'safe' ? ShieldCheck : ShieldAlert;
  const changed = idn.labels.filter((l) => l.changed);

  return (
    <section
      aria-labelledby="idn-title"
      className={cn(
        'rounded-2xl border-2 bg-gradient-to-br to-transparent',
        tone.card,
        compact ? 'p-3' : 'p-4 sm:p-5',
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Icon className={cn('size-5', tone.icon)} />
        <h3 id="idn-title" className="text-sm font-bold">
          IDN · Punycode <span className="font-normal text-muted-foreground">(UTS #46)</span>
        </h3>
        <span
          className={cn('ml-auto rounded-full px-2.5 py-0.5 text-[11px] font-semibold', tone.pill)}
        >
          {idn.hasIdn ? 'Internationalized domain' : 'Plain ASCII'}
        </span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {idn.hasIdn
          ? 'Browsers may display the Unicode form, but DNS resolves the ASCII form. Highlighted characters are not plain ASCII: compare both before you trust this domain.'
          : 'No Unicode characters: what you see is exactly what DNS resolves.'}
      </p>
      <div className={cn('mt-3 grid gap-3', !compact && 'md:grid-cols-2')}>
        <FormPanel label="Displayed as (Unicode)" value={idn.unicode} compact={compact}>
          <span className={cn('font-glyph', compact ? 'text-xl' : 'text-2xl sm:text-3xl')}>
            <MarkUnicode text={idn.unicode || '-'} />
          </span>
        </FormPanel>
        <FormPanel label="Resolves as (ASCII / ACE)" value={idn.ascii} compact={compact}>
          <span className={cn('font-mono', compact ? 'text-lg' : 'text-xl sm:text-2xl')}>
            <MarkAscii text={idn.ascii || '-'} />
          </span>
        </FormPanel>
      </div>
      {changed.length > 0 && (
        <table className="mt-3 w-full text-left text-xs">
          <caption className="sr-only">Converted labels</caption>
          <thead className="text-[10px] uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="py-1 pr-3 font-semibold">Label</th>
              <th className="py-1 font-semibold">Punycode</th>
            </tr>
          </thead>
          <tbody>
            {changed.map((l) => (
              <tr key={l.input} className="border-t border-border">
                <td className="py-1.5 pr-3 font-glyph text-sm">{l.input}</td>
                <td className="py-1.5 font-mono">{l.output}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {idn.errors.length > 0 && (
        <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-300">
          {idn.errors[0]}
        </p>
      )}
    </section>
  );
}

function FormPanel({
  label,
  value,
  compact,
  children,
}: {
  label: string;
  value: string;
  compact: boolean;
  children: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div
      className={cn('rounded-xl border border-border bg-background/70', compact ? 'p-2.5' : 'p-3')}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <button
          type="button"
          aria-label={`Copy ${label}`}
          onClick={async () => {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1000);
          }}
          className="inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
        </button>
      </div>
      <div className="break-all leading-snug">{children}</div>
    </div>
  );
}

function MarkUnicode({ text }: { text: string }) {
  return (
    <>
      {[...text].map((ch, i) => {
        const cp = ch.codePointAt(0)!;
        return cp > 0x7f ? (
          <mark
            key={i}
            title={`U+${cp.toString(16).toUpperCase().padStart(4, '0')}`}
            className="rounded bg-amber-400/25 px-0.5 text-amber-900 underline decoration-amber-500 decoration-2 underline-offset-4 dark:text-amber-200"
          >
            {ch}
          </mark>
        ) : (
          <span key={i}>{ch}</span>
        );
      })}
    </>
  );
}

function MarkAscii({ text }: { text: string }) {
  const labels = text.split('.');
  return (
    <>
      {labels.map((label, i) => (
        <span key={i}>
          {label.startsWith('xn--') ? (
            <mark className="rounded bg-sky-400/20 px-0.5 text-sky-900 dark:text-sky-200">
              {label}
            </mark>
          ) : (
            label
          )}
          {i < labels.length - 1 && <span className="text-muted-foreground">.</span>}
        </span>
      ))}
    </>
  );
}
