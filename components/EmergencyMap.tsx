'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { SosReport } from '@/app/command-center/page';

interface EmergencyMapProps {
  reports: SosReport[];
  selectedReport: SosReport | null;
  onSelectReport: (report: SosReport) => void;
}

function getMarkerColor(report: SosReport): string {
  if (report.status === 'resolved') return '#10b981'; // أخضر
  if (report.status === 'dispatched') return '#f59e0b'; // ذهبي/برتقالي
  if (Number(report.severity_score) >= 8) return '#ef4444'; // أحمر حرج
  return '#f97316'; // برتقالي
}

export default function EmergencyMap({
  reports,
  selectedReport,
  onSelectReport,
}: EmergencyMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // تهيئة الخريطة مرة واحدة
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialLat = selectedReport?.latitude ?? reports[0]?.latitude ?? 40.1885;
    const initialLng = selectedReport?.longitude ?? reports[0]?.longitude ?? 29.067;

    const map = L.map(mapContainerRef.current).setView([initialLat, initialLng], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    markersLayerRef.current = layerGroup;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // تحديث النقاط عند تغيّر البلاغات أو البلاغ المحدد
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = markersLayerRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    reports.forEach((report) => {
      const lat = Number(report.latitude);
      const lng = Number(report.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const isSelected = selectedReport?.id === report.id;
      const color = getMarkerColor(report);

      const marker = L.circleMarker([lat, lng], {
        radius: isSelected ? 12 : 8,
        fillColor: color,
        color: isSelected ? '#ffffff' : color,
        weight: isSelected ? 3 : 2,
        opacity: 1,
        fillOpacity: 0.85,
      });

      marker.bindPopup(
        `<div style="direction:rtl;text-align:right;font-family:sans-serif;min-width:160px;">
          <strong>${report.citizen_name}</strong><br/>
          <span>التصنيف: ${report.category}</span><br/>
          <span>الخطورة: ${report.severity_score}/10</span>
        </div>`
      );

      marker.on('click', () => {
        onSelectReport(report);
      });

      marker.addTo(layerGroup);
    });
  }, [reports, selectedReport, onSelectReport]);

  // تحريك الخريطة بسلاسة نحو البلاغ المحدد
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedReport) return;

    const lat = Number(selectedReport.latitude);
    const lng = Number(selectedReport.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    map.flyTo([lat, lng], 14, { duration: 0.8 });
  }, [selectedReport]);

  return (
    <div className="relative h-[420px] w-full rounded-2xl overflow-hidden border border-slate-800 bg-[#091229]">
      <div
        ref={mapContainerRef}
        className="h-full w-full z-0 brightness-90 contrast-110 invert-[0.88] hue-rotate-180"
      />
      <div className="absolute bottom-3 right-3 z-10 bg-[#060b19]/90 border border-slate-700/80 rounded-xl px-3 py-2 text-[11px] text-slate-300 flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
          حرج
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
          تم التوجيه
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
          تمت المعالجة
        </span>
      </div>
    </div>
  );
}