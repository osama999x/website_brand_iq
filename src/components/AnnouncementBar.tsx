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
  return (
    <div className="bg-neutral-900 text-white text-xs tracking-widest text-center py-2.5 px-4">
      <p>{safe.join("  |  ")}</p>
    </div>
  );
}
