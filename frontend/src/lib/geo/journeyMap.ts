import "server-only";

/**
 * Builds the SVG geometry for the World → Africa → Kenya → Counties map once, on the
 * server (at build time). The browser receives only path strings, label positions and
 * four camera views; no mapping library or boundary data is shipped to visitors.
 *
 * Data: world outlines from Natural Earth via world-atlas (public domain); Kenya's 47
 * counties from geoBoundaries gbOpen KEN ADM1, sourced from RCMRD (public domain),
 * pre-processed into src/data/geo/kenya-counties.json.
 */
import { geoBounds, geoCentroid, geoNaturalEarth1, geoPath } from "d3-geo";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { feature, merge } from "topojson-client";
import type { GeometryCollection, MultiPolygon as TopoMultiPolygon, Polygon as TopoPolygon, Topology } from "topojson-specification";
import world from "world-atlas/countries-110m.json";
import counties from "@/data/geo/kenya-counties.json";

export const MAP_WIDTH = 1000;
export const MAP_HEIGHT = 720;
const ASPECT = MAP_WIDTH / MAP_HEIGHT;

/** ISO 3166-1 numeric codes of African countries and territories in world-atlas. */
const AFRICA = new Set([
  "012", "024", "072", "108", "120", "132", "140", "148", "174", "178", "180", "204", "226", "231",
  "232", "262", "266", "270", "288", "324", "384", "404", "426", "430", "434", "450", "454", "466",
  "478", "480", "504", "508", "516", "562", "566", "624", "646", "678", "686", "690", "694", "706",
  "710", "716", "728", "729", "732", "748", "768", "788", "800", "818", "834", "854", "894",
]);
const KENYA = "404";

/** Nairobi city centre, for the "SOEA is based here" marker. */
const NAIROBI: [number, number] = [36.8219, -1.2921];

export type ViewBox = [number, number, number, number];

export interface MapCountry {
  id: string;
  d: string;
  region: "kenya" | "africa";
}

export interface MapCounty {
  slug: string;
  name: string;
  d: string;
  /** Projected label position. */
  label: [number, number];
}

export interface JourneyMapData {
  width: number;
  height: number;
  sphere: string;
  /** Every country outside Africa, merged into one outline (they are never shown apart). */
  land: string;
  countries: MapCountry[];
  counties: MapCounty[];
  nairobi: [number, number];
  views: { world: ViewBox; africa: ViewBox; kenya: ViewBox; counties: ViewBox };
}

const projection = geoNaturalEarth1().fitExtent(
  [
    [8, 8],
    [MAP_WIDTH - 8, MAP_HEIGHT - 8],
  ],
  { type: "Sphere" },
);

/** Pad a projected box and widen it to the map's aspect ratio, so every zoom is smooth. */
function toView([[x0, y0], [x1, y1]]: [[number, number], [number, number]], padding: number): ViewBox {
  let width = (x1 - x0) * (1 + padding * 2);
  let height = (y1 - y0) * (1 + padding * 2);
  if (width / height > ASPECT) height = width / ASPECT;
  else width = height * ASPECT;
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  return [cx - width / 2, cy - height / 2, width, height].map((n) => Math.round(n * 100) / 100) as ViewBox;
}

function projectedBounds(collection: FeatureCollection): [[number, number], [number, number]] {
  // geoPath.bounds works in projected space; geoBounds is only used to sanity-check data.
  return geoPath(projection).bounds(collection) as [[number, number], [number, number]];
}

let cached: JourneyMapData | null = null;

export function getJourneyMapData(): JourneyMapData {
  if (cached) return cached;

  const topology = world as unknown as Topology<{ countries: GeometryCollection }>;
  const worldCountries = feature(topology, topology.objects.countries) as FeatureCollection<Geometry, { name: string }>;
  const kenyaCounties = counties as unknown as FeatureCollection<Geometry, { name: string; slug: string }>;

  const coarse = geoPath(projection).digits(1);
  const fine = geoPath(projection).digits(2);

  // Only African countries are drawn one by one; the rest of the world is one shape.
  const land = merge(
    topology,
    topology.objects.countries.geometries.filter(
      (g): g is TopoPolygon | TopoMultiPolygon =>
        (g.type === "Polygon" || g.type === "MultiPolygon") && !AFRICA.has(String(g.id)) && g.id !== "010",
    ),
  );

  const countries: MapCountry[] = worldCountries.features
    .filter((f) => AFRICA.has(String(f.id)))
    .map((f) => {
      const id = String(f.id);
      return {
        id,
        d: coarse(f) ?? "",
        region: id === KENYA ? "kenya" : "africa",
      };
    });

  const mapCounties: MapCounty[] = kenyaCounties.features.map((f: Feature<Geometry, { name: string; slug: string }>) => {
    const [x, y] = projection(geoCentroid(f)) ?? [0, 0];
    return {
      slug: f.properties.slug,
      name: f.properties.name,
      d: fine(f) ?? "",
      label: [Math.round(x * 100) / 100, Math.round(y * 100) / 100],
    };
  });

  const africa: FeatureCollection = {
    type: "FeatureCollection",
    features: worldCountries.features.filter((f) => AFRICA.has(String(f.id))),
  };
  // Sanity check that the county file is really Kenya (catches a wrong download).
  const [[west], [east]] = geoBounds(kenyaCounties);
  if (west < 33 || east > 42.5) throw new Error("kenya-counties.json does not look like Kenya.");

  const [nx, ny] = projection(NAIROBI) ?? [0, 0];

  cached = {
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    sphere: coarse({ type: "Sphere" }) ?? "",
    land: coarse(land) ?? "",
    countries,
    counties: mapCounties,
    nairobi: [Math.round(nx * 100) / 100, Math.round(ny * 100) / 100],
    views: {
      world: toView(projectedBounds({ type: "FeatureCollection", features: [{ type: "Feature", properties: {}, geometry: land }] }), 0.02),
      africa: toView(projectedBounds(africa), 0.06),
      kenya: toView(projectedBounds(kenyaCounties), 0.35),
      counties: toView(projectedBounds(kenyaCounties), 0.08),
    },
  };
  return cached;
}
