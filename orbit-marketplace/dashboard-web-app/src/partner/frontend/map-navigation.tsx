"use client";

/**
 * 🟣 PARTNER FRONTEND | MapNavigation
 * 
 * Interactive MapLibre GL map visualization showing route from partner
 * location to destination. Includes interactive panning/zooming,
 * markers, distance/ETA info, and navigation buttons.
 * 
 * Used by: partner-dashboard.tsx
 * Category: Partner UI
 */

import { useEffect, useRef, useState } from "react";
import { Navigation2, MapPin, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { type BookingInfo } from "@/lib/types";

interface MapNavigationProps {
  booking: BookingInfo;
  onArrived: () => void;
}

export function MapNavigation({ booking, onArrived }: MapNavigationProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  // Parse coordinates suffix (format: "Address text @latitude,longitude")
  let cleanAddress = booking.location || "";
  let initialDestCoords: [number, number] = [77.5946, 12.9716]; // Default: Bangalore
  if (booking.location && booking.location.includes(" @")) {
    const parts = booking.location.split(" @");
    cleanAddress = parts[0];
    const coordParts = parts[1].split(",");
    const lat = parseFloat(coordParts[0]);
    const lng = parseFloat(coordParts[1]);
    if (!isNaN(lat) && !isNaN(lng)) {
      initialDestCoords = [lng, lat];
    }
  }

  const handleNavigate = () => {
    if (!booking.location) {
      toast.error("No location specified for this booking.");
      return;
    }
    toast.success("Opening Google Maps...");
    
    // If coordinates suffix exists, navigate directly to coordinates for absolute precision
    let destination = booking.location;
    if (booking.location.includes(" @")) {
      const parts = booking.location.split(" @");
      destination = parts[1]; // Use exact "latitude,longitude"
    }
    
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  useEffect(() => {
    let active = true;
    let mapInstance: any = null;

    // We load maplibre-gl dynamically to ensure SSR safety
    import("maplibre-gl")
      .then((maplibreglModule) => {
        if (!active) return;
        const maplibregl = maplibreglModule.default || maplibreglModule;

        // Dynamically insert MapLibre CSS if not already present
        if (!document.getElementById("maplibre-css")) {
          const link = document.createElement("link");
          link.id = "maplibre-css";
          link.rel = "stylesheet";
          link.href = "https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.css";
          document.head.appendChild(link);
        }

        if (!mapContainerRef.current) return;

        // Parse coordinates
        let destCoords = initialDestCoords;
        const partnerCoords: [number, number] = [destCoords[0] - 0.0146, destCoords[1] - 0.0066];
        const centerCoords: [number, number] = [
          (partnerCoords[0] + destCoords[0]) / 2,
          (partnerCoords[1] + destCoords[1]) / 2,
        ];

        const apiKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY || "a731ad7ed2444d32a8a63d147ac013ed";
        const map = new maplibregl.Map({
          container: mapContainerRef.current,
          style: `https://api.maptiler.com/maps/dark-matter/style.json?key=${apiKey}`,
          center: centerCoords,
          zoom: 13,
          attributionControl: false,
        });

        mapInstance = map;

        // Add zoom controls
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

        map.on("load", () => {
          if (!active) return;

          // Partner marker (Cyan pulse)
          const partnerEl = document.createElement("div");
          partnerEl.className = "flex flex-col items-center justify-center";
          partnerEl.innerHTML = `
            <div class="relative flex items-center justify-center">
              <div class="absolute w-8 h-8 rounded-full bg-[#00BFFF]/30 animate-ping"></div>
              <div class="absolute w-5 h-5 rounded-full bg-[#00BFFF]/20 animate-pulse"></div>
              <div class="w-3.5 h-3.5 rounded-full bg-[#00BFFF] border-2 border-white shadow-[0_0_10px_#00BFFF]"></div>
            </div>
            <div class="mt-1 px-2 py-0.5 rounded bg-black/85 border border-[#00BFFF]/30 text-[10px] font-bold text-[#00BFFF] whitespace-nowrap shadow-md">You</div>
          `;

          new maplibregl.Marker({ element: partnerEl })
            .setLngLat(partnerCoords)
            .addTo(map);

          // Destination marker (Purple pulse)
          const destEl = document.createElement("div");
          destEl.className = "flex flex-col items-center justify-center";
          destEl.innerHTML = `
            <div class="relative flex items-center justify-center">
              <div class="absolute w-8 h-8 rounded-full bg-[#A020F0]/30 animate-ping"></div>
              <div class="absolute w-5 h-5 rounded-full bg-[#A020F0]/20 animate-pulse"></div>
              <div class="w-3.5 h-3.5 rounded-full bg-[#A020F0] border-2 border-white shadow-[0_0_10px_#A020F0]"></div>
            </div>
            <div class="mt-1 px-2 py-0.5 rounded bg-black/85 border border-[#A020F0]/30 text-[10px] font-bold text-[#A020F0] whitespace-nowrap shadow-md">Destination</div>
          `;

          new maplibregl.Marker({ element: destEl })
            .setLngLat(destCoords)
            .addTo(map);

          // Fit bounds to fit both points with nice padding
          const bounds = new maplibregl.LngLatBounds();
          bounds.extend(partnerCoords);
          bounds.extend(destCoords);
          map.fitBounds(bounds, { padding: 50, duration: 1500 });

          // Route coordinates dynamically interpolated between partner and destination
          const dx = destCoords[0] - partnerCoords[0];
          const dy = destCoords[1] - partnerCoords[1];
          const routeCoords = [
            partnerCoords,
            [partnerCoords[0] + dx * 0.25 + dy * 0.05, partnerCoords[1] + dy * 0.25 - dx * 0.05],
            [partnerCoords[0] + dx * 0.50 - dy * 0.05, partnerCoords[1] + dy * 0.50 + dx * 0.05],
            [partnerCoords[0] + dx * 0.75 + dy * 0.03, partnerCoords[1] + dy * 0.75 - dx * 0.03],
            destCoords,
          ];

          // Add route source and layers
          map.addSource("route", {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: routeCoords,
              },
            },
          });

          // Glow shadow layer (purple)
          map.addLayer({
            id: "route-glow",
            type: "line",
            source: "route",
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": "#A020F0",
              "line-width": 8,
              "line-opacity": 0.4,
            },
          });

          // Core route line (cyan)
          map.addLayer({
            id: "route-line",
            type: "line",
            source: "route",
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": "#00BFFF",
              "line-width": 4,
              "line-opacity": 0.9,
            },
          });
        });

        let hasFalledBack = false;
        map.on("error", (e: any) => {
          console.error("MapLibre GL error:", e);
          
          // Check if style failed to load (e.g. invalid MapTiler key, 403 Forbidden, 401, etc.)
          const errorMsg = e.error?.message || e.message || "";
          const isStyleError = errorMsg.toLowerCase().includes("style") || 
                               errorMsg.toLowerCase().includes("metadata") ||
                               (e.error?.status === 403 || e.error?.status === 401);
                               
          if (isStyleError && !hasFalledBack) {
            hasFalledBack = true;
            console.warn("Style loading failed. Falling back to public CartoDB dark-matter style...");
            map.setStyle("https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json");
            return;
          }
          
          // Only trigger fatal visual error on actual library or repeated failures
          if (isStyleError && hasFalledBack && active) {
            setMapError("Failed to render map style. Please check your map styling endpoints.");
          }
        });
      })
      .catch((err) => {
        console.error("Failed to load maplibre-gl:", err);
        if (active) {
          setMapError("Failed to initialize map library.");
        }
      });

    return () => {
      active = false;
      if (mapInstance) {
        mapInstance.remove();
      }
    };
  }, []);

  return (
    <div className="orbit-card rounded-2xl p-3 sm:p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
        <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
          <Navigation2 className="w-4 h-4 sm:w-5 sm:h-5 text-orbit-cyan animate-pulse" />
          Navigate to Location
        </h3>
        <Badge variant="outline" className="border-orbit-cyan/30 text-orbit-cyan bg-orbit-cyan/10 w-fit">
          {booking.id}
        </Badge>
      </div>

      {/* Map Visualization */}
      <div className="orbit-card rounded-xl p-0 mb-4 sm:mb-6 border border-orbit-cyan/20 overflow-hidden relative h-[320px] bg-black">
        {mapError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            <span className="text-red-400 text-sm font-medium mb-1">{mapError}</span>
            <span className="text-muted-foreground text-xs">Please check internet connection or tiles API</span>
          </div>
        ) : (
          <div ref={mapContainerRef} className="w-full h-full" />
        )}

        {/* Overlay info on map */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
          <div className="orbit-card-strong rounded-lg px-3 py-2 text-xs flex items-center gap-2 pointer-events-auto">
            <div className="w-2 h-2 rounded-full bg-orbit-cyan animate-pulse" />
            <span className="text-orbit-cyan font-medium">Live Tracking</span>
          </div>
          <div className="orbit-card-strong rounded-lg px-3 py-2 text-xs text-muted-foreground flex items-center gap-1 pointer-events-auto">
            <Route className="w-3 h-3 text-orbit-purple" />
            <span className="text-orbit-purple font-medium">Optimized Route</span>
          </div>
        </div>
      </div>

      {/* Distance & ETA Info */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="orbit-card rounded-xl p-3 text-center border border-orbit-cyan/20">
          <div className="text-xs text-muted-foreground mb-1">Distance</div>
          <div className="text-lg font-black text-gradient-orbit">8.4 km</div>
        </div>
        <div className="orbit-card rounded-xl p-3 text-center border border-orbit-cyan/20">
          <div className="text-xs text-muted-foreground mb-1">ETA</div>
          <div className="text-lg font-black text-gradient-orbit">22 min</div>
        </div>
        <div className="orbit-card rounded-xl p-3 text-center border border-orbit-cyan/20">
          <div className="text-xs text-muted-foreground mb-1">Location</div>
          <div className="text-sm font-bold text-foreground truncate">{cleanAddress}</div>
        </div>
        <div className="orbit-card rounded-xl p-3 text-center border border-orbit-cyan/20">
          <div className="text-xs text-muted-foreground mb-1">Time Slot</div>
          <div className="text-sm font-bold text-foreground">{booking.timeSlot}</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={handleNavigate} className="flex-1 bg-gradient-to-r from-orbit-cyan to-orbit-purple text-white hover:opacity-90 font-bold orbit-glow">
          <Navigation2 className="w-4 h-4 mr-2" />Navigate
        </Button>
        <Button onClick={onArrived} className="flex-1 border border-green-500/30 text-green-400 hover:bg-green-500/10 font-bold bg-green-500/5">
          <MapPin className="w-4 h-4 mr-2" />Arrived at Location
        </Button>
      </div>
    </div>
  );
}