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

export async function fetchNearbyPoliceFromOSM(
  userLat: number,
  userLng: number,
  radiusMeters: number = 15000
): Promise<PoliceStation[]> {
  const foundMap = new Map<string, PoliceStation>();

  // 1. Overpass API query searching amenity=police around the exact user GPS coordinates
  try {
    const overpassQuery = `[out:json][timeout:10];(node["amenity"="police"](around:${radiusMeters},${userLat},${userLng});way["amenity"="police"](around:${radiusMeters},${userLat},${userLng});relation["amenity"="police"](around:${radiusMeters},${userLat},${userLng}););out center 35;`;
    const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(
      overpassQuery
    )}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

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

          const stationKey = `${nameTag.toLowerCase().trim()}-${lat.toFixed(3)}`;
          if (!foundMap.has(stationKey)) {
            foundMap.set(stationKey, {
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
      }
    }
  } catch (err) {
    console.warn("Overpass live GPS query error/timeout:", err);
  }

  // 2. Nominatim search around the user's exact coordinates if Overpass returns few results
  if (foundMap.size < 4) {
    try {
      const delta = 0.2; // ~20km box
      const viewbox = `${userLng - delta},${userLat + delta},${userLng + delta},${userLat - delta}`;
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=polisi&lat=${userLat}&lon=${userLng}&viewbox=${viewbox}&bounded=1&countrycodes=id&limit=20`;
      
      const res = await fetch(nominatimUrl, {
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
            const stationKey = `${rawName.toLowerCase().trim()}-${lat.toFixed(3)}`;

            if (!foundMap.has(stationKey)) {
              const dist = getDistanceFromLatLonInKm(userLat, userLng, lat, lon);
              let type: "Polres" | "Polsek" | "Pos Polisi" = "Pos Polisi";
              if (/polres/i.test(item.display_name)) type = "Polres";
              else if (/polsek/i.test(item.display_name)) type = "Polsek";

              const addrParts = item.display_name.split(",");
              const address = addrParts.slice(1, 4).join(",").trim() || "Area Sekitar";

              foundMap.set(stationKey, {
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
      console.warn("Nominatim live GPS search failed:", e);
    }
  }

  const result = Array.from(foundMap.values());

  // Sort by nearest distance ascending
  result.sort((a, b) => a.distanceKm - b.distanceKm);

  return result;
}
