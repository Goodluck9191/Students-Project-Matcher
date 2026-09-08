import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export function Input({
  label,
  hint,
  error,
  leftIcon,
  rightElement,
  id,
  className,
  ...rest
}: InputProps) {
  const fallbackId = React.useId();
  const inputId = id ?? rest.name ?? fallbackId;
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {leftIcon}
          </span>
        )}
        <input
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
          }
          className={cn(
            "h-10 w-full rounded-xl border bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400",
            "border-slate-300 shadow-[0_1px_2px_rgb(15_23_42/0.04)] transition-colors",
            "focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100",
            leftIcon && "pl-9",
            rightElement && "pr-10",
            error && "border-rose-400 focus:border-rose-500 focus:ring-rose-100",
            className
          )}
          {...rest}
        />
        {rightElement && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2">
            {rightElement}
          </span>
        )}
      </div>
      {error ? (
        <p id={`${inputId}-error`} role="alert" className="mt-1.5 text-[13px] text-rose-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="mt-1.5 text-[13px] text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function Textarea({ label, hint, error, id, className, ...rest }: TextareaProps) {
  const fallbackId = React.useId();
  const inputId = id ?? rest.name ?? fallbackId;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        aria-invalid={Boolean(error)}
        className={cn(
          "min-h-[96px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400",
          "shadow-[0_1px_2px_rgb(15_23_42/0.04)] focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100",
          error && "border-rose-400 focus:border-rose-500 focus:ring-rose-100",
          className
        )}
        {...rest}
      />
      {error ? (
        <p role="alert" className="mt-1.5 text-[13px] text-rose-600">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-[13px] text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  options: readonly string[] | { value: string; label: string }[];
  placeholder?: string;
}

export function Select({
  label,
  hint,
  error,
  options,
  placeholder = "Select…",
  id,
  className,
  ...rest
}: SelectProps) {
  const fallbackId = React.useId();
  const inputId = id ?? rest.name ?? fallbackId;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <select
        id={inputId}
        className={cn(
          "h-10 w-full appearance-none rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900",
          "focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100",
          error && "border-rose-400 focus:border-rose-500",
          className
        )}
        {...rest}
      >
        <option value="">{placeholder}</option>
        {options.map((o) =>
          typeof o === "string" ? (
            <option key={o} value={o}>
              {o}
            </option>
          ) : (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          )
        )}
      </select>
      {error ? (
        <p role="alert" className="mt-1.5 text-[13px] text-rose-600">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-[13px] text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}
