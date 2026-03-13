export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
      <div className="flex flex-col items-center gap-4">
        {/* Native-style tiny spinner */}
        <div className="w-6 h-6 border-[3px] border-[var(--color-border)] border-t-[var(--color-primary)] rounded-full animate-spin"></div>
      </div>
    </div>
  );
}
