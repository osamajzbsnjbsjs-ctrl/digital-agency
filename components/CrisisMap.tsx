'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface SosReport {
  id: string;
  citizen_name: string;
  phone?: string | null;
  description: string;
  latitude: number;
  longitude: number;
  severity_score: number;
  category: string;
  ai_summary: string;
  status: string;
  created_at?: string;
}

interface CrisisMapProps {
  reports: SosReport[];
  selectedId?: string | null;
  onSelectReport?: (report: SosReport) => void;
}

export default function CrisisMap({ reports, selectedId, onSelectReport }: CrisisMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // تهيئة الخريطة مرة واحدة
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [40.1885, 29.067],
      zoom: 12,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    markersLayerRef.current = layerGroup;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
    };
  }, []);

  // تحديث النقاط على الخريطة عند تغير البلاغات
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = markersLayerRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    reports.forEach((report) => {
      const isCritical = report.severity_score >= 8;
      const isMedium = report.severity_score >= 5 && report.severity_score < 8;
      const color = isCritical ? '#ef4444' : isMedium ? '#f59e0b' : '#10b981';

      const marker = L.circleMarker([report.latitude, report.longitude], {
        radius: isCritical ? 12 : 9,
        fillColor: color,
        color: '#ffffff',
        weight: selectedId === report.id ? 3.5 : 2,
        opacity: 1,
        fillOpacity: 0.9,
      });

      marker.bindPopup(`
        <div style="direction:rtl;text-align:right;min-width:180px;font-family:sans-serif;">
          <div style="font-weight:bold;font-size:14px;margin-bottom:4px;">${report.citizen_name}</div>
          <div style="font-size:12px;margin-bottom:4px;">التصنيف: <b>${report.category}</b> | الخطورة: <b>${report.severity_score}/10</b></div>
          <div style="font-size:12px;color:#334155;">${report.ai_summary}</div>
        </div>
      `);

      marker.on('click', () => {
        if (onSelectReport) onSelectReport(report);
      });

      marker.addTo(layerGroup);
    });

    // تركيز الخريطة على البلاغ المحدد إن وجد، أو على أحدث بلاغ
    const target = reports.find((r) => r.id === selectedId) || reports[0];
    if (target) {
      map.setView([target.latitude, target.longitude], 13, { animate: true });
    }
  }, [reports, selectedId, onSelectReport]);

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-[420px] md:h-[520px] rounded-2xl overflow-hidden border border-slate-800 z-0"
    />
  );
}