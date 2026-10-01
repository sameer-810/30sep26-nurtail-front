import "leaflet/dist/leaflet.css";
import { Circle, CircleMarker, MapContainer, TileLayer, Tooltip } from "react-leaflet";
import type { ReportType } from "../api/reportApi";
import { TYPE_COLOUR, TYPE_LABEL } from "../constants";

export type MapPoint = {
  id: string;
  type: ReportType;
  lat?: number;
  lng?: number;
  label: string;
  approximate?: boolean;
};

/**
 * Reports on a map, drawn as ~1 km circles rather than pins — the map shows an
 * area, never a doorstep. Markers carry a text tooltip so type isn't conveyed
 * by colour alone. The list beside it is the accessible primary view.
 */
export function ReportMap({
  points,
  onSelect,
  height = 420,
}: {
  points: MapPoint[];
  onSelect?: (id: string) => void;
  height?: number;
}) {
  const located = points.filter((p) => typeof p.lat === "number" && typeof p.lng === "number");
  const center: [number, number] = located.length
    ? [located[0].lat!, located[0].lng!]
    : [51.4545, -2.5879];
  return (
    <div
      className="overflow-hidden rounded-lg border border-border"
      style={{ height }}
      aria-label="Map of reports (approximate areas)"
      role="region"
    >
      <MapContainer
        center={center}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {located.map((p) => (
          <Circle
            key={`area-${p.id}`}
            center={[p.lat!, p.lng!]}
            radius={p.approximate === false ? 150 : 700}
            pathOptions={{ color: TYPE_COLOUR[p.type], weight: 1, fillOpacity: 0.12 }}
          />
        ))}
        {located.map((p) => (
          <CircleMarker
            key={p.id}
            center={[p.lat!, p.lng!]}
            radius={8}
            pathOptions={{
              color: "#fff",
              weight: 2,
              fillColor: TYPE_COLOUR[p.type],
              fillOpacity: 1,
            }}
            eventHandlers={{ click: () => onSelect?.(p.id) }}
          >
            <Tooltip>
              {TYPE_LABEL[p.type]}: {p.label}
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
