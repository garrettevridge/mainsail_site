// Manifest + dataset fetching.
//
// Mainsail's contract is: consumers read `manifest.json` first,
// then fetch individual dataset URLs.
//
// VITE_MANIFEST_URL is set in production via GitHub Actions Variables.
// The fallback below points at the same production S3 URL so local
// dev (`npm run dev`) works against real data without any env setup.
// To develop against a different bucket / staging artifact, set
// VITE_MANIFEST_URL in a local .env file.

import { useMemo } from "react";
import useSWR from "swr";
import type { Manifest } from "./types";

const MANIFEST_URL =
  (import.meta.env.VITE_MANIFEST_URL as string | undefined) ??
  "https://mainsail-public-data.s3.us-west-2.amazonaws.com/manifest.json";

async function fetchJson<T>(url: string): Promise<T> {
  const r = await fetch(url);
  if (!r.ok) {
    throw new Error(`Fetch failed for ${url}: ${r.status}`);
  }
  // Python's json.dumps emits bare NaN/Infinity for float('nan') — not valid JSON.
  // Replace before parsing so browser JSON.parse doesn't throw.
  const text = await r.text();
  const sanitized = text
    .replace(/:\s*NaN\b/g, ": null")
    .replace(/:\s*Infinity\b/g, ": null")
    .replace(/:\s*-Infinity\b/g, ": null");
  return JSON.parse(sanitized) as T;
}

export function useManifest() {
  return useSWR<Manifest>(MANIFEST_URL, fetchJson);
}

/**
 * Fetch a dataset by name, resolved through the manifest.
 */
export function useDataset<T>(datasetName: string | null) {
  const { data: manifest, error: manifestError } = useManifest();

  const datasetUrl = useMemo(() => {
    if (!manifest || !datasetName) return null;
    const entry = manifest.datasets.find((d) => d.name === datasetName);
    if (!entry) return null;
    // Dev mocks use relative URLs; production manifests use absolute S3 URLs.
    if (entry.json_url.startsWith("/") && !entry.json_url.startsWith("//")) {
      return `${import.meta.env.BASE_URL}${entry.json_url.replace(/^\//, "")}`;
    }
    return entry.json_url;
  }, [manifest, datasetName]);

  const { data, error, isLoading } = useSWR<T[]>(datasetUrl, fetchJson);

  return {
    data,
    error: error ?? manifestError,
    isLoading: isLoading || (!manifest && !manifestError),
    datasetUrl,
    manifest,
  };
}
