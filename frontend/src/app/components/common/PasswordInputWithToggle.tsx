import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const INPUT_ADMIN =
  "w-full px-4 py-3 pr-9 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none transition-colors disabled:opacity-50";

const INPUT_ADMIN_NO_TRANSITION =
  "w-full px-4 py-3 pr-9 rounded-lg bg-input-background border border-transparent focus:border-primary focus:outline-none disabled:opacity-50";

const INPUT_AUTH =
  "w-full rounded-lg border border-border bg-input-background px-4 py-3 pr-10 text-foreground transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none disabled:opacity-50";

export type PasswordInputWithToggleProps = {
  label: React.ReactNode;
  /** Applied to the <label> element */
  labelClassName?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  /** `admin` — modals / admin forms; `adminPlain` — same padding, no transition on input; `auth` — login card */
  variant?: "admin" | "adminPlain" | "auth";
  autoComplete?: string;
};

export function PasswordInputWithToggle({
  label,
  labelClassName = "block mb-2 text-foreground",
  value,
  onChange,
  placeholder,
  disabled,
  id: idProp,
  variant = "admin",
  autoComplete,
}: PasswordInputWithToggleProps) {
  const uid = useId();
  const id = idProp ?? uid;
  const [visible, setVisible] = useState(false);
  const inputClass =
    variant === "auth" ? INPUT_AUTH : variant === "adminPlain" ? INPUT_ADMIN_NO_TRANSITION : INPUT_ADMIN;
  const defaultAuto =
    variant === "auth" ? "current-password" : "new-password";

  return (
    <div>
      <label htmlFor={id} className={labelClassName}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          className={inputClass}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete ?? defaultAuto}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/45 transition-colors hover:text-muted-foreground/80 disabled:pointer-events-none disabled:opacity-50"
          disabled={disabled}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? (
            <EyeOff className="h-3 w-3 shrink-0" strokeWidth={1.75} />
          ) : (
            <Eye className="h-3 w-3 shrink-0" strokeWidth={1.75} />
          )}
        </button>
      </div>
    </div>
  );
}
