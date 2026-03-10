"use client";

import { useId } from "react";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

const baseControlClass =
  "peer w-full rounded-xl border border-slate-300 bg-white text-sm text-slate-800 outline-none transition focus:border-[var(--action-start)] focus:ring-2 focus:ring-emerald-100";

const floatingLabelClass =
  "pointer-events-none absolute left-3 top-0 z-[1] -translate-y-1/2 bg-white px-1 text-[11px] font-black uppercase tracking-[0.12em] text-[var(--action-start)] transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:font-semibold peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-placeholder-shown:text-slate-500 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-[11px] peer-focus:font-black peer-focus:uppercase peer-focus:tracking-[0.12em] peer-focus:text-[var(--action-start)]";

function FieldMeta({ hint, error }) {
  return (
    <div className="mt-1.5 min-h-[18px]">
      {error ? (
        <p className="text-xs font-semibold text-rose-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

export function FloatingInput({
  id,
  label,
  className = "",
  inputClassName = "",
  hint = "",
  error = "",
  ...props
}) {
  const generatedId = useId();
  const inputId = id || `floating-input-${generatedId}`;

  return (
    <div className={cx("flex min-w-0 flex-col", className)}>
      <div className="relative">
        <input
          id={inputId}
          placeholder=" "
          className={cx(baseControlClass, "min-h-[52px] px-3 pt-5 pb-2", inputClassName)}
          {...props}
        />
        <label htmlFor={inputId} className={floatingLabelClass}>
          {label}
        </label>
      </div>
      <FieldMeta hint={hint} error={error} />
    </div>
  );
}

export function FloatingTextarea({
  id,
  label,
  rows = 4,
  className = "",
  textareaClassName = "",
  hint = "",
  error = "",
  ...props
}) {
  const generatedId = useId();
  const textareaId = id || `floating-textarea-${generatedId}`;

  return (
    <div className={cx("flex min-w-0 flex-col", className)}>
      <div className="relative">
        <textarea
          id={textareaId}
          rows={rows}
          placeholder=" "
          className={cx(baseControlClass, "resize-y px-3 pt-6 pb-2", textareaClassName)}
          {...props}
        />
        <label htmlFor={textareaId} className={floatingLabelClass}>
          {label}
        </label>
      </div>
      <FieldMeta hint={hint} error={error} />
    </div>
  );
}

export function FloatingSelect({
  id,
  label,
  className = "",
  selectClassName = "",
  hint = "",
  error = "",
  children,
  ...props
}) {
  const generatedId = useId();
  const selectId = id || `floating-select-${generatedId}`;

  return (
    <div className={cx("flex min-w-0 flex-col", className)}>
      <div className="relative">
        <select
          id={selectId}
          className={cx(baseControlClass, "min-h-[52px] px-3 pt-5 pb-2", selectClassName)}
          {...props}
        >
          {children}
        </select>
        <label
          htmlFor={selectId}
          className="pointer-events-none absolute left-3 top-0 z-[1] -translate-y-1/2 bg-white px-1 text-[11px] font-black uppercase tracking-[0.12em] text-[var(--action-start)]"
        >
          {label}
        </label>
      </div>
      <FieldMeta hint={hint} error={error} />
    </div>
  );
}
