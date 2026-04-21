"use client";

import { useCallback, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "./utils";

const CLOSE_DELAY_MS = 200;

export type HoverSelectOption = { value: string; label: string };

type HoverSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: HoverSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  id?: string;
};

export function HoverSelect({
  value,
  onChange,
  options,
  placeholder = "Select…",
  disabled,
  className,
  triggerClassName,
  id,
}: HoverSelectProps) {
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    cancelClose();
    timerRef.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
  }, [cancelClose]);

  const openMenu = useCallback(() => {
    cancelClose();
    if (!disabled) setOpen(true);
  }, [cancelClose, disabled]);

  const selected = options.find((o) => o.value === value);

  return (
    <div
      className={cn("relative w-full", className)}
      onPointerEnter={openMenu}
      onPointerLeave={scheduleClose}
    >
      <button
        type="button"
        id={id}
        disabled={disabled}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-lg border border-transparent bg-input-background px-4 py-3 text-left transition-colors focus:border-primary focus:outline-none disabled:opacity-50",
          triggerClassName,
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={cn("min-w-0 flex-1 truncate", !selected?.label && "text-muted-foreground")}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown className="size-4 shrink-0 opacity-50" aria-hidden />
      </button>
      {open && (
        <ul
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-auto rounded-lg border border-border bg-popover py-1 text-popover-foreground shadow-md"
          role="listbox"
          onPointerEnter={cancelClose}
          onPointerLeave={scheduleClose}
        >
          {options.map((opt) => (
            <li key={opt.value === "" ? "__empty" : opt.value} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={value === opt.value}
                className={cn(
                  "w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground",
                  value === opt.value && "bg-accent/50",
                )}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                  cancelClose();
                }}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
