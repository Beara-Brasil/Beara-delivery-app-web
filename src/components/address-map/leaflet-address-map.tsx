"use client";

import { useEffect, useRef } from "react";

import type {
  LatLngBoundsExpression,
  LeafletEventHandlerFnMap,
  Map as LeafletMap,
  Marker as LeafletMarker,
} from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";

import {
  defaultMarkerIcon,
  OSM_ATTRIBUTION,
  OSM_MAX_ZOOM,
  OSM_TILE_URL,
} from "@/lib/leaflet-setup";
import { NEIGHBORHOOD_ZOOM } from "@/hooks/use-address-pin";
import {
  BRAZIL_BOUNDS,
  boundsKey,
  type MapBounds,
  type MapStage,
} from "@/lib/map-area";
import { Coords } from "@/types/restaurant";

import type { AddressMapProps } from "./index";

/**
 * Centro usado só para exibição enquanto não há coordenada nenhuma (meio do
 * país, bem afastado). Ele nunca vai para o formulário: o mapa antigo
 * empurrava esse valor no mount, e quem negasse a geolocalização tinha o
 * endereço salvo em Brasília sem perceber.
 */
const FALLBACK_CENTER: Coords = { lat: -15.7942, lng: -47.8822 };
const FALLBACK_ZOOM = 4;
const PINNED_ZOOM = 16;

/** Zoom mínimo ao entrar na etapa livre: o nível do bairro. */
const FREE_MIN_ENTRY_ZOOM = NEIGHBORHOOD_ZOOM;

function toLatLngBounds(bounds: MapBounds): LatLngBoundsExpression {
  return [
    [bounds.south, bounds.west],
    [bounds.north, bounds.east],
  ];
}

/** Liga ou desliga tudo o que mexe na câmera. O clique no mapa fica sempre. */
function setCameraLocked(map: LeafletMap, locked: boolean) {
  const handlers = [
    map.dragging,
    map.touchZoom,
    map.doubleClickZoom,
    map.boxZoom,
    map.keyboard,
  ];
  for (const handler of handlers) {
    if (!handler) continue;
    if (locked) handler.disable();
    else handler.enable();
  }
}

/** Container sem tamanho (teste, aba escondida): o Leaflet não enquadra. */
function hasSize(map: LeafletMap) {
  const size = map.getSize();
  return size.x > 0 && size.y > 0;
}

/**
 * Câmera por etapa (LDMF-542, ver `docs/mapa-do-endereco.md`):
 *
 * - etapas travadas (`country`, `state`, `city`): enquadra `viewBounds` e
 *   desliga arrasto e zoom. O clique continua: marcar um ponto já pula para
 *   a etapa livre;
 * - etapa livre (`free`): arrasto e zoom ligados, presos a `limitBounds`
 *   (a cidade com folga). Aproxima à vontade; afasta só até ver a cidade.
 *
 * Na etapa livre o mapa recentraliza a cada novo posicionamento do pino
 * (coordenada nova ou `recenterKey` novo) e, fora disso, é do cliente.
 */
function CameraController({
  value,
  zoom,
  recenterKey,
  stage,
  viewBounds,
  limitBounds,
}: {
  value: Coords | null;
  zoom?: number;
  recenterKey?: number;
  stage: MapStage;
  viewBounds?: MapBounds;
  limitBounds?: MapBounds | null;
}) {
  const map = useMap();
  const free = stage === "free";
  const viewKey = boundsKey(viewBounds);
  const limitKey = boundsKey(limitBounds);

  // Os retângulos chegam como objetos novos a cada render: o efeito depende
  // da chave e lê o valor atual pelo ref.
  const viewRef = useRef(viewBounds);
  viewRef.current = viewBounds;
  const limitRef = useRef(limitBounds);
  limitRef.current = limitBounds;

  // O zoom só vale junto com o posicionamento que o trouxe.
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const wasFree = useRef(free);

  // Etapas travadas: enquadra e trava.
  useEffect(() => {
    if (free) return;
    setCameraLocked(map, true);
    map.setMaxBounds(null as unknown as LatLngBoundsExpression);
    map.setMinZoom(0);
    const bounds = viewRef.current ?? BRAZIL_BOUNDS;
    if (hasSize(map)) map.fitBounds(toLatLngBounds(bounds));
  }, [map, free, viewKey]);

  // Etapa livre: solta a câmera dentro da cidade com folga.
  useEffect(() => {
    if (!free) return;
    setCameraLocked(map, false);
    const limit = limitRef.current;
    if (!limit) {
      map.setMaxBounds(null as unknown as LatLngBoundsExpression);
      map.setMinZoom(0);
      return;
    }
    const bounds = toLatLngBounds(limit);
    map.options.maxBoundsViscosity = 1;
    map.setMaxBounds(bounds);
    // Afastar trava na vista da cidade inteira.
    if (hasSize(map)) map.setMinZoom(map.getBoundsZoom(bounds));
  }, [map, free, limitKey]);

  const lat = value?.lat;
  const lng = value?.lng;

  // Etapa livre: acompanha o pino.
  const hadPin = useRef(value !== null);
  useEffect(() => {
    const hasPin = lat !== undefined && lng !== undefined;
    // Entrar na etapa livre ou o pino aparecer pela primeira vez.
    const entering = free && (!wasFree.current || !hadPin.current);
    wasFree.current = free;
    hadPin.current = hasPin;
    if (!free || !hasPin) return;

    // Entrando agora (clique no Brasil ou no estado, bairro escolhido): vai
    // direto ao nível do bairro. Já livre: mantém o zoom do cliente, a não
    // ser que o posicionamento peça outro.
    const current = map.getZoom();
    const nextZoom =
      zoomRef.current ??
      (entering ? Math.max(current, FREE_MIN_ENTRY_ZOOM) : current);

    map.setView([lat!, lng!], nextZoom);
  }, [map, free, lat, lng, recenterKey]);

  return null;
}

/** Toque/clique no mapa move o pino para o ponto tocado. */
function ClickToSelect({ onSelect }: { onSelect: (coords: Coords) => void }) {
  useMapEvents({
    click: (e) => onSelect({ lat: e.latlng.lat, lng: e.latlng.lng }),
  });

  return null;
}

function DraggablePin({
  value,
  onSelect,
}: {
  value: Coords;
  onSelect: (coords: Coords) => void;
}) {
  const markerRef = useRef<LeafletMarker>(null);

  // `onSelect` costuma ser uma arrow nova a cada render do formulário. O ref
  // evita recriar os handlers do marcador por causa disso.
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const eventHandlers = useRef<LeafletEventHandlerFnMap>({
    dragend: () => {
      const position = markerRef.current?.getLatLng();

      if (!position) return;

      onSelectRef.current({ lat: position.lat, lng: position.lng });
    },
  }).current;

  return (
    <Marker
      ref={markerRef}
      position={[value.lat, value.lng]}
      icon={defaultMarkerIcon}
      draggable
      autoPan
      eventHandlers={eventHandlers}
    />
  );
}

export default function LeafletAddressMap({
  value,
  onSelect,
  mapHeight = 400,
  zoom,
  recenterKey,
  // Sem etapa (uso antigo): câmera livre e sem limite.
  stage = "free",
  viewBounds,
  limitBounds,
}: AddressMapProps) {
  const initial = value ?? FALLBACK_CENTER;

  return (
    // `isolate` segura os z-index internos do Leaflet (até 1000) dentro do
    // mapa, para ele não passar por cima de header, modal e sheet.
    <div
      className="isolate overflow-hidden rounded-lg"
      style={{ height: `${mapHeight}px` }}
    >
      <MapContainer
        center={[initial.lat, initial.lng]}
        zoom={value ? (zoom ?? PINNED_ZOOM) : FALLBACK_ZOOM}
        // Rolagem da página não deve virar zoom no mapa (o formulário rola).
        scrollWheelZoom={false}
        // Botões + e − ocultos (LDMF-542): a câmera segue as etapas e, na
        // livre, o zoom é por gesto. Para voltar, troque para `true`.
        zoomControl={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url={OSM_TILE_URL}
          attribution={OSM_ATTRIBUTION}
          maxZoom={OSM_MAX_ZOOM}
        />
        <CameraController
          value={value}
          zoom={zoom}
          recenterKey={recenterKey}
          stage={stage}
          viewBounds={viewBounds}
          limitBounds={limitBounds}
        />
        <ClickToSelect onSelect={onSelect} />
        {value && <DraggablePin value={value} onSelect={onSelect} />}
      </MapContainer>
    </div>
  );
}
