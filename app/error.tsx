"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        The application could not complete this request. No internal details are shown.
      </p>
      <button className="mt-6 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground" onClick={reset}>
        Try again
      </button>
      {error.digest ? <p className="mt-3 text-xs text-muted-foreground">Reference {error.digest}</p> : null}
    </div>
  );
}
