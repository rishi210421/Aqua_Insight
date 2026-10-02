"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LngLatBounds, Map, Marker, NavigationControl, setWorkerUrl, type Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Link from "next/link";
import { Input, Label, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate, formatNumber } from "@/lib/utils";
import type { HealthStatus } from "@/types";

export interface MapSitePoint {
  id: string;
  name: string;
  city: string;
  streamName: string;
  latitude: number;
  longitude: number;
  status: HealthStatus;
  score: number | null;
  confidence: string;
  lastObservation: string | null;
  change: number | null;
  hotspot: boolean;
  biodiversity: number | null;
  waterQuality: number | null;
  habitat: number | null;
}

const STYLE = {
  version: 8 as const,
  sources: {
    osm: {
      type: "raster" as const,
      tiles: ["https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "&copy; OpenStreetMap &copy; CARTO",
    },
  },
  layers: [{ id: "osm", type: "raster" as const, source: "osm" }],
};

const COLORS: Record<HealthStatus, string> = {
  healthy: "#2f7d4a",
  watch: "#b5811a",
  attention: "#b4453a",
  insufficient: "#6b7280",
};

export function StreamMap({ sites }: { sites: MapSitePoint[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [selected, setSelected] = useState<MapSitePoint | null>(null);

  useEffect(() => {
    setWorkerUrl("/maplibre-gl-worker.mjs");
  }, []);
  const [q, setQ] = useState("");
  const [layer, setLayer] = useState("sites");
  const [status, setStatus] = useState("");

  const filtered = useMemo(() => {
    return sites.filter((s) => {
      if (status && s.status !== status) return false;
      if (layer === "hotspots" && !s.hotspot) return false;
      if (q && !`${s.name} ${s.city} ${s.streamName}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [sites, q, layer, status]);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = new Map({
      container: ref.current,
      style: STYLE,
      center: [8, 43],
      zoom: 4,
    });
    map.addControl(new NavigationControl(), "top-right");
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const markers: Marker[] = [];
    filtered.forEach((site) => {
      const el = document.createElement("button");
      el.type = "button";
      el.setAttribute("aria-label", site.name);
      el.style.width = layer === "biodiversity" || layer === "water" ? `${12 + (site.biodiversity ?? 50) / 12}px` : "14px";
      el.style.height = el.style.width;
      el.style.borderRadius = "999px";
      el.style.border = "2px solid white";
      el.style.cursor = "pointer";
      const color =
        layer === "water"
          ? valueColor(site.waterQuality)
          : layer === "habitat"
            ? valueColor(site.habitat)
            : layer === "biodiversity"
              ? valueColor(site.biodiversity)
              : COLORS[site.status];
      el.style.background = color;
      el.onclick = () => setSelected(site);
      const marker = new Marker({ element: el }).setLngLat([site.longitude, site.latitude]).addTo(map);
      markers.push(marker);
    });
    return () => {
      markers.forEach((m) => m.remove());
    };
  }, [filtered, layer]);

  function fit() {
    const map = mapRef.current;
    if (!map || !filtered.length) return;
    const b = new LngLatBounds();
    filtered.forEach((s) => b.extend([s.longitude, s.latitude]));
    map.fitBounds(b, { padding: 48, maxZoom: 10 });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="overflow-hidden rounded-2xl border border-border">
        <div className="flex flex-wrap gap-2 border-b border-border bg-card p-3">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search map" aria-label="Search map" className="max-w-xs" />
          <Select value={layer} onChange={(e) => setLayer(e.target.value)} aria-label="Layer">
            <option value="sites">Monitoring sites</option>
            <option value="observations">Citizen observations</option>
            <option value="health">Stream health</option>
            <option value="biodiversity">Biodiversity</option>
            <option value="water">Water quality</option>
            <option value="habitat">Habitat</option>
            <option value="hotspots">Hotspots</option>
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status filter">
            <option value="">All statuses</option>
            <option value="healthy">Healthy / Stable</option>
            <option value="watch">Watch</option>
            <option value="attention">Attention</option>
            <option value="insufficient">Insufficient data</option>
          </Select>
          <Button type="button" variant="outline" size="sm" onClick={fit}>
            Fit bounds
          </Button>
        </div>
        <div ref={ref} className="h-[62vh] min-h-[420px] w-full" />
      </div>
      <aside className="rounded-2xl border border-border bg-card p-4">
        {selected ? (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">{selected.name}</h2>
            <p className="text-sm text-muted-foreground">
              {selected.city} · {selected.streamName}
            </p>
            <StatusBadge status={selected.status} />
            <p className="text-sm">Composite: {formatNumber(selected.score, 1)} / 100</p>
            <p className="text-sm">Confidence: {selected.confidence}</p>
            <p className="text-sm">Last observation: {selected.lastObservation ? formatDate(selected.lastObservation) : "—"}</p>
            <p className="text-sm">Primary change: {selected.change === null ? "—" : `${selected.change}%`}</p>
            <Link className="inline-flex h-10 items-center rounded-full bg-primary px-4 text-sm text-primary-foreground" href={`/sites/${selected.id}`}>
              View site
            </Link>
          </div>
        ) : (
          <div>
            <Label>Map legend</Label>
            <ul className="mt-2 space-y-2 text-sm">
              <li><span className="mr-2 inline-block h-3 w-3 rounded-full bg-healthy" /> Healthy / Stable</li>
              <li><span className="mr-2 inline-block h-3 w-3 rounded-full bg-watch" /> Watch</li>
              <li><span className="mr-2 inline-block h-3 w-3 rounded-full bg-attention" /> Attention</li>
              <li><span className="mr-2 inline-block h-3 w-3 rounded-full bg-insufficient" /> Insufficient data</li>
            </ul>
            <p className="mt-4 text-sm text-muted-foreground">Select a marker to inspect calculated site health. Color is not the only signal — labels remain in the panel.</p>
          </div>
        )}
      </aside>
    </div>
  );
}

function valueColor(v: number | null) {
  if (v === null) return "#6b7280";
  if (v >= 80) return "#2f7d4a";
  if (v >= 60) return "#b5811a";
  return "#b4453a";
}
