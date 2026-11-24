import "server-only";

/**
 * Geometry and derived facts for each county page, computed once on the server.
 *
 * - Map: a Mercator projection framed on the county, with every Kenyan county drawn
 *   so the neighbours appear around it.
 * - Locator: the whole of Kenya, with the county highlighted.
 * - Facts derived from the boundary data (never invented): approximate area, and the
 *   counties that share a border. Borders were simplified topologically, so
 *   neighbouring counties share identical border points.
 */
import { geoArea, geoCentroid, geoMercator, geoPath } from "d3-geo";
import type { Feature, FeatureCollection, Geometry, Position } from "geojson";
import counties from "@/data/geo/kenya-counties.json";

const EARTH_RADIUS_KM = 6371;
export const COUNTY_MAP = { width: 800, height: 640 };
export const LOCATOR = { width: 220, height: 260 };

type CountyFeature = Feature<Geometry, { name: string; slug: string }>;

export interface CountyShape {
  slug: string;
  name: string;
  d: string;
  label: [number, number];
  /** Projected area inside the frame (px²), to skip labels for slivers. */
  visibleArea: number;
}

export interface CountyPageGeo {
  slug: string;
  name: string;
  areaKm2: number;
  neighbours: { slug: string; name: string }[];
  map: { shapes: CountyShape[]; focus: string; nairobi: [number, number] | null };
  locator: { shapes: { slug: string; d: string }[] };
}

const collection = counties as unknown as FeatureCollection<Geometry, { name: string; slug: string }>;
const NAIROBI: [number, number] = [36.8219, -1.2921];

function points(geometry: Geometry): Set<string> {
  const keys = new Set<string>();
  const add = (p: Position) => keys.add(`${p[0]},${p[1]}`);
  if (geometry.type === "Polygon") geometry.coordinates.flat().forEach(add);
  else if (geometry.type === "MultiPolygon") geometry.coordinates.flat(2).forEach(add);
  return keys;
}

const pointSets = new Map(collection.features.map((f) => [f.properties.slug, points(f.geometry)]));

/** Counties sharing at least two border points with this one (a shared edge, not a corner). */
function neighboursOf(slug: string): { slug: string; name: string }[] {
  const mine = pointSets.get(slug)!;
  return collection.features
    .filter((f) => f.properties.slug !== slug)
    .filter((f) => {
      let shared = 0;
      for (const key of pointSets.get(f.properties.slug)!) {
        if (mine.has(key) && ++shared >= 2) return true;
      }
      return false;
    })
    .map((f) => ({ slug: f.properties.slug, name: f.properties.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

const round = (n: number) => Math.round(n * 10) / 10;
const cache = new Map<string, CountyPageGeo>();

export function getCountyPageGeo(slug: string): CountyPageGeo | null {
  if (cache.has(slug)) return cache.get(slug)!;
  const county = collection.features.find((f) => f.properties.slug === slug) as CountyFeature | undefined;
  if (!county) return null;

  // Frame the county with room around it for its neighbours.
  const pad = 70;
  const projection = geoMercator().fitExtent(
    [
      [pad, pad],
      [COUNTY_MAP.width - pad, COUNTY_MAP.height - pad],
    ],
    county,
  );
  // Clip to the frame: shapes stay small, and each label sits in the visible part.
  projection.clipExtent([
    [0, 0],
    [COUNTY_MAP.width, COUNTY_MAP.height],
  ]);
  const path = geoPath(projection).digits(1);
  const shapes: CountyShape[] = collection.features.map((f) => {
    const [x, y] = f.properties.slug === slug ? projection(geoCentroid(f)) ?? [0, 0] : path.centroid(f);
    return {
      slug: f.properties.slug,
      name: f.properties.name,
      d: path(f) ?? "",
      label: [round(x), round(y)],
      visibleArea: Math.round(path.area(f)),
    };
  });
  const [nx, ny] = projection(NAIROBI) ?? [-1, -1];
  const nairobiVisible = nx >= 0 && ny >= 0 && nx <= COUNTY_MAP.width && ny <= COUNTY_MAP.height;

  const locatorProjection = geoMercator().fitExtent(
    [
      [6, 6],
      [LOCATOR.width - 6, LOCATOR.height - 6],
    ],
    collection,
  );
  const locatorPath = geoPath(locatorProjection).digits(1);

  const result: CountyPageGeo = {
    slug,
    name: county.properties.name,
    // Spherical area in steradians × R²; rounded, because the boundaries are simplified.
    areaKm2: Math.round((geoArea(county) * EARTH_RADIUS_KM ** 2) / 100) * 100,
    neighbours: neighboursOf(slug),
    map: { shapes, focus: slug, nairobi: nairobiVisible ? [round(nx), round(ny)] : null },
    locator: { shapes: collection.features.map((f) => ({ slug: f.properties.slug, d: locatorPath(f) ?? "" })) },
  };
  cache.set(slug, result);
  return result;
}
