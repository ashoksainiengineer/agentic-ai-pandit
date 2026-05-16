'use client';

// components/rectify/InteractiveMap.tsx
// Interactive OpenStreetMap with zoom, pan, and click-to-select - OPTIMIZED

import { useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface InteractiveMapProps {
    center: { lat: number; lng: number };
    zoom: number;
    marker: { lat: number; lng: number } | null;
    onLocationSelect: (lat: number, lng: number) => void;
    onCenterChange: (center: { lat: number; lng: number }) => void;
}

// Fix Leaflet default marker icon issue in Next.js
const defaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Simple throttle function
const throttle = <T extends (...args: number[]) => void>(fn: T, delay: number) => {
    let lastCall = 0;
    return (...args: Parameters<T>) => {
        const now = Date.now();
        if (now - lastCall >= delay) {
            lastCall = now;
            fn(...args);
        }
    };
};

export default function InteractiveMap({
    center,
    zoom,
    marker,
    onLocationSelect,
    onCenterChange
}: InteractiveMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const leafletMap = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);
    const isMapReadyRef = useRef(false);

    // Stable callbacks using refs
    const onLocationSelectRef = useRef(onLocationSelect);
    const onCenterChangeRef = useRef(onCenterChange);

    // Update refs when callbacks change
    useEffect(() => {
        onLocationSelectRef.current = onLocationSelect;
    }, [onLocationSelect]);

    useEffect(() => {
        onCenterChangeRef.current = onCenterChange;
    }, [onCenterChange]);

    // Throttled center change handler
    const throttledCenterChange = useMemo(
        () => throttle((lat: number, lng: number) => {
            onCenterChangeRef.current({ lat, lng });
        }, 200),
        []
    );

    // Initialize map - only once
    useEffect(() => {
        if (!mapRef.current || leafletMap.current) return;

        // Create map with optimized settings
        const map = L.map(mapRef.current, {
            center: [center.lat, center.lng],
            zoom: zoom,
            zoomControl: true,
            attributionControl: true,
            preferCanvas: true, // Use Canvas renderer for better performance
        });

        // Add OpenStreetMap tiles with optimized options
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
            updateWhenZooming: false, // Don't update tiles during zoom animation
            updateWhenIdle: true, // Only update when map is idle
            keepBuffer: 2, // Keep fewer tiles in buffer
        }).addTo(map);

        // Handle click to place marker
        map.on('click', (e: L.LeafletMouseEvent) => {
            const { lat, lng } = e.latlng;
            onLocationSelectRef.current(lat, lng);
        });

        // Handle move with throttling
        map.on('move', () => {
            const newCenter = map.getCenter();
            throttledCenterChange(newCenter.lat, newCenter.lng);
        });

        leafletMap.current = map;
        isMapReadyRef.current = true;

        // Cleanup
        return () => {
            if (leafletMap.current) {
                leafletMap.current.remove();
                leafletMap.current = null;
                isMapReadyRef.current = false;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty deps - only initialize once

    // Update center when it changes from outside - but only if significantly different
    useEffect(() => {
        if (!leafletMap.current || !isMapReadyRef.current) return;

        const currentCenter = leafletMap.current.getCenter();
        const latDiff = Math.abs(currentCenter.lat - center.lat);
        const lngDiff = Math.abs(currentCenter.lng - center.lng);

        // Only update if center changed significantly (more than 0.001 degrees)
        if (latDiff > 0.001 || lngDiff > 0.001) {
            leafletMap.current.setView([center.lat, center.lng], zoom, {
                animate: true,
                duration: 0.5
            });
        }
    }, [center.lat, center.lng, zoom]);

    // Update or create marker - optimized
    useEffect(() => {
        if (!leafletMap.current || !isMapReadyRef.current) return;

        if (marker) {
            const newLatLng: L.LatLngExpression = [marker.lat, marker.lng];

            if (markerRef.current) {
                // Only update if position changed
                const currentLatLng = markerRef.current.getLatLng();
                if (Math.abs(currentLatLng.lat - marker.lat) > 0.000001 ||
                    Math.abs(currentLatLng.lng - marker.lng) > 0.000001) {
                    markerRef.current.setLatLng(newLatLng);
                }
            } else {
                markerRef.current = L.marker(newLatLng, {
                    icon: defaultIcon,
                    draggable: true,
                    autoPan: false, // Disable auto-pan for better performance
                }).addTo(leafletMap.current);

                // Handle marker drag with throttled callback
                markerRef.current.on('drag', () => {
                    const pos = markerRef.current?.getLatLng();
                    if (pos) {
                        onLocationSelectRef.current(pos.lat, pos.lng);
                    }
                });
            }
        } else if (markerRef.current) {
            markerRef.current.remove();
            markerRef.current = null;
        }
    }, [marker, marker?.lat, marker?.lng]); // Only re-run when marker coords change

    return (
        <div className="relative w-full h-72 md:h-80 rounded-xl overflow-hidden border-2 border-[#EBE2D6] shadow-lg">
            <div ref={mapRef} className="w-full h-full" />
        </div>
    );
}
