'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LiveMapProps {
    currentPos?: { lat: number; lng: number };
    destinationPos: { lat: number; lng: number };
    trackingNumber: string;
}

export default function LiveMap({ currentPos, destinationPos, trackingNumber }: LiveMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);

    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return;

        // Initialize Map
        const map = L.map(mapRef.current).setView(
            [currentPos?.lat || destinationPos.lat, currentPos?.lng || destinationPos.lng],
            13
        );

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        mapInstanceRef.current = map;

        // Fix Leaflet marker icons
        const DefaultIcon = L.icon({
            iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41]
        });
        L.Marker.prototype.options.icon = DefaultIcon;

        // Destination Marker
        L.marker([destinationPos.lat, destinationPos.lng], {
            icon: L.icon({
                iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
                iconSize: [40, 40],
                iconAnchor: [20, 40]
            })
        }).addTo(map).bindPopup('Destination');

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (!mapInstanceRef.current) return;

        if (currentPos) {
            if (markerRef.current) {
                markerRef.current.setLatLng([currentPos.lat, currentPos.lng]);
            } else {
                markerRef.current = L.marker([currentPos.lat, currentPos.lng], {
                    icon: L.icon({
                        iconUrl: 'https://cdn-icons-png.flaticon.com/512/709/709790.png',
                        iconSize: [45, 45],
                        iconAnchor: [22, 45]
                    })
                }).addTo(mapInstanceRef.current).bindPopup('Delivery Partner');
            }
            mapInstanceRef.current.panTo([currentPos.lat, currentPos.lng]);
        }
    }, [currentPos]);

    return <div ref={mapRef} className="w-full h-full rounded-2xl z-0" />;
}
