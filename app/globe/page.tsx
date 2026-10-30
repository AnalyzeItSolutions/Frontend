'use client';

import { Suspense, useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useWarmAgent } from '../lib/useWarmAgent';
import { AppShell } from '../Components/app/AppShell';
import { useTheme } from '../Components/ui/ThemeProvider';
import { GlobeAsk } from '../Components/globe/GlobeAsk';
import { GlobeCanvas } from '../Components/globe/GlobeCanvas';
import { QueuedFlyToast } from '../Components/globe/QueuedFlyToast';
import { TimeControls } from '../Components/globe/TimeControls';
import { globeStage } from '../Components/globe/globeVisual.mjs';
import { cursorFor, activityBuckets, peakEvent } from '../Components/globe/timeline.mjs';
import { windowBounds } from '../Components/globe/scene.mjs';
import { useGlobe } from '../Components/globe/useGlobe';
import { Legend } from './_parts/Legend';
import { LayerList } from './_parts/LayerList';
import { PlacePanel } from './_parts/PlacePanel';
import { SearchControls } from './_parts/SearchControls';
import { SidePanelBody } from './_parts/SidePanelBody';
import { useGlobePlaces } from './_parts/useGlobePlaces';
import { useGlobeLayers } from './_parts/useGlobeLayers';
import { useGlobeRasters } from './_parts/useGlobeRasters';
import { useGlobeScene } from './_parts/useGlobeScene';
import { useGlobeTime } from './_parts/useGlobeTime';
import { LAYERS } from './_parts/layers';
import { useRails } from './_parts/useRails';
import { useReplayOverlay } from './_parts/useReplayOverlay';

function GlobePageInner() {
  useWarmAgent(); // Ask the globe uses the agent: wake it while the globe loads
  const { theme } = useTheme();
  const stage = globeStage({ variant: 'full', appTheme: theme === 'dark' ? 'dark' : 'light' });
  const { mapReady, setActiveHub, setRotateHold } = useGlobe();
  const requestedProject = useSearchParams().get('project') || '';

  const rails = useRails();
  const time = useGlobeTime();
  const data = useGlobeLayers(time.days, requestedProject);
  const places = useGlobePlaces();
  const { replayCounts, shown } = useReplayOverlay(data.rawPoints, time.cursor, time.days, time.trail);
  useGlobeRasters(data.layers.radar, data.layers.clouds, data.fieldEvents);
  const { shared, shareScene } = useGlobeScene({
    layers: data.layers,
    setLayers: data.setLayers,
    days: time.days,
    cursor: time.cursor,
    trail: time.trail,
    restoreTime: time.restore,
    selected: places.selected,
    compare: places.compare,
  });

  // Rotation is scenery for an idle globe: it holds still for a selected place, a place loading, or a timeline in use.
  const holdRotation = Boolean(places.selected || places.selectedEvent || places.loading || time.playing || time.cursor < 1);
  useEffect(() => {
    setRotateHold(holdRotation);
    return () => setRotateHold(false);
  }, [holdRotation, setRotateHold]);

  const activity = useMemo(
    () => activityBuckets(data.rawPoints, windowBounds(time.days), time.buckets),
    [data.rawPoints, time.days, time.buckets],
  );
  const layerColors = useMemo(() => Object.fromEntries(LAYERS.map((l) => [l.id, l.color])), []);
  const peak = useMemo(() => peakEvent(data.rawPoints), [data.rawPoints]);
  const jumpToPeak = useCallback(() => {
    if (!peak) return;
    time.setPlaying(false);
    time.setCursor(Math.min(1, cursorFor(peak.time, windowBounds(time.days)) + 0.004)); // just after it, so it is on screen
    places.goTo(peak.point.lat, peak.point.lon, { name: peak.point.label, zoom: 5 });
  }, [peak, time, places]);

  return (
    <AppShell active="globe" flush feedback="compact">
      <div
        className="grid w-full min-h-0 flex-1 overflow-hidden bg-[var(--bg)]"
        style={{
          minHeight: 'calc(100dvh - var(--nav-h, 56px))',
          gridTemplateColumns: `${rails.leftRail}px 8px minmax(0, 1fr) 8px ${rails.rightRail}px`,
        }}
      >
        <aside className="flex min-w-0 flex-col overflow-y-auto overflow-x-hidden border-r border-[var(--border)] bg-[var(--surface)]">
          <SearchControls
            query={places.query}
            onQuery={places.setQuery}
            hits={places.hits}
            searching={places.searching}
            onPick={places.pickHit}
            onClear={() => {
              places.setQuery('');
              places.setHits([]);
            }}
            selected={places.selected}
            onResetRails={rails.reset}
          />
          <LayerList
            layers={data.layers}
            onToggle={data.toggleLayer}
            layerCounts={data.layerCounts}
            layerHealth={data.layerHealth}
            replayCounts={replayCounts}
            loading={data.layersLoading}
          />
          <TimeControls
            days={time.days}
            onDays={time.setDays}
            cursor={time.cursor}
            playing={time.playing}
            onPlay={time.setPlaying}
            onScrub={time.scrubTo}
            onStep={time.step}
            speed={time.speed}
            onSpeed={time.cycleSpeed}
            loop={time.loop}
            onLoop={time.setLoop}
            capped={data.cappedLayers}
            trail={time.trail}
            onTrail={time.setTrail}
            activity={activity}
            layerColors={layerColors}
            shown={shown}
            total={data.rawPoints.length}
            onPeak={peak ? jumpToPeak : null}
            shared={shared}
            onShare={() => void shareScene()}
          />
          <div className="shrink-0 p-3 pb-14">
            <SidePanelBody
              query={places.query}
              hits={places.hits}
              searching={places.searching}
              onPick={places.pickHit}
              onHub={(hub) => places.goTo(hub.lat, hub.lon, { name: hub.name, zoom: 5.5, hub: hub.name })}
              compare={places.compare}
              onRemoveCompare={(id) => places.setCompare((prev) => prev.filter((x) => x.id !== id))}
              showCatalog={data.layers.catalog}
            />
          </div>
        </aside>

        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize search panel"
          tabIndex={0}
          onPointerDown={(e) => rails.startResize('left', e)}
          onDoubleClick={() => rails.setLeftRail(280)}
          className="z-10 cursor-col-resize bg-[var(--border)] transition-colors hover:bg-brand-hover"
        />

        <section className={`${stage.pageClass} relative min-w-0`}>
          <div className="absolute inset-0">
            <GlobeCanvas variant="full" />
          </div>
          <QueuedFlyToast />
          <Legend layers={data.layers} layerCounts={data.layerCounts} layerHealth={data.layerHealth} loading={data.layersLoading} />
          {!mapReady ? (
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-1 overflow-hidden bg-[var(--surface)]/40">
              <div className="h-full w-1/3 animate-pulse bg-brand/70" />
            </div>
          ) : null}
        </section>

        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize place panel"
          tabIndex={0}
          onPointerDown={(e) => rails.startResize('right', e)}
          onDoubleClick={() => rails.setRightRail(360)}
          className="z-10 cursor-col-resize bg-[var(--border)] transition-colors hover:bg-brand-hover"
        />

        <aside className="flex min-w-0 flex-col overflow-hidden border-l border-[var(--border)] bg-[var(--surface)]">
          <PlacePanel
            selected={places.selected}
            selectedEvent={places.selectedEvent}
            context={places.context}
            loading={places.loading}
            error={places.error}
            compare={places.compare}
            inCompare={places.inCompare}
            onRetry={
              places.selected
                ? () => void places.loadContext(places.selected!.lat, places.selected!.lon, { name: places.selected!.name, country: places.selected!.country })
                : undefined
            }
            onClose={places.clearSelection}
            onCloseEvent={() => {
              places.setSelectedEvent(null);
              places.setSelected(null);
              setActiveHub(null);
            }}
            onToggleCompare={places.toggleCompare}
            onAsk={places.askAboutPlace}
            onAskCompare={places.askCompare}
          />
          <GlobeAsk
            state={{
              selected: places.selected,
              selectedIsEvent: Boolean(places.selectedEvent),
              compare: places.compare,
              layers: data.layers,
              layerCounts: data.layerCounts,
              days: time.days,
            }}
            projectId={data.projectId || requestedProject || undefined}
            onFly={(p) => places.goTo(p.lat, p.lon, { name: p.name })}
          />
        </aside>
      </div>
    </AppShell>
  );
}

export default function GlobePage() {
  // useSearchParams (project scope for "My data") needs a Suspense boundary at build time.
  return (
    <>
      <h1 className="sr-only">Globe</h1>
      <Suspense fallback={null}>
        <GlobePageInner />
      </Suspense>
    </>
  );
}
