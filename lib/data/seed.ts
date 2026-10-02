import { DEMO_AS_OF, DEMO_SEED } from "@/lib/config";
import {
  calculateCompositeScore,
  deriveCitizenSignal,
  deriveEnvironmentalContext,
} from "@/lib/analytics";
import { clamp, round } from "@/lib/utils";
import { jitter, mulberry32, pick } from "@/lib/data/prng";
import type {
  CitizenObservation,
  DataSource,
  IndicatorSnapshot,
  Site,
  SiteProfile,
  Stream,
} from "@/types";

export interface DemoDataset {
  generatedAt: string;
  asOf: string;
  isSynthetic: true;
  sources: DataSource[];
  streams: Stream[];
  sites: Site[];
  indicators: IndicatorSnapshot[];
  observations: CitizenObservation[];
}

const CITIES = [
  {
    city: "Lisbon",
    country: "Portugal",
    countryCode: "PT",
    lat: 38.7223,
    lon: -9.1393,
    streams: ["Ribeira de Alcântara", "Rio Trancão", "Ribeira de Benfica", "Jamor"],
  },
  {
    city: "Porto",
    country: "Portugal",
    countryCode: "PT",
    lat: 41.1579,
    lon: -8.6291,
    streams: ["Rio Leça", "Rio Tinto", "Rio Ferreira", "Rio Sousa"],
  },
  {
    city: "Athens",
    country: "Greece",
    countryCode: "GR",
    lat: 37.9838,
    lon: 23.7275,
    streams: ["Kifisos", "Ilisos", "Podoniftis", "Pikrodafni"],
  },
  {
    city: "Barcelona",
    country: "Spain",
    countryCode: "ES",
    lat: 41.3851,
    lon: 2.1734,
    streams: ["Besòs", "Llobregat urban reach", "Riera de Horta", "Riera de Vallvidrera"],
  },
  {
    city: "Vienna",
    country: "Austria",
    countryCode: "AT",
    lat: 48.2082,
    lon: 16.3738,
    streams: ["Wienfluss", "Liesing", "Donaukanal margin", "Alte Donau inlet"],
  },
] as const;

const PROFILES: SiteProfile[] = [
  "declining",
  "improving",
  "stable",
  "gap",
  "hotspot",
  "mixed",
];

const WATER_APPEARANCE = ["clear", "slightly turbid", "turbid", "discoloured", "foamy"];
const FLOW = ["still", "slow", "moderate", "fast", "dry"];
const VEGETATION = ["abundant riparian cover", "moderate cover", "sparse", "mowed banks", "algae present"];
const POLLUTION = ["none observed", "litter", "oil sheen", "sewage odour", "construction runoff"];
const BIODIVERSITY = [
  "macroinvertebrates noted",
  "birds along banks",
  "amphibian call",
  "no fauna observed",
  "fish observed",
  "adult Diptera abundant",
];

export function generateDemoDataset(seed = DEMO_SEED, asOf = DEMO_AS_OF): DemoDataset {
  const rand = mulberry32(seed);
  const streams: Stream[] = [];
  const sites: Site[] = [];

  let streamIndex = 0;
  CITIES.forEach((city) => {
    city.streams.forEach((streamName, sIdx) => {
      const streamId = `st-${city.countryCode.toLowerCase()}-${streamIndex + 1}`;
      streamIndex += 1;
      streams.push({
        id: streamId,
        name: streamName,
        city: city.city,
        country: city.country,
        countryCode: city.countryCode,
      });

      const sitesPerStream = 4;
      for (let i = 0; i < sitesPerStream; i += 1) {
        const n = sites.length + 1;
        const code = `AI-${city.countryCode}-${String(n).padStart(3, "0")}`;
        let profile: SiteProfile = PROFILES[n % PROFILES.length];
        if (city.city === "Lisbon" && streamName === "Ribeira de Alcântara" && i === 0) {
          profile = "declining";
        }
        if (city.city === "Vienna" && i === 0 && sIdx === 0) profile = "improving";
        if (city.city === "Athens" && streamName === "Kifisos" && i === 1) profile = "hotspot";
        if (city.city === "Barcelona" && i === 3 && sIdx === 2) profile = "gap";

        sites.push({
          id: `site-${n}`,
          code,
          name: siteName(streamName, i),
          streamId,
          streamName,
          city: city.city,
          country: city.country,
          countryCode: city.countryCode,
          latitude: round(jitter(rand, city.lat + (sIdx - 1.5) * 0.04, 0.02), 5),
          longitude: round(jitter(rand, city.lon + (i - 1.5) * 0.035, 0.02), 5),
          profile,
        });
      }
    });
  });

  const end = new Date(`${asOf}T00:00:00Z`);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 370);
  const dates: string[] = [];
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 7)) {
    dates.push(d.toISOString().slice(0, 10));
  }

  const indicators: IndicatorSnapshot[] = [];
  const observations: CitizenObservation[] = [];

  sites.forEach((site, siteIdx) => {
    const base = profileBase(site.profile, rand);
    dates.forEach((date, week) => {
      const progress = week / Math.max(1, dates.length - 1);
      const seasonal = Math.sin((week / 52) * Math.PI * 2) * 6;
      const noise = () => (rand() - 0.5) * 8;

      const wq = base.wq + seasonal + noise() + trendDelta(site.profile, "wq", progress);
      const bio = base.bio + seasonal * 0.6 + noise() + trendDelta(site.profile, "bio", progress);
      const hab = base.hab + seasonal * 0.4 + noise() + trendDelta(site.profile, "hab", progress);
      const pol = base.pol - seasonal * 0.3 + noise() + trendDelta(site.profile, "pol", progress);
      const veg = base.veg + seasonal * 0.5 + noise();
      const flow = base.flow + seasonal * 0.2 + noise();
      const rain = clamp(48 + seasonal * 1.2 + noise() * 1.4, 5, 95);
      const temp = clamp(17 + seasonal * 0.35 + (rand() - 0.5) * 6, 2, 34);

      const missingWq = site.profile === "gap" || (site.profile === "mixed" && week % 11 === 0);
      const missingBio = site.profile === "gap" && week % 5 === 0;

      indicators.push({
        siteId: site.id,
        date,
        waterQuality: missingWq ? null : clamp(wq),
        biodiversity: missingBio ? null : clamp(bio),
        habitat: clamp(hab),
        pollution: clamp(pol),
        vegetation: clamp(veg),
        flow: clamp(flow),
        rainfall: rain,
        temperature: round(temp as number, 1),
        observationCount: 1 + Math.floor(rand() * 4),
      });
    });

    const obsCount = 8 + Math.floor(rand() * 10) + (site.profile === "declining" || site.profile === "hotspot" ? 12 : 0);
    for (let i = 0; i < obsCount; i += 1) {
      const date = dates[Math.floor(rand() * dates.length)];
      const flags: string[] = [];
      let quality: CitizenObservation["dataQuality"] = "validated";
      if (rand() < 0.08) {
        quality = "needs_review";
        flags.push("Suspicious value relative to nearby observations");
      }
      if (rand() < 0.05) {
        quality = "incomplete";
        flags.push("Missing required field");
      }
      if (rand() < 0.03) flags.push("Possible duplicate observation");

      const pollution = pick(rand, POLLUTION);
      observations.push({
        id: `obs-${siteIdx}-${i}`,
        siteId: site.id,
        siteName: site.name,
        streamName: site.streamName,
        city: site.city,
        country: site.country,
        latitude: round(site.latitude + (rand() - 0.5) * 0.008, 5),
        longitude: round(site.longitude + (rand() - 0.5) * 0.008, 5),
        observedAt: `${date}T${String(8 + Math.floor(rand() * 10)).padStart(2, "0")}:00:00Z`,
        waterAppearance: quality === "incomplete" && rand() < 0.5 ? null : pick(rand, WATER_APPEARANCE),
        flow: pick(rand, FLOW),
        vegetation: pick(rand, VEGETATION),
        pollution: site.profile === "declining" || site.profile === "hotspot" ? pick(rand, POLLUTION.slice(1)) : pollution,
        biodiversity: pick(rand, BIODIVERSITY),
        notes: rand() < 0.35 ? "Citizen demonstration record generated for AquaInsight demo mode." : null,
        photoUrl: null,
        source: "AquaInsight demo / synthetic citizen record",
        dataQuality: quality,
        flags,
      });
    }
  });

  const sources: DataSource[] = [
    {
      id: "src-demo",
      sourceName: "AquaInsight Demo/Synthetic Dataset",
      sourceUrl: "/methodology",
      license: "Demonstration data — not for operational use",
      retrievedAt: asOf,
      description:
        "Deterministic synthetic urban-stream indicators and citizen-style observations generated for the OneAquaHealth Track 2 prototype. Not collected by real citizens.",
      isSynthetic: true,
      dataType: "indicators+observations",
    },
    {
      id: "src-oah",
      sourceName: "OneAquaHealth concepts (reference)",
      sourceUrl: "https://oneaquahealth.eu/",
      license: "External project reference",
      retrievedAt: asOf,
      description:
        "Conceptual alignment with citizen science, urban stream ecosystems and One Health. AquaInsight scores are not an official OneAquaHealth formula.",
      isSynthetic: false,
      dataType: "methodology-reference",
    },
    {
      id: "src-osm",
      sourceName: "OpenStreetMap basemap",
      sourceUrl: "https://www.openstreetmap.org/copyright",
      license: "ODbL",
      retrievedAt: asOf,
      description: "Public map tiles used for spatial context.",
      isSynthetic: false,
      dataType: "basemap",
    },
  ];

  return {
    generatedAt: asOf,
    asOf,
    isSynthetic: true,
    sources,
    streams,
    sites,
    indicators,
    observations,
  };
}

function siteName(stream: string, index: number) {
  const labels = ["Upper reach", "Mid reach", "Lower reach", "Confluence"];
  return `${stream} — ${labels[index]}`;
}

function profileBase(profile: SiteProfile, rand: () => number) {
  const n = () => (rand() - 0.5) * 6;
  switch (profile) {
    case "declining":
      return { wq: 62 + n(), bio: 64 + n(), hab: 61 + n(), pol: 38 + n(), veg: 58 + n(), flow: 60 + n() };
    case "hotspot":
      return { wq: 52 + n(), bio: 55 + n(), hab: 50 + n(), pol: 48 + n(), veg: 49 + n(), flow: 54 + n() };
    case "improving":
      return { wq: 70 + n(), bio: 72 + n(), hab: 74 + n(), pol: 22 + n(), veg: 76 + n(), flow: 71 + n() };
    case "gap":
      return { wq: 68 + n(), bio: 66 + n(), hab: 64 + n(), pol: 28 + n(), veg: 62 + n(), flow: 60 + n() };
    case "stable":
      return { wq: 84 + n(), bio: 82 + n(), hab: 81 + n(), pol: 16 + n(), veg: 80 + n(), flow: 78 + n() };
    default:
      return { wq: 73 + n(), bio: 71 + n(), hab: 69 + n(), pol: 26 + n(), veg: 70 + n(), flow: 68 + n() };
  }
}

function trendDelta(profile: SiteProfile, key: string, progress: number) {
  const t = (progress - 0.55) * 2;
  if (profile === "declining") {
    if (key === "pol") return 18 * Math.max(0, t);
    return -16 * Math.max(0, t);
  }
  if (profile === "hotspot") {
    if (key === "pol") return 22 * Math.max(0, t);
    return -20 * Math.max(0, t);
  }
  if (profile === "improving") {
    if (key === "pol") return -14 * Math.max(0, t);
    return 14 * Math.max(0, t);
  }
  return 0;
}

export function snapshotComponents(row: IndicatorSnapshot) {
  return {
    waterQuality: row.waterQuality,
    biodiversity: row.biodiversity,
    habitat: row.habitat,
    citizenSignal: deriveCitizenSignal({
      pollution: row.pollution,
      vegetation: row.vegetation,
      biodiversity: row.biodiversity,
      flow: row.flow,
    }),
    environmentalContext: deriveEnvironmentalContext({
      rainfall: row.rainfall,
      temperature: row.temperature,
    }),
  };
}

export function snapshotScore(row: IndicatorSnapshot) {
  return calculateCompositeScore(snapshotComponents(row));
}
