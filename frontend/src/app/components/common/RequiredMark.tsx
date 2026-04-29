/** Visual indicator for required fields (use with validation that enforces the field). */
export function RequiredMark() {
  return (
    <span className="ml-0.5 font-semibold text-destructive" aria-hidden="true">
      *
    </span>
  );
}
