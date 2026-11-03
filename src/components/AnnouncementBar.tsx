export default function AnnouncementBar({
  enabled = true,
  messages,
}: {
  enabled?: boolean;
  messages?: string[];
}) {
  if (!enabled) return null;
  const safe = Array.isArray(messages) ? messages.filter((m) => typeof m === "string" && m.trim()) : [];
  if (safe.length === 0) return null;

  const line = safe.join("    ·    ");
  const duration = Math.min(48, Math.max(18, line.length * 0.22));

  return (
    <div className="bg-neutral-900 text-white text-[11px] font-medium tracking-[0.22em] uppercase">
      <p className="sr-only">{safe.join(". ")}</p>
      <p className="hidden motion-reduce:block text-center py-2.5 px-4">{line}</p>
      <div className="overflow-hidden py-2.5 motion-reduce:hidden" aria-hidden="true">
        <div className="marquee-track flex w-max" style={{ animationDuration: `${duration}s` }}>
          {[0, 1].map((copy) => (
            <span key={copy} className="flex shrink-0">
              {Array.from({ length: 6 }).map((_, i) => (
                <span key={i} className="px-8 whitespace-nowrap">
                  {line}
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
