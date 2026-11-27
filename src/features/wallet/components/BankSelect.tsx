import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Landmark, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/utils/cn";
import { useBanks } from "../hooks/useBanks";
import type { Bank } from "../types/bank.types";

interface Props {
  /** Tên ngân hàng đang chọn (shortName). */
  value: string;
  onChange: (shortName: string) => void;
  disabled?: boolean;
  error?: boolean;
  /** id gắn vào nút để <label htmlFor> trỏ tới được. */
  id?: string;
}

function BankLogo({ bank }: { bank: Bank }) {
  const [failed, setFailed] = useState(false);
  if (!bank.logo || failed) {
    return (
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-surface-hover text-text-secondary">
        <Landmark className="size-4" />
      </span>
    );
  }
  return (
    <img
      src={bank.logo}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-8 w-14 shrink-0 rounded-md bg-white object-contain p-0.5"
    />
  );
}

/** Chọn ngân hàng: có logo, ô tìm kiếm, thay cho <select> mặc định. */
export function BankSelect({ value, onChange, disabled, error, id }: Props) {
  const { t } = useTranslation();
  const { data: banks = [], isLoading } = useBanks();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const list = useMemo(() => {
    const k = q.trim().toLowerCase();
    return banks
      .filter((b) => b.transferSupported !== false)
      .filter(
        (b) =>
          !k ||
          b.shortName.toLowerCase().includes(k) ||
          b.name.toLowerCase().includes(k) ||
          b.code.toLowerCase().includes(k),
      );
  }, [banks, q]);

  const selected = banks.find((b) => b.shortName === value);

  return (
    <div ref={rootRef} className="relative">
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-invalid={error || undefined}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-11 w-full cursor-pointer items-center gap-3 rounded-xl border bg-surface px-3 text-left text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60",
          error ? "border-danger" : "border-border hover:border-primary",
        )}
      >
        {selected ? (
          <>
            <BankLogo bank={selected} />
            <span className="min-w-0 flex-1 truncate font-semibold text-text">
              {selected.shortName}
            </span>
          </>
        ) : (
          <span className="flex-1 text-text-secondary">
            {value ||
              (isLoading
                ? t("wallet.bankSelect.loadingBanks")
                : t("wallet.bankSelect.choose"))}
          </span>
        )}
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-text-secondary transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-surface shadow-xl">
          <div className="relative border-b border-border p-2">
            <Search className="pointer-events-none absolute left-5 top-1/2 size-4 -translate-y-1/2 text-text-secondary" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("wallet.bankSelect.searchPlaceholder")}
              className="h-9 w-full rounded-lg bg-background pl-8 pr-3 text-base sm:text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <ul role="listbox" className="max-h-60 overflow-y-auto p-1">
            {list.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-text-secondary">
                {isLoading
                  ? t("wallet.bankSelect.loading")
                  : t("wallet.bankSelect.notFound")}
              </li>
            )}
            {list.map((b) => {
              const active = b.shortName === value;
              return (
                <li key={b.code} role="option" aria-selected={active}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(b.shortName);
                      setOpen(false);
                      setQ("");
                    }}
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-primary-light",
                      active && "bg-primary-light",
                    )}
                  >
                    <BankLogo bank={b} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-text">
                        {b.shortName}
                      </span>
                      <span className="block truncate text-xs text-text-secondary">
                        {b.name}
                      </span>
                    </span>
                    {active && (
                      <Check className="size-4 shrink-0 text-primary" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
