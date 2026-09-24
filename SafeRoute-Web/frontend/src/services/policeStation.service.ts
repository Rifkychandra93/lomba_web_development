export interface PoliceStation {
  id: string;
  name: string;
  type: "Polres" | "Polsek" | "Pos Polisi";
  address: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  status: string;
  phone: string;
  lastActive: string;
  osmId?: number | string;
}

export function getDistanceFromLatLonInKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

export async function fetchNearbyPoliceFromOSM(
  userLat: number,
  userLng: number,
  radiusMeters: number = 20000
): Promise<PoliceStation[]> {
  const foundMap = new Map<string, PoliceStation>();

  // Comprehensive Overpass query searching amenity=police, office=government, building=police, or name containing Polsek/Polres/Polisi
  const overpassQuery = `[out:json][timeout:12];(node["amenity"="police"](around:${radiusMeters},${userLat},${userLng});way["amenity"="police"](around:${radiusMeters},${userLat},${userLng});relation["amenity"="police"](around:${radiusMeters},${userLat},${userLng});node["office"="government"]["government"="police"](around:${radiusMeters},${userLat},${userLng});way["office"="government"]["government"="police"](around:${radiusMeters},${userLat},${userLng});node["building"="police"](around:${radiusMeters},${userLat},${userLng});way["building"="police"](around:${radiusMeters},${userLat},${userLng});node[~"name"~"Polsek|Polres|Polisi|POLRI",i](around:${radiusMeters},${userLat},${userLng});way[~"name"~"Polsek|Polres|Polisi|POLRI",i](around:${radiusMeters},${userLat},${userLng}););out center 60;`;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const overpassUrl = `${endpoint}?data=${encodeURIComponent(overpassQuery)}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const response = await fetch(overpassUrl, {
        signal: controller.signal,
        headers: { "User-Agent": "SafeRoute-LiveGPS/1.0" },
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.elements && data.elements.length > 0) {
          for (const el of data.elements) {
            const lat = el.lat || (el.center && el.center.lat);
            const lon = el.lon || (el.center && el.center.lon);
            if (!lat || !lon) continue;

            const nameTag =
              el.tags?.name ||
              el.tags?.["name:id"] ||
              el.tags?.operator ||
              "Kantor Polisi";

            let type: "Polres" | "Polsek" | "Pos Polisi" = "Pos Polisi";
            if (/polres/i.test(nameTag)) type = "Polres";
            else if (/polsek/i.test(nameTag)) type = "Polsek";

            const street =
              el.tags?.["addr:street"] ||
              el.tags?.["addr:full"] ||
              el.tags?.["addr:subdistrict"] ||
              el.tags?.["addr:city"] ||
              "Lokasi Terdaftar OSM";

            const phone =
              el.tags?.phone || el.tags?.["contact:phone"] || "110";

            const dist = getDistanceFromLatLonInKm(userLat, userLng, lat, lon);
            const key = `${nameTag.toLowerCase().trim()}-${lat.toFixed(2)}-${lon.toFixed(2)}`;

            if (!foundMap.has(key)) {
              foundMap.set(key, {
                id: `osm-${el.id}`,
                name: nameTag,
                type,
                address: street,
                latitude: lat,
                longitude: lon,
                distanceKm: dist,
                status: "Siaga 24 Jam",
                phone,
                lastActive: "Online",
                osmId: el.id,
              });
            }
          }
          if (foundMap.size > 0) break; // Successfully got Overpass data
        }
      }
    } catch (err) {
      console.warn(`Overpass endpoint ${endpoint} failed or timed out:`, err);
    }
  }

  // Multi-term Nominatim search (polsek, polres, pos polisi, kantor polisi)
  const nominatimTerms = ["polsek", "polres", "pos+polisi", "kantor+polisi"];
  const delta = 0.25; // ~25km box around user
  const minLng = userLng - delta;
  const maxLat = userLat + delta;
  const maxLng = userLng + delta;
  const minLat = userLat - delta;
  const viewbox = `${minLng},${maxLat},${maxLng},${minLat}`;

  await Promise.all(
    nominatimTerms.map(async (term) => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${term}&lat=${userLat}&lon=${userLng}&viewbox=${viewbox}&bounded=1&countrycodes=id&limit=15`;
        const res = await fetch(url, {
          headers: { "User-Agent": "SafeRoute-LiveGPS/1.0" },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            for (const item of data) {
              const lat = parseFloat(item.lat);
              const lon = parseFloat(item.lon);
              if (isNaN(lat) || isNaN(lon)) continue;

              const rawName = item.display_name.split(",")[0] || "Kantor Polisi";
              const dist = getDistanceFromLatLonInKm(userLat, userLng, lat, lon);
              const key = `${rawName.toLowerCase().trim()}-${lat.toFixed(2)}-${lon.toFixed(2)}`;

              if (!foundMap.has(key)) {
                let type: "Polres" | "Polsek" | "Pos Polisi" = "Pos Polisi";
                if (/polres/i.test(item.display_name)) type = "Polres";
                else if (/polsek/i.test(item.display_name)) type = "Polsek";

                const addrParts = item.display_name.split(",");
                const address = addrParts.slice(1, 4).join(",").trim() || "Area Sekitar";

                foundMap.set(key, {
                  id: `nom-${item.place_id}`,
                  name: rawName,
                  type,
                  address,
                  latitude: lat,
                  longitude: lon,
                  distanceKm: dist,
                  status: "Siaga 24 Jam",
                  phone: "110",
                  lastActive: "Online",
                });
              }
            }
          }
        }
      } catch (e) {
        console.warn(`Nominatim search for term ${term} failed:`, e);
      }
    })
  );

  const result = Array.from(foundMap.values());

  // Filter out military-only non-civilian police if user is looking for Polsek/Polres, unless nothing else is found
  const filteredResult = result.filter((st) => {
    // Keep all Polsek, Polres, Pos Polisi, and POLRI facilities
    return true;
  });

  // Sort strictly by nearest distance ascending (0.5km, 1.2km, 2.5km...)
  filteredResult.sort((a, b) => a.distanceKm - b.distanceKm);

  return filteredResult;
}
