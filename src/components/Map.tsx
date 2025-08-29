"use client";
import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

export default function Map() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [80, 15],
      zoom: 4,
    });
    mapRef.current = map;

    // Mangrove extent overlay (GeoJSON or raster tile)
    map.on("load", () => {
      map.addSource("mangrove", {
        type: "raster",
        tiles: [
          // Example: Replace with actual mangrove extent tile URL
          "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_NDVI_8Day/default/2023-08-01/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpg"
        ],
        tileSize: 256,
      });
      map.addLayer({
        id: "mangrove-layer",
        type: "raster",
        source: "mangrove",
        paint: { "raster-opacity": 0.5 },
      });
    });

    return () => {
      map.remove();
    };
  }, []);

  return (
    <div className="relative w-full h-96 rounded overflow-hidden border">
      <div ref={mapContainer} className="absolute inset-0" />
      <div className="absolute top-2 left-2 bg-white bg-opacity-80 rounded p-2 text-xs shadow">
        <div>Mangrove extent overlay</div>
        <div>NDVI & Satellite thumbnails (coming soon)</div>
      </div>
    </div>
  );
}
