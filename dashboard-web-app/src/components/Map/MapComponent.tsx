"use client";

import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapComponentProps {
  partnerLatitude?: number;
  partnerLongitude?: number;
  clientLatitude?: number;
  clientLongitude?: number;
  zoom?: number;
  className?: string;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  partnerLatitude,
  partnerLongitude,
  clientLatitude,
  clientLongitude,
  zoom = 13,
  className = "w-full h-64 rounded-xl border border-gray-800 overflow-hidden shadow-lg"
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const partnerMarkerRef = useRef<maplibregl.Marker | null>(null);
  const clientMarkerRef = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Default center (Mumbai/India default if coordinates not passed)
    const initialCenter: [number, number] = [
      partnerLongitude || clientLongitude || 72.8777,
      partnerLatitude || clientLatitude || 19.0760
    ];

    const mapInstance = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://demotiles.maplibre.org/style.json', // Free tile server
      center: initialCenter,
      zoom: zoom,
    });

    map.current = mapInstance;

    // Add navigation controls (+ / - zoom)
    mapInstance.addControl(new maplibregl.NavigationControl(), 'top-right');

    return () => {
      mapInstance.remove();
    };
  }, []);

  // Handle partner location updates
  useEffect(() => {
    if (!map.current) return;

    if (partnerLatitude && partnerLongitude) {
      if (partnerMarkerRef.current) {
        partnerMarkerRef.current.setLngLat([partnerLongitude, partnerLatitude]);
      } else {
        const el = document.createElement('div');
        el.className = 'w-6 h-6 bg-cyan-500 rounded-full border-2 border-white shadow-md animate-pulse flex items-center justify-center text-xs font-bold text-black';
        el.innerHTML = '📷';

        partnerMarkerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat([partnerLongitude, partnerLatitude])
          .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML('<b>Partner Location</b>'))
          .addTo(map.current);
      }
    }
  }, [partnerLatitude, partnerLongitude]);

  // Handle client location updates
  useEffect(() => {
    if (!map.current) return;

    if (clientLatitude && clientLongitude) {
      if (clientMarkerRef.current) {
        clientMarkerRef.current.setLngLat([clientLongitude, clientLatitude]);
      } else {
        const el = document.createElement('div');
        el.className = 'w-6 h-6 bg-purple-500 rounded-full border-2 border-white shadow-md flex items-center justify-center text-xs font-bold text-white';
        el.innerHTML = '📍';

        clientMarkerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat([clientLongitude, clientLatitude])
          .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML('<b>Client Shoot Location</b>'))
          .addTo(map.current);
      }
    }
  }, [clientLatitude, clientLongitude]);

  return <div ref={mapContainer} className={className} />;
};

export default MapComponent;
