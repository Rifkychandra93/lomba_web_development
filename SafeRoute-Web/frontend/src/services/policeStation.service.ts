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
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // 1 decimal place
}

const FALLBACK_STATIONS: Omit<PoliceStation, "distanceKm">[] = [
  {
    id: "fb-polres-depok",
    name: "Polres Metro Depok",
    type: "Polres",
    address: "Jl. Margonda Raya No. 14, Depok",
    latitude: -6.3975,
    longitude: 106.8211,
    status: "Siaga 24 Jam",
    phone: "(021) 7777110",
    lastActive: "Online",
  },
  {
    id: "fb-polsek-pancoranmas",
    name: "Polsek Pancoran Mas",
    type: "Polsek",
    address: "Jl. Raya Sawangan No. 3, Pancoran Mas, Depok",
    latitude: -6.3980,
    longitude: 106.8120,
    status: "Siaga 24 Jam",
    phone: "(021) 7520036",
    lastActive: "Online",
  },
  {
    id: "fb-polsek-beji",
    name: "Polsek Beji",
    type: "Polsek",
    address: "Jl. Margonda Raya No. 56, Beji, Depok",
    latitude: -6.3685,
    longitude: 106.8324,
    status: "Siaga 24 Jam",
    phone: "(021) 77203403",
    lastActive: "Online",
  },
  {
    id: "fb-polsek-sukmajaya",
    name: "Polsek Sukmajaya",
    type: "Polsek",
    address: "Jl. Raya Siliwangi No. 1, Sukmajaya, Depok",
    latitude: -6.4012,
    longitude: 106.8375,
    status: "Siaga 24 Jam",
    phone: "(021) 77824110",
    lastActive: "Online",
  },
  {
    id: "fb-polsek-cimanggis",
    name: "Polsek Cimanggis",
    type: "Polsek",
    address: "Jl. Raya Bogor KM 31, Cimanggis, Depok",
    latitude: -6.3620,
    longitude: 106.8640,
    status: "Siaga 24 Jam",
    phone: "(021) 8710585",
    lastActive: "Online",
  },
  {
    id: "fb-pos-margonda",
    name: "Pos Polisi Lalu Lintas Margonda",
    type: "Pos Polisi",
    address: "Jl. Margonda Raya (Simpang Juanda), Depok",
    latitude: -6.3810,
    longitude: 106.8280,
    status: "Siaga 24 Jam",
    phone: "110",
    lastActive: "Online",
  },
];

export async function fetchNearbyPoliceFromOSM(
  userLat: number,
  userLng: number,
  radiusMeters: number = 8000
): Promise<PoliceStation[]> {
  try {
    const overpassQuery = `[out:json][timeout:8];(node["amenity"="police"](around:${radiusMeters},${userLat},${userLng});way["amenity"="police"](around:${radiusMeters},${userLat},${userLng}););out center 15;`;
    const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(
      overpassQuery
    )}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(overpassUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "SafeRoute-App/1.0",
      },
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data.elements && data.elements.length > 0) {
        const osmStations: PoliceStation[] = data.elements
          .map((el: any) => {
            const lat = el.lat || (el.center && el.center.lat);
            const lon = el.lon || (el.center && el.center.lon);
            if (!lat || !lon) return null;

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
              "Wilayah Sekitar User";

            const phone =
              el.tags?.phone || el.tags?.["contact:phone"] || "110 (Call Center)";

            const dist = getDistanceFromLatLonInKm(userLat, userLng, lat, lon);

            return {
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
            };
          })
          .filter(
            (st: PoliceStation | null): st is PoliceStation => st !== null
          );

        if (osmStations.length > 0) {
          osmStations.sort((a, b) => a.distanceKm - b.distanceKm);
          return osmStations;
        }
      }
    }
  } catch (err) {
    console.warn("Overpass API error or timeout, falling back to Nominatim/Fallback:", err);
  }

  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=polisi+polsek&lat=${userLat}&lon=${userLng}&bounded=0&limit=8`;
    const res = await fetch(nominatimUrl, {
      headers: { "User-Agent": "SafeRoute-App/1.0" },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const nomStations: PoliceStation[] = data.map((item: any) => {
          const lat = parseFloat(item.lat);
          const lon = parseFloat(item.lon);
          const dist = getDistanceFromLatLonInKm(userLat, userLng, lat, lon);
          let type: "Polres" | "Polsek" | "Pos Polisi" = "Pos Polisi";
          if (/polres/i.test(item.display_name)) type = "Polres";
          else if (/polsek/i.test(item.display_name)) type = "Polsek";

          return {
            id: `nom-${item.place_id}`,
            name: item.display_name.split(",")[0] || "Kantor Polisi",
            type,
            address: item.display_name.split(",").slice(1, 3).join(",").trim(),
            latitude: lat,
            longitude: lon,
            distanceKm: dist,
            status: "Siaga 24 Jam",
            phone: "110",
            lastActive: "Online",
          };
        });

        nomStations.sort((a, b) => a.distanceKm - b.distanceKm);
        return nomStations;
      }
    }
  } catch (e) {
    console.warn("Nominatim search failed:", e);
  }

  const calculatedFallbacks: PoliceStation[] = FALLBACK_STATIONS.map((st) => ({
    ...st,
    distanceKm: getDistanceFromLatLonInKm(
      userLat,
      userLng,
      st.latitude,
      st.longitude
    ),
  }));

  calculatedFallbacks.sort((a, b) => a.distanceKm - b.distanceKm);
  return calculatedFallbacks;
}
