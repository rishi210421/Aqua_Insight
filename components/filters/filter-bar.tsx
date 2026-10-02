"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input, Label, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { INDICATOR_LABELS } from "@/lib/config";

export function FilterBar({
  countries,
  cities,
  streams,
}: {
  countries: string[];
  cities: string[];
  streams: { id: string; name: string; city: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  function update(key: string, value: string) {
    const next = new URLSearchParams(sp.toString());
    if (!value) next.delete(key);
    else next.set(key, value);
    if (key === "country") {
      next.delete("city");
      next.delete("stream");
      next.delete("site");
    }
    if (key === "city") {
      next.delete("stream");
      next.delete("site");
    }
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <form className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-3 lg:grid-cols-7">
      <div>
        <Label htmlFor="country">Country</Label>
        <Select id="country" value={sp.get("country") ?? ""} onChange={(e) => update("country", e.target.value)}>
          <option value="">All</option>
          {countries.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="city">City</Label>
        <Select id="city" value={sp.get("city") ?? ""} onChange={(e) => update("city", e.target.value)}>
          <option value="">All</option>
          {cities.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="stream">Stream</Label>
        <Select id="stream" value={sp.get("stream") ?? ""} onChange={(e) => update("stream", e.target.value)}>
          <option value="">All</option>
          {streams
            .filter((s) => !sp.get("city") || s.city === sp.get("city"))
            .map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="range">Date range</Label>
        <Select id="range" value={sp.get("range") ?? "30d"} onChange={(e) => update("range", e.target.value)}>
          <option value="7d">7 days</option>
          <option value="30d">30 days</option>
          <option value="90d">90 days</option>
          <option value="1y">1 year</option>
          <option value="custom">Custom</option>
        </Select>
      </div>
      <div>
        <Label htmlFor="indicator">Indicator</Label>
        <Select id="indicator" value={sp.get("indicator") ?? "composite"} onChange={(e) => update("indicator", e.target.value)}>
          {Object.entries(INDICATOR_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
      </div>
      {(sp.get("range") === "custom") && (
        <>
          <div>
            <Label htmlFor="from">From</Label>
            <Input id="from" type="date" defaultValue={sp.get("from") ?? ""} onBlur={(e) => update("from", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="to">To</Label>
            <Input id="to" type="date" defaultValue={sp.get("to") ?? ""} onBlur={(e) => update("to", e.target.value)} />
          </div>
        </>
      )}
      <div className="flex items-end">
        <Button type="button" variant="outline" onClick={() => router.push(pathname)}>
          Reset
        </Button>
      </div>
    </form>
  );
}
