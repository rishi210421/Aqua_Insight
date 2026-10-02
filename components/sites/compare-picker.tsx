"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ComparePicker({
  sites,
  selected,
}: {
  sites: { id: string; name: string; city: string }[];
  selected: string[];
}) {
  const router = useRouter();
  const sp = useSearchParams();

  function toggle(id: string) {
    const set = new Set(selected);
    if (set.has(id)) set.delete(id);
    else if (set.size < 5) set.add(id);
    const next = new URLSearchParams(sp.toString());
    next.set("sites", [...set].join(","));
    router.push(`/compare?${next.toString()}`);
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">Selected {selected.length} / 5</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {sites.slice(0, 40).map((s) => (
          <Button
            key={s.id}
            type="button"
            size="sm"
            variant={selected.includes(s.id) ? "primary" : "outline"}
            onClick={() => toggle(s.id)}
          >
            {s.name}
          </Button>
        ))}
      </div>
    </div>
  );
}
