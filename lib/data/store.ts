import { generateDemoDataset, type DemoDataset } from "@/lib/data/seed";

let cached: DemoDataset | null = null;

export function getDataset(): DemoDataset {
  if (!cached) {
    cached = generateDemoDataset();
  }
  return cached;
}

export function isDemoMode() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !url || !key || url.includes("your-project") || key.includes("your-anon");
}
