import { cn } from '@/lib/utils';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  id?: string;
  'aria-label'?: string;
}

export function Switch({ checked, onCheckedChange, id, ...rest }: SwitchProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        checked ? 'bg-primary' : 'bg-muted',
      )}
      {...rest}
    >
      <span
        className={cn(
          'pointer-events-none block size-5 rounded-full bg-white shadow transition-transform duration-200',
          checked ? 'translate-x-5' : 'translate-x-0',
        )}
      />
    </button>
  );
}
