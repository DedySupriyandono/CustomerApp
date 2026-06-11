import { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";

/**
 * QuantityStepper
 * Props:
 *  - value, onChange, min=0, max=9999 — standard stepper behavior.
 *  - editable (default false): if true, the number itself is clickable to
 *    switch to an inline input for direct editing.
 *  - onValidate(qty): optional async (qty) => string|null. Returns error
 *    message string to reject the value, or null/undefined to accept.
 *    Called when user commits (Enter/blur) the inline-edit input.
 */
export default function QuantityStepper({
  value,
  onChange,
  min = 0,
  max = 9999,
  editable = false,
  onValidate,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  // Keep draft in sync if value changes from outside while not editing.
  useEffect(() => {
    if (!isEditing) setDraft(String(value));
  }, [value, isEditing]);

  // Autofocus when entering edit mode.
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const showError = (title, text) =>
    Swal.fire({
      icon: "warning",
      title,
      text,
      confirmButtonColor: "#B20605",
      confirmButtonText: "OK",
    });

  const commit = async () => {
    const n = parseInt(String(draft).trim(), 10);
    if (isNaN(n) || n < min) {
      setDraft(String(value));
      setIsEditing(false);
      await showError("Jumlah tidak valid", `Jumlah harus angka ≥ ${min}.`);
      return;
    }
    if (n > max) {
      setDraft(String(value));
      setIsEditing(false);
      await showError("Melebihi batas", `Jumlah melebihi batas maksimum (max: ${max}).`);
      return;
    }
    if (n === value) {
      setIsEditing(false);
      return;
    }
    if (onValidate) {
      setBusy(true);
      try {
        const err = await onValidate(n);
        if (err) {
          setDraft(String(value));
          setIsEditing(false);
          await showError("Tidak bisa disimpan", err);
          return;
        }
      } finally {
        setBusy(false);
      }
    }
    onChange(n);
    setIsEditing(false);
  };

  const cancel = () => {
    setDraft(String(value));
    setIsEditing(false);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-8 h-8 rounded-full border-2 border-primary text-primary flex items-center justify-center font-bold disabled:opacity-40"
        disabled={value <= min || busy}
      >
        −
      </button>

      {isEditing ? (
        <input
          ref={inputRef}
          type="number"
          inputMode="numeric"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            } else if (e.key === "Escape") {
              e.preventDefault();
              cancel();
            }
          }}
          disabled={busy}
          className="w-14 text-center font-semibold tabular-nums border-2 border-primary rounded-md py-0.5 outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
          aria-label="Edit jumlah"
        />
      ) : editable ? (
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="w-10 text-center font-semibold tabular-nums hover:bg-gray-100 rounded-md py-0.5 cursor-text"
          title="Klik untuk ubah jumlah"
        >
          {value}
        </button>
      ) : (
        <span className="w-10 text-center font-semibold tabular-nums">{value}</span>
      )}

      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-8 h-8 rounded-full border-2 border-primary text-primary flex items-center justify-center font-bold disabled:opacity-40"
        disabled={value >= max || busy}
      >
        +
      </button>
    </div>
  );
}
