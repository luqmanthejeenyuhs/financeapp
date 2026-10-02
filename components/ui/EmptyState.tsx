import Link from "next/link";

export default function EmptyState({
  title,
  body,
  actionHref,
  actionLabel,
}: {
  title: string;
  body: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="rounded-sm border rule bg-panel p-10 text-center">
      <h3 className="font-display text-lg font-medium">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted">{body}</p>
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="mt-5 inline-block rounded-sm bg-brass px-4 py-2 text-sm font-medium text-ink hover:bg-brass-bright"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
