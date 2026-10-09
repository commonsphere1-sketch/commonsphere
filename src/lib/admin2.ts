/**
 * The second-order divisions of a country - counties, districts,
 * municipalities, whatever its second order is - as the maps draw them:
 * one file a country (static/geo/admin2, built by build-admin2.cjs from
 * geoBoundaries' gbOpen release), fetched when the country is first asked
 * for, with a manifest that says whose each country's boundaries are and
 * under which licence.
 *
 * The United States has no file here: its counties are the Census Bureau's,
 * by us-atlas, and each has a record of its own.
 */
import { useEffect, useState } from "react";
import { geoArea } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";

/** What is recorded of a country's boundaries: how many, the publisher's word for them, whose they are, the year they show and their licence. */
export type Admin2Info = { n: number; kind?: string; by: string; licence: string; year: string };
/** A division: its name, and the first-order division most of its outline lies in, where one was found. */
export type Admin2Shape = { type: string; id?: string | number; properties: { n: string; p?: string }; geometry: { type: string; coordinates: unknown[] } };
export type Admin2File = { topo: Topology; shapes: Admin2Shape[] };

export const ADMIN2_SOURCE = {
  label: "geoBoundaries (Runfola et al., 2020) — gbOpen, second-order boundaries, each under its own publisher's open licence",
  url: "https://www.geoboundaries.org/",
};

/* As the maps do it: a ring wound backwards is "everything but this island" to d3, so anything over a hemisphere is reversed. */
function rewind(f: Admin2Shape): Admin2Shape {
  const fix = (rings: number[][][]) => {
    if (geoArea({ type: "Polygon", coordinates: rings } as never) > 2 * Math.PI) for (const ring of rings) ring.reverse();
  };
  if (f.geometry.type === "Polygon") fix(f.geometry.coordinates as number[][][]);
  else if (f.geometry.type === "MultiPolygon") for (const p of f.geometry.coordinates as number[][][][]) fix(p);
  return f;
}

let MANIFEST: Promise<Record<string, Admin2Info>> | null = null;
const manifest = (): Promise<Record<string, Admin2Info>> =>
  (MANIFEST ??= fetch("/geo/admin2/manifest.json")
    .then((r): Promise<Record<string, Admin2Info>> | Record<string, Admin2Info> => (r.ok ? (r.json() as Promise<Record<string, Admin2Info>>) : {}))
    .catch((): Record<string, Admin2Info> => ({})));

const FILES = new Map<string, Promise<Admin2File | null>>();
const load = (cc: string) => {
  if (!FILES.has(cc))
    FILES.set(
      cc,
      // Asked for only where the manifest has the country: a file that is not there is not fetched.
      manifest().then((m) =>
        m[cc]
          ? fetch(`/geo/admin2/${cc}.json`)
              .then((r) => (r.ok ? (r.json() as Promise<Topology>) : Promise.reject(new Error(String(r.status)))))
              .then((topo) => ({ topo, shapes: (feature(topo, topo.objects.a) as unknown as { features: Admin2Shape[] }).features.map(rewind) }))
              .catch(() => null)
          : null,
      ),
    );
  return FILES.get(cc)!;
};

/** Which countries have second-order boundaries, and whose they are: null while it is fetched. */
export function useAdmin2Manifest(): Record<string, Admin2Info> | null {
  const [m, setM] = useState<Record<string, Admin2Info> | null>(null);
  useEffect(() => {
    let off = false;
    manifest().then((x) => !off && setM(x));
    return () => {
      off = true;
    };
  }, []);
  return m;
}

/** A country's second-order divisions, in the order of its file: undefined while they are fetched, null where none are held. Nothing is fetched for a null country. */
export function useAdmin2(cc: string | null): Admin2File | null | undefined {
  const [file, setFile] = useState<{ cc: string; file: Admin2File | null } | null>(null);
  useEffect(() => {
    if (!cc) return;
    let off = false;
    load(cc).then((f) => !off && setFile({ cc, file: f }));
    return () => {
      off = true;
    };
  }, [cc]);
  if (!cc) return null;
  return file && file.cc === cc ? file.file : undefined;
}
