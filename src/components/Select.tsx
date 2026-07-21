"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

export type Option = string | { value: string; label?: string };

function norm(o: Option): { value: string; label: string } {
  return typeof o === "string" ? { value: o, label: o } : { value: o.value, label: o.label ?? o.value };
}

/**
 * A modern, accessible-ish dropdown that replaces the native <select>.
 * - Controlled (`value` + `onChange`) or uncontrolled (`defaultValue`).
 * - Pass `name` to also emit a hidden input so it works inside native forms.
 * - Keyboard: Enter/Space/↓ open, ↑/↓ move, Enter pick, Esc close.
 */
export function Select({
  options,
  value,
  defaultValue,
  onChange,
  name,
  placeholder = "Select…",
  className = "",
  triggerClassName = "",
  size = "md",
  ariaLabel,
  disabled,
}: {
  options: Option[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  name?: string;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  size?: "sm" | "md";
  ariaLabel?: string;
  disabled?: boolean;
}) {
  const opts = useMemo(() => options.map(norm), [options]);
  const isControlled = value !== undefined;
  const [inner, setInner] = useState(defaultValue ?? "");
  const current = isControlled ? value : inner;

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const listId = useId();

  const selected = opts.find((o) => o.value === current);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function commit(v: string) {
    if (!isControlled) setInner(v);
    onChange?.(v);
    setOpen(false);
  }

  function openMenu() {
    if (disabled) return;
    setActive(Math.max(0, opts.findIndex((o) => o.value === current)));
    setOpen(true);
  }

  function onKey(e: React.KeyboardEvent) {
    if (disabled) return;
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    if (e.key === "Escape") setOpen(false);
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(opts.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (opts[active]) commit(opts[active].value);
    }
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      {name && <input type="hidden" name={name} value={current} />}

      <button
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKey}
        className={
          triggerClassName ||
          `flex w-full items-center justify-between gap-2 rounded-lg border bg-white text-left outline-none transition-colors disabled:opacity-60 ${
            size === "sm" ? "px-2 py-1 text-[12px]" : "px-3 py-2"
          } ${
            open ? "border-brand ring-2 ring-brand/15" : "border-line hover:border-slate-300"
          }`
        }
      >
        <span className={selected ? "" : "text-muted"}>
          {selected ? selected.label : placeholder}
        </span>
        <motion.svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          className="shrink-0 opacity-60"
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: reduce ? 0 : 0.18 }}
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </motion.svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            id={listId}
            role="listbox"
            initial={{ opacity: 0, y: reduce ? 0 : -4, scale: reduce ? 1 : 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: reduce ? 0 : -4, scale: reduce ? 1 : 0.98 }}
            transition={{ duration: reduce ? 0 : 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="absolute z-30 mt-1 max-h-64 w-full min-w-max origin-top overflow-auto rounded-xl border border-line bg-white p-1 shadow-lg shadow-slate-900/5"
          >
            {opts.map((o, i) => {
              const isSel = o.value === current;
              const isActive = i === active;
              return (
                <li key={o.value} role="option" aria-selected={isSel}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => commit(o.value)}
                    className={`flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-1.5 text-left text-[13px] transition-colors ${
                      isActive ? "bg-slate-100" : ""
                    } ${isSel ? "font-semibold text-brand" : "text-ink"}`}
                  >
                    <span className="truncate">{o.label}</span>
                    {isSel && (
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0">
                        <path d="M3 8.5l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
