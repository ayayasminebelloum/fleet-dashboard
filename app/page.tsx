"use client";

import React, { useState, useEffect } from "react";

/* ---------------------------------------------------------
   TYPES
--------------------------------------------------------- */

type VesselStatus = "healthy" | "watch" | "critical";

type Vessel = {
  id: string;
  name: string;
  imo?: string;
  health: number; // 0–1
  status: VesselStatus;
  lastUpdate: string | null;
  location?: string;
  latitude?: number;
  longitude?: number;
};

type DownloadCategory = "raw" | "stats" | "models" | "anomalies";

type Screen =
  | "login"
  | "fleet"
  | "vessel"
  | "models"
  | "analytics"
  | "download"
  | "exploration"
  | "stats"
  | "correlation"
  | "outliers";

/* ---------------------------------------------------------
   MOCK VESSELS (25)
--------------------------------------------------------- */

const MOCK_VESSELS: Vessel[] = Array.from({ length: 25 }).map((_, i) => {
  const health = Math.random();
  const status: VesselStatus =
    health > 0.7 ? "healthy" : health > 0.4 ? "watch" : "critical";

  return {
    id: String(i + 1),
    name: `VESSEL ${i + 1}`,
    imo: `10000${i}`,
    health,
    status,
    lastUpdate: "2025-11-24 10:00",
    location: `${(Math.random() * 120 - 60).toFixed(1)}N, ${(Math.random() * 360 - 180).toFixed(1)}E`,
  };
});

const statusLabel: Record<VesselStatus, string> = {
  healthy: "Healthy",
  watch: "Under Watch",
  critical: "Critical",
};

function statusColor(status: VesselStatus) {
  switch (status) {
    case "healthy":
      return "bg-emerald-100 text-emerald-700 border-emerald-300";
    case "watch":
      return "bg-amber-100 text-amber-700 border-amber-300";
    case "critical":
      return "bg-rose-100 text-rose-700 border-rose-300";
  }
}

/* ---------------------------------------------------------
   LOGIN SCREEN
--------------------------------------------------------- */

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState("");
  const [pass, setPass] = useState("");

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-50">
      <div className="w-full max-w-xs rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
        <h1 className="text-lg font-semibold text-center">
          Fleet Sensor Health
        </h1>
        <p className="text-xs text-center text-slate-400 mb-3">
          Log in to access your fleet
        </p>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full rounded-md bg-slate-800 text-xs px-3 py-2 border border-slate-700"
        />

        <input
          type="password"
          placeholder="Password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          className="w-full rounded-md bg-slate-800 text-xs px-3 py-2 border border-slate-700"
        />

        <button
          onClick={onLogin}
          className="w-full rounded-md bg-sky-600 hover:bg-sky-500 py-2 text-sm font-medium"
        >
          Login
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   MAIN APP
--------------------------------------------------------- */

export default function HomePage() {
  const [screen, setScreen] = useState<Screen>("login");
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Vessel | null>(null);
  const [filter, setFilter] = useState<"all" | VesselStatus>("all");
  const [search, setSearch] = useState("");

  // Fetch vessels from API
  useEffect(() => {
    const fetchVessels = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/vessels');
        if (!response.ok) throw new Error('Failed to fetch vessels');
        const data = await response.json();
        
        // Transform API data to match Vessel type
        const transformedVessels: Vessel[] = data.map((v: any) => {
          const health = v.health || 0;
          const status: VesselStatus = 
            health > 0.7 ? "healthy" : 
            health > 0.4 ? "watch" : "critical";
          
          return {
            id: v.id,
            name: v.name,
            imo: `IMO${v.id}`, // Generate IMO since not in API
            health,
            status,
            lastUpdate: v.lastUpdate,
            location: v.latitude && v.longitude ? 
              `${v.latitude.toFixed(2)}, ${v.longitude.toFixed(2)}` : undefined,
            latitude: v.latitude,
            longitude: v.longitude
          };
        });
        
        setVessels(transformedVessels);
        if (transformedVessels.length > 0) {
          setSelected(transformedVessels[0]);
        }
      } catch (error) {
        console.error('Error fetching vessels:', error);
        // No fallback - show error or empty state
        setVessels([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVessels();
  }, []);

  const total = vessels.length;
  const healthy = vessels.filter((v) => v.status === "healthy").length;
  const watch = vessels.filter((v) => v.status === "watch").length;
  const critical = vessels.filter((v) => v.status === "critical").length;

  const filtered = vessels.filter((v) => {
    const matchFilter = filter === "all" ? true : v.status === filter;
    const matchSearch =
      search.trim().length === 0
        ? true
        : v.name.toLowerCase().includes(search.toLowerCase()) ||
          (v.imo && v.imo.includes(search));
    return matchFilter && matchSearch;
  });

  const handleSelectVessel = (v: Vessel) => {
    setSelected(v);
    setScreen("vessel");
  };

  const handleSelectByName = (label: string) => {
    const v =
      vessels.find((vv) =>
        vv.name.toLowerCase().includes(label.toLowerCase())
      ) || (vessels.length > 0 ? vessels[0] : null);
    if (v) handleSelectVessel(v);
  };

  /* ---------------------- LOGIN GATE ---------------------- */

  if (screen === "login") {
    return <LoginScreen onLogin={() => setScreen("fleet")} />;
  }

  /* ---------------------- MAIN LAYOUT --------------------- */

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      {/* TOP BAR */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              Fleet Sensor Health
            </h1>
            <p className="text-xs text-slate-400">
              Real-time reliability of vessel sensors
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400">
            <nav className="flex gap-2">
              <TopNavButton
                label="Fleet Overview"
                active={screen === "fleet" || screen === "vessel"}
                onClick={() => setScreen("fleet")}
              />
              <TopNavButton
                label="Models & Evaluation"
                active={screen === "models"}
                onClick={() => setScreen("models")}
              />
              <TopNavButton
                label="Analytics"
                active={
                  screen === "analytics" ||
                  screen === "exploration" ||
                  screen === "stats" ||
                  screen === "correlation" ||
                  screen === "outliers"
                }
                onClick={() => setScreen("analytics")}
              />
              <TopNavButton
                label="Download Center"
                active={screen === "download"}
                onClick={() => setScreen("download")}
              />
            </nav>
            <span>Last updated: 2025-11-24 10:00 UTC</span>
            <div className="h-8 w-8 rounded-full bg-slate-800" />
          </div>
        </div>
      </header>

      {/* ROUTING + CONTENT */}
      <div className="mx-auto max-w-6xl px-4 py-4 space-y-4">
        {/* KPI strip on fleet + vessel */}
        {(screen === "fleet" || screen === "vessel") && (
          <section className="grid gap-3 sm:grid-cols-4">
            <KpiCard label="Total Vessels" value={total.toString()} />
            <KpiCard label="Healthy" value={healthy.toString()} tone="good" />
            <KpiCard label="Under Watch" value={watch.toString()} tone="warn" />
            <KpiCard label="Critical" value={critical.toString()} tone="bad" />
          </section>
        )}

        {/* FLEET */}
        {screen === "fleet" && (
          <>
            {loading && (
              <div className="flex justify-center py-8">
                <div className="text-slate-400">Loading vessels...</div>
              </div>
            )}
            {!loading && (
              <FleetOverview
                vessels={vessels}
                filtered={filtered}
                filter={filter}
                setFilter={setFilter}
                search={search}
                setSearch={setSearch}
                selected={selected}
                onOpenVessel={handleSelectVessel}
                onMarkerClick={handleSelectByName}
              />
            )}
          </>
        )}

        {/* VESSEL DETAIL */}
        {screen === "vessel" && selected && (
          <VesselDetailScreen
            vessel={selected}
            onBackToFleet={() => setScreen("fleet")}
          />
        )}

        {/* MODELS */}
        {screen === "models" && (
          <ModelEvaluationScreen onBackToFleet={() => setScreen("fleet")} />
        )}

        {/* ANALYTICS HUB */}
        {screen === "analytics" && (
          <AnalyticsHubScreen
            onSelect={(target) => setScreen(target)}
          />
        )}

        {/* ANALYTICS SUBPAGES */}
        {screen === "exploration" && (
          <DataExplorationScreen onBack={() => setScreen("analytics")} />
        )}
        {screen === "stats" && (
          <StatisticalDiagnosticsScreen onBack={() => setScreen("analytics")} />
        )}
        {screen === "correlation" && (
          <CorrelationAnalysisScreen onBack={() => setScreen("analytics")} />
        )}
        {screen === "outliers" && (
          <OutlierVerificationScreen onBack={() => setScreen("analytics")} />
        )}

        {/* DOWNLOAD CENTER */}
        {screen === "download" && (
          <DownloadDataScreen vessels={vessels} onBack={() => setScreen("fleet")} />
        )}
      </div>
    </main>
  );
}

/* ---------------------------------------------------------
   FLEET OVERVIEW
--------------------------------------------------------- */

function FleetOverview({
  vessels,
  filtered,
  filter,
  setFilter,
  search,
  setSearch,
  selected,
  onOpenVessel,
  onMarkerClick,
}: {
  vessels: Vessel[];
  filtered: Vessel[];
  filter: "all" | VesselStatus;
  setFilter: (f: "all" | VesselStatus) => void;
  search: string;
  setSearch: (s: string) => void;
  selected: Vessel | null;
  onOpenVessel: (v: Vessel) => void;
  onMarkerClick: (label: string) => void;
}) {
  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      {/* LEFT: LIST */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 flex flex-col">
        <div className="mb-3">
          <h2 className="text-sm font-semibold">Vessels</h2>
          <p className="text-xs text-slate-400">
            Select a vessel to inspect sensor health
          </p>
        </div>

        {/* Search + filters */}
        <div className="mb-3 flex flex-col gap-2">
          <input
            type="text"
            placeholder="Search vessel or IMO…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-full border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />

          <div className="flex flex-wrap gap-2 text-xs">
            <FilterChip
              label="All"
              active={filter === "all"}
              onClick={() => setFilter("all")}
            />
            <FilterChip
              label="Healthy"
              active={filter === "healthy"}
              onClick={() => setFilter("healthy")}
            />
            <FilterChip
              label="Under Watch"
              active={filter === "watch"}
              onClick={() => setFilter("watch")}
            />
            <FilterChip
              label="Critical"
              active={filter === "critical"}
              onClick={() => setFilter("critical")}
            />
          </div>
        </div>

        {/* list */}
        <div className="flex-1 space-y-2 overflow-auto">
          {filtered.map((v) => (
            <button
              key={v.id}
              onClick={() => onOpenVessel(v)}
              className={`w-full rounded-xl border px-3 py-2 text-left text-xs transition 
                ${
                  selected?.id === v.id
                    ? "border-sky-400 bg-sky-500/10"
                    : "border-slate-800 bg-slate-900 hover:border-slate-600"
                }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{v.name}</p>
                  <p className="text-[10px] text-slate-400">IMO {v.imo}</p>
                  {v.location && (
                    <p className="text-[10px] text-slate-500">Pos: {v.location}</p>
                  )}
                </div>
                <div className="text-right">
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusColor(
                      v.status
                    )}`}
                  >
                    {statusLabel[v.status]} · {(v.health * 100).toFixed(0)}%
                  </span>
                  <p className="mt-1 text-[10px] text-slate-500">
                    Last: {v.lastUpdate}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT: MAP + PREVIEW */}
      <div className="space-y-4">
        {/* MAP */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
          <div className="mb-2">
            <h2 className="text-sm font-semibold">Fleet Map</h2>
            <p className="text-xs text-slate-400">
              Tap a marker to open vessel details
            </p>
          </div>

          <div className="relative h-56 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 overflow-hidden">
            <div className="pointer-events-none absolute inset-6 rounded-2xl border border-slate-700/60" />
            {vessels.map((v, i) => (
              <Marker
                key={v.id}
                x={`${(i * 11) % 80 + 10}%`}
                y={`${((i * 23) % 55) + 10}%`}
                status={v.status}
                label={v.name}
                onClick={() => onMarkerClick(v.name)}
              />
            ))}
          </div>
        </div>

        {/* VESSEL PREVIEW */}
        {selected && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
            <h2 className="text-sm font-semibold">
              {selected.name} – Hybrid Health
            </h2>
            <p className="text-xs text-slate-400 mb-3">
              Quick view of drift, anomalies and hybrid score.
            </p>

            <div className="grid gap-3 sm:grid-cols-3 text-xs">
              <MiniMetric
                label="Hybrid Health"
                value={`${(selected.health * 100).toFixed(0)}%`}
              />
              <MiniMetric
                label="Drift Level"
                value={
                  selected.status === "critical"
                    ? "High"
                    : selected.status === "watch"
                    ? "Medium"
                    : "Low"
                }
              />
              <MiniMetric
                label="Anomalies (24h)"
                value={
                  selected.status === "critical"
                    ? "12"
                    : selected.status === "watch"
                    ? "5"
                    : "1"
                }
              />
            </div>

            <div className="mt-4 h-28 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2">
              <p className="mb-1 text-[11px] text-slate-400">
                Hybrid Health Score (mock time-series)
              </p>
              <div className="h-full w-full rounded-lg bg-slate-900" />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------
   VESSEL DETAIL SCREEN
--------------------------------------------------------- */

type SensorTab = "overview" | "pressure" | "volume" | "temperature" | "custom";

function VesselDetailScreen({
  vessel,
  onBackToFleet,
}: {
  vessel: Vessel;
  onBackToFleet: () => void;
}) {
  const healthPercent = Math.round(vessel.health * 100);
  const [tab, setTab] = useState<SensorTab>("overview");
  const [showAE, setShowAE] = useState(true);
  const [showGRU, setShowGRU] = useState(true);
  const [showHybrid, setShowHybrid] = useState(true);

  const missingData = vessel.status === "critical" ? "5.8%" : "2.7%";
  const anomalies24h = vessel.status === "critical" ? "18" : "7";
  const driftLevel =
    vessel.status === "critical"
      ? "High"
      : vessel.status === "watch"
      ? "Medium"
      : "Low";
  const stationarity =
    vessel.status === "healthy" ? "Stable" : "Non-stationary";

  return (
    <section className="space-y-4">
      {/* BREADCRUMB */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-slate-400">
          <button
            className="text-slate-300 hover:text-sky-300"
            onClick={onBackToFleet}
          >
            Fleet
          </button>
          <span>/</span>
          <span>{vessel.name}</span>
          <span>/</span>
          <span className="text-slate-500">Sensor Health</span>
        </div>

        <button
          onClick={onBackToFleet}
          className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-[11px] hover:border-sky-500"
        >
          ← Back to Fleet
        </button>
      </div>

      {/* HEADER GRID */}
      <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] items-stretch">
        {/* LEFT — VESSEL INFO */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-xs space-y-2">
          <p className="text-[11px] text-slate-400">Vessel</p>
          <h2 className="text-lg font-semibold">{vessel.name} – Sensor Health</h2>
          <p className="text-[11px] text-slate-400">IMO {vessel.imo}</p>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <MiniMetric label="Position" value={vessel.location || "N/A"} />
            <MiniMetric label="Last update" value={vessel.lastUpdate || "N/A"} />
          </div>

          <p className="mt-2 text-[11px] text-slate-500">
            This view aggregates drift, anomalies and model outputs into a single
            hybrid health score.
          </p>
        </div>

        {/* RIGHT — GAUGE */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 flex flex-col items-center justify-center">
          <p className="text-[11px] text-slate-400 mb-1">
            Overall Hybrid Health
          </p>
          <HealthGauge value={healthPercent} />
          <p className="mt-2 text-xs text-slate-400">
            {healthPercent >= 80
              ? "Sensor ecosystem is healthy; only minor noise detected."
              : healthPercent >= 60
              ? "Some turbulence detected; models are monitoring."
              : "High turbulence; sensors require attention."}
          </p>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid gap-3 sm:grid-cols-4 text-xs">
        <MiniMetric label="Drift Level" value={driftLevel} />
        <MiniMetric label="% Missing Data" value={missingData} />
        <MiniMetric label="Anomalies (24h)" value={anomalies24h} />
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2">
          <p className="text-[10px] text-slate-400">Top Risk Sensors</p>
          <ul className="mt-1 list-disc pl-4 text-[11px]">
            <li>CT1.1 - Compression Temperature 1.1</li>
            <li>CT1.2 - Compression Temperature 1.2</li>
            <li>CT1.3 - Compression Temperature 1.3</li>
            <li>CT2.1 - Compression Temperature 2.1</li>
            <li>PT1.1 - Pressure Transducer 1.1</li>
            <li>PT1.2 - Pressure Transducer 1.2</li>
            <li>FT1.1 - Flow Transducer 1.1</li>
            <li>TT1.1 - Temperature Transducer 1.1</li>
          </ul>
        </div>
      </div>

      {/* TABS + CHART */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2 text-[11px]">
            <TabPill
              label="Overview"
              active={tab === "overview"}
              onClick={() => setTab("overview")}
            />
            <TabPill
              label="Pressure"
              active={tab === "pressure"}
              onClick={() => setTab("pressure")}
            />
            <TabPill
              label="Volume"
              active={tab === "volume"}
              onClick={() => setTab("volume")}
            />
            <TabPill
              label="Temperature"
              active={tab === "temperature"}
              onClick={() => setTab("temperature")}
            />
            <TabPill
              label="Custom"
              active={tab === "custom"}
              onClick={() => setTab("custom")}
            />
          </div>

          {/* toggles */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-300">
            <SeriesToggle
              label="AE Error"
              active={showAE}
              onToggle={() => setShowAE((v) => !v)}
              colorClass="border-sky-400"
            />
            <SeriesToggle
              label="GRU Error"
              active={showGRU}
              onToggle={() => setShowGRU((v) => !v)}
              colorClass="border-amber-400"
            />
            <SeriesToggle
              label="Hybrid Score"
              active={showHybrid}
              onToggle={() => setShowHybrid((v) => !v)}
              colorClass="border-emerald-400"
            />
          </div>
        </div>

        {/* MOCK CHART */}
        <div className="h-56 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 flex flex-col">
          <p className="mb-1 text-[11px] text-slate-400">
            {tab === "overview"
              ? "Aggregated hybrid score with anomaly regions."
              : tab === "custom" 
              ? "Sensor view: custom – time-series with anomaly shading."
              : `Sensor view: ${tab.replace('pressure', 'compression temperatures').replace('temperature', 'temperature sensors').replace('volume', 'flow measurements')} – time-series with anomaly shading.`}
          </p>

          <div className="flex-1 rounded-lg bg-slate-900 relative overflow-hidden">
            {/* Realistic time-series data */}
            <svg className="absolute inset-0 w-full h-full">
              {/* AE Error - realistic sensor noise with spikes in anomaly zones */}
              <path
                d="M0,32 L15,33 L30,31 L45,34 L60,29 L75,31 L90,45 L105,52 L120,48 L135,32 L150,30 L165,33 L180,31 L195,29 L210,31 L225,33 L240,28 L255,30 L270,32 L285,29 L300,35 L315,42 L330,38 L345,31 L360,29 L375,32 L390,30 L400,31"
                stroke="#38bdf8"
                strokeWidth="1.5"
                fill="none"
                opacity="0.8"
              />
              {/* GRU Error - shows clear anomaly patterns */}
              <path
                d="M0,64 L20,66 L40,63 L60,65 L80,68 L100,82 L120,95 L140,88 L160,75 L180,68 L200,66 L220,64 L240,62 L260,65 L280,63 L300,78 L320,85 L340,81 L360,70 L380,66 L400,64"
                stroke="#fbbf24"
                strokeWidth="1.5"
                fill="none"
                opacity="0.8"
              />
              {/* Hybrid Score - drops during anomalies, more stable otherwise */}
              <path
                d="M0,100 L25,102 L50,98 L75,101 L100,85 L125,72 L150,78 L175,95 L200,102 L225,100 L250,98 L275,101 L300,88 L325,82 L350,86 L375,98 L400,100"
                stroke="#10b981"
                strokeWidth="2"
                fill="none"
                opacity="0.9"
              />
            </svg>

            {/* More realistic anomaly zones with varied widths */}
            <div className="absolute left-[22%] top-0 h-full w-[18%] bg-rose-500/10 border-x border-rose-500/30" />
            <div className="absolute left-[72%] top-0 h-full w-[12%] bg-rose-500/10 border-x border-rose-500/30" />
            <span className="absolute left-[22%] top-1 text-[10px] text-rose-300">
              Anomaly zone
            </span>
          </div>

          {/* legend */}
          <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-slate-300">
            <LegendDot label="AE Error" colorClass="bg-sky-400" />
            <LegendDot label="GRU Error" colorClass="bg-amber-400" />
            <LegendDot label="Hybrid Score" colorClass="bg-emerald-400" />
            <LegendDot label="Anomaly zone" colorClass="bg-rose-400" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------
   MODELS & EVALUATION SCREEN
--------------------------------------------------------- */

function ModelEvaluationScreen({
  onBackToFleet,
}: {
  onBackToFleet: () => void;
}) {
  return (
    <section className="space-y-4">
      {/* breadcrumb */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-slate-400">
          <button
            className="text-slate-300 hover:text-sky-300"
            onClick={onBackToFleet}
          >
            Fleet
          </button>
          <span>/</span>
          <span className="text-slate-500">Models & Evaluation</span>
        </div>
        <span className="text-[11px] text-slate-500">
          For ML-curious humans and friendly robots.
        </span>
      </div>

      {/* model summary cards */}
      <div className="grid gap-3 md:grid-cols-3 text-xs">
        <ModelKpiCard
          title="Autoencoder"
          subtitle="Baseline reconstruction"
          description="Learns 'normal' patterns. Great at spotting when a sensor starts dancing out of rhythm."
        />
        <ModelKpiCard
          title="GRU Forecaster"
          subtitle="Sequence prediction"
          description="Predicts the next values based on past sequences and flags sudden breaks."
        />
        <ModelKpiCard
          title="Hybrid Score"
          subtitle="Combined signal"
          description="Balances AE + GRU for a stable, interpretable overall sensor health score."
        />
      </div>

      {/* charts */}
      <div className="grid gap-3 lg:grid-cols-3">
        <FakeChartBlock
          title="AE Reconstruction Error"
          caption="Spikes represent deviation from the learned baseline behaviour."
        />
        <FakeChartBlock
          title="GRU Forecast Error"
          caption="Highlights where short-term predictions diverged from real observations."
        />
        <FakeChartBlock
          title="Hybrid Health Score"
          caption="Smooth curve mixing AE & GRU signals into one reliable indicator."
        />
      </div>

      {/* table + summary */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-xs">
          <p className="text-[11px] text-slate-400 mb-2">
            Recent Model-Detected Events (mock)
          </p>
          <div className="overflow-auto">
            <table className="min-w-full border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-1 pr-3 text-left font-medium">Time</th>
                  <th className="py-1 pr-3 text-left font-medium">Vessel</th>
                  <th className="py-1 pr-3 text-left font-medium">Sensor</th>
                  <th className="py-1 pr-3 text-left font-medium">Model</th>
                  <th className="py-1 pr-3 text-left font-medium">Severity</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    time: "2025-11-24 09:58",
                    vessel: "VESSEL 3",
                    sensor: "CT1.1 - Compression Temp",
                    model: "AE + GRU",
                    severity: "High",
                  },
                  {
                    time: "2025-11-24 09:41",
                    vessel: "VESSEL 12",
                    sensor: "Volume AFT",
                    model: "Hybrid",
                    severity: "Medium",
                  },
                  {
                    time: "2025-11-24 09:12",
                    vessel: "VESSEL 19",
                    sensor: "Temp Cargo Bay",
                    model: "AE",
                    severity: "Low",
                  },
                ].map((row, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-slate-900/70 last:border-0"
                  >
                    <td className="py-1 pr-3">{row.time}</td>
                    <td className="py-1 pr-3">{row.vessel}</td>
                    <td className="py-1 pr-3">{row.sensor}</td>
                    <td className="py-1 pr-3">{row.model}</td>
                    <td className="py-1 pr-3">
                      <SeverityPill level={row.severity as any} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-xs">
          <p className="text-[11px] text-slate-400 mb-2">Summary</p>
          <h3 className="text-sm font-semibold mb-1">
            What this page tells us
          </h3>
          <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-300">
            <li>Autoencoder & GRU capture different aspects of sensor behaviour.</li>
            <li>High-severity anomalies represent meaningful operational risks.</li>
            <li>The hybrid score provides a calm, stable signal for monitoring.</li>
            <li>This lets operators & data teams speak a shared language.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------
   ANALYTICS HUB SCREEN
--------------------------------------------------------- */

function AnalyticsHubScreen({
  onSelect,
}: {
  onSelect: (screen: Screen) => void;
}) {
  return (
    <section className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-slate-400">
          <span className="text-slate-500">Analytics Hub</span>
        </div>
        <span className="text-[11px] text-slate-500">
          Insights derived from your data science notebooks.
        </span>
      </div>

      {/* Overview */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-sm font-semibold">Analytics Overview</h2>
        <p className="text-xs text-slate-400 mt-1">
          Deep statistical insights, exploratory visualizations, correlation studies,
          outlier detection logs, and automated diagnostics.
        </p>
      </div>

      {/* Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AnalyticsCard
          title="Data Exploration"
          subtitle="Distribution • Trends • Initial Insights"
          description="Overview of sensor distributions, missingness, time decomposition, and baseline exploratory visuals."
          onClick={() => onSelect("exploration")}
        />
        <AnalyticsCard
          title="Statistical Diagnostics"
          subtitle="Stationarity • Drift • Statistical Tests"
          description="ADF tests, KPSS, rolling variance, seasonality metrics, normality checks, and drift signals."
          onClick={() => onSelect("stats")}
        />
        <AnalyticsCard
          title="Correlation Analysis"
          subtitle="Cross-sensor correlation & heatmaps"
          description="Pairwise correlations, lag correlations, PCA basis, and relationship insights across vessels."
          onClick={() => onSelect("correlation")}
        />
        <AnalyticsCard
          title="Outlier Verification"
          subtitle="Model-based + statistical anomalies"
          description="Isolation Forest results, Z-score anomalies, AE/GRU reconstruction errors, and verification outputs."
          onClick={() => onSelect("outliers")}
        />
        <AnalyticsCard
          title="Download Center"
          subtitle="Raw • Stats • Models • Anomalies"
          description="Download data with custom filters: vessel → sensor → date range → columns."
          onClick={() => onSelect("download")}
        />
      </div>
    </section>
  );
}

/* ---------------------------------------------------------
   DOWNLOAD DATA SCREEN
--------------------------------------------------------- */

function DownloadDataScreen({ vessels, onBack }: { vessels: Vessel[]; onBack: () => void }) {
  const [category, setCategory] = useState<DownloadCategory | null>(null);

  // Raw data
  const [rawVessel, setRawVessel] = useState<string | null>(null);
  const [rawSensor, setRawSensor] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const rawColumns = [
    "timestamp",
    "compression_temp",
    "pressure_reading",
    "flow_rate",
    "temperature",
    "status",
    "value",
  ];
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);

  // Stats
  const statsOptions = [
    "ADF Test Results",
    "KPSS Stationarity",
    "Rolling Variance",
    "Z-Score Distribution",
    "Seasonal Decomposition",
    "Normality Tests",
    "Drift Detection Signals",
  ];
  const [selectedStats, setSelectedStats] = useState<string[]>([]);

  // Models
  const modelOptions = [
    "AE Reconstruction Error",
    "GRU Forecast Error",
    "Hybrid Health Score",
  ];
  const [selectedModelData, setSelectedModelData] = useState<string[]>([]);

  // Anomalies
  const anomalyTypes = [
    "Z-Score Outliers",
    "Isolation Forest Flags",
    "AE High Error",
    "GRU High Divergence",
    "Hybrid Low Score",
    "Spikes & Sudden Drops",
  ];
  const [anomalyVessel, setAnomalyVessel] = useState<string | null>(null);
  const [selectedAnomalies, setSelectedAnomalies] = useState<string[]>([]);

  function toggle(
    item: string,
    state: string[],
    setter: (v: string[]) => void
  ) {
    if (state.includes(item)) {
      setter(state.filter((x) => x !== item));
    } else {
      setter([...state, item]);
    }
  }

  function downloadMockCSV(name: string) {
    const content =
      "mock_field_1,mock_field_2\nvalue_1,value_2\nvalue_3,value_4";
    const blob = new Blob([content], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${name}.csv`;
    a.click();
  }

  return (
    <section className="space-y-4">
      {/* breadcrumb */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-slate-400">
          <button
            onClick={onBack}
            className="text-slate-300 hover:text-sky-300"
          >
            Fleet
          </button>
          <span>/</span>
          <span className="text-slate-500">Download Center</span>
        </div>
      </div>

      {/* category selector */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-sm font-semibold">Select Type of Data</h2>
        <div className="grid gap-3 mt-3 md:grid-cols-4">
          <SelectCard
            label="Raw Sensor Data"
            active={category === "raw"}
            onClick={() => setCategory("raw")}
          />
          <SelectCard
            label="Statistical Analysis"
            active={category === "stats"}
            onClick={() => setCategory("stats")}
          />
          <SelectCard
            label="Model Outputs"
            active={category === "models"}
            onClick={() => setCategory("models")}
          />
          <SelectCard
            label="Anomalies"
            active={category === "anomalies"}
            onClick={() => setCategory("anomalies")}
          />
        </div>
      </div>

      {/* flows */}
      {category === "raw" && (
        <RawDataSelector
          vessels={vessels}
          rawVessel={rawVessel}
          setRawVessel={setRawVessel}
          rawSensor={rawSensor}
          setRawSensor={setRawSensor}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          columns={rawColumns}
          selectedColumns={selectedColumns}
          setSelectedColumns={setSelectedColumns}
          onDownload={() => downloadMockCSV("raw_data")}
        />
      )}

      {category === "stats" && (
        <StatsSelector
          options={statsOptions}
          selected={selectedStats}
          toggle={(item: string) =>
            toggle(item, selectedStats, setSelectedStats)
          }
          onSelectAll={() => setSelectedStats([...statsOptions])}
          onDownload={() => downloadMockCSV("statistical_analysis")}
        />
      )}

      {category === "models" && (
        <ModelSelector
          options={modelOptions}
          selected={selectedModelData}
          toggle={(item: string) =>
            toggle(item, selectedModelData, setSelectedModelData)
          }
          onSelectAll={() => setSelectedModelData([...modelOptions])}
          onDownload={() => downloadMockCSV("model_outputs")}
        />
      )}

      {category === "anomalies" && (
        <AnomalySelector
          vessels={vessels}
          anomalyVessel={anomalyVessel}
          setAnomalyVessel={setAnomalyVessel}
          anomalies={anomalyTypes}
          selectedAnomalies={selectedAnomalies}
          setSelectedAnomalies={setSelectedAnomalies}
          onDownload={() => downloadMockCSV("anomalies_log")}
        />
      )}
    </section>
  );
}

/* ---------------------------------------------------------
   DOWNLOAD SUBCOMPONENTS
--------------------------------------------------------- */

function SelectCard({
  label,
  onClick,
  active,
}: {
  label: string;
  onClick: () => void;
  active: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border p-3 text-xs transition 
        ${
          active
            ? "border-sky-400 bg-sky-500/10 text-sky-200"
            : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500"
        }`}
    >
      {label}
    </button>
  );
}

function RawDataSelector({
  vessels,
  rawVessel,
  setRawVessel,
  rawSensor,
  setRawSensor,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  columns,
  selectedColumns,
  setSelectedColumns,
  onDownload,
}: any) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-4">
      <h3 className="text-sm font-semibold">Raw Data Selection</h3>

      {/* vessel */}
      <div>
        <p className="text-xs text-slate-400 mb-1">Select Vessel</p>
        <select
          value={rawVessel || ""}
          onChange={(e) => setRawVessel(e.target.value)}
          className="w-full bg-slate-800 border border-slate-600 p-2 rounded text-xs"
        >
          <option value="">-- Choose vessel --</option>
          {vessels.map((v: Vessel) => (
            <option key={v.id} value={v.name}>
              {v.name}
            </option>
          ))}
        </select>
      </div>

      {/* sensor */}
      {rawVessel && (
        <div>
          <p className="text-xs text-slate-400 mb-1">Select Sensor</p>
          <select
            value={rawSensor || ""}
            onChange={(e) => setRawSensor(e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 p-2 rounded text-xs"
          >
            <option value="">-- Choose sensor --</option>
            <option value="CT1.1">CT1.1 - Compression Temperature</option>
            <option value="CT1.2">CT1.2 - Compression Temperature</option>
            <option value="CT1.3">CT1.3 - Compression Temperature</option>
            <option value="CT2.1">CT2.1 - Compression Temperature</option>
            <option value="CT2.2">CT2.2 - Compression Temperature</option>
            <option value="PT1.1">PT1.1 - Pressure Transducer</option>
            <option value="PT1.2">PT1.2 - Pressure Transducer</option>
            <option value="FT1.1">FT1.1 - Flow Transducer</option>
            <option value="TT1.1">TT1.1 - Temperature Transducer</option>
          </select>
        </div>
      )}

      {/* date range */}
      {rawSensor && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-400 mb-1">Start Date</p>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 p-2 rounded text-xs"
            />
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">End Date</p>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 p-2 rounded text-xs"
            />
          </div>
        </div>
      )}

      {/* columns */}
      {startDate && endDate && (
        <div>
          <p className="text-xs text-slate-400 mb-2">Select Columns</p>
          <div className="flex flex-wrap gap-2">
            {columns.map((col: string) => (
              <button
                key={col}
                onClick={() =>
                  selectedColumns.includes(col)
                    ? setSelectedColumns(
                        selectedColumns.filter((x: string) => x !== col)
                      )
                    : setSelectedColumns([...selectedColumns, col])
                }
                className={`px-2 py-1 rounded text-[10px] border ${
                  selectedColumns.includes(col)
                    ? "border-sky-400 bg-sky-500/10"
                    : "border-slate-700 bg-slate-900"
                }`}
              >
                {col}
              </button>
            ))}
            <button
              onClick={() => setSelectedColumns([...columns])}
              className="px-2 py-1 rounded text-[10px] border border-emerald-400 bg-emerald-500/10"
            >
              Select All
            </button>
          </div>
        </div>
      )}

      {/* download */}
      {selectedColumns.length > 0 && (
        <button
          onClick={onDownload}
          className="mt-3 px-3 py-2 rounded bg-sky-600 text-xs hover:bg-sky-500"
        >
          Download CSV
        </button>
      )}
    </div>
  );
}

function StatsSelector({
  options,
  selected,
  toggle,
  onSelectAll,
  onDownload,
}: any) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
      <h3 className="text-sm font-semibold">Statistical Outputs</h3>
      <div className="flex flex-wrap gap-2">
        {options.map((opt: string) => (
          <button
            key={opt}
            onClick={() => toggle(opt)}
            className={`px-2 py-1 rounded text-[10px] border ${
              selected.includes(opt)
                ? "border-sky-400 bg-sky-500/10"
                : "border-slate-700 bg-slate-900"
            }`}
          >
            {opt}
          </button>
        ))}
        <button
          onClick={onSelectAll}
          className="px-2 py-1 rounded text-[10px] border border-emerald-400 bg-emerald-500/10"
        >
          Select All
        </button>
      </div>
      {selected.length > 0 && (
        <button
          onClick={onDownload}
          className="mt-3 px-3 py-2 rounded bg-sky-600 text-xs hover:bg-sky-500"
        >
          Download Analysis
        </button>
      )}
    </div>
  );
}

function ModelSelector({
  options,
  selected,
  toggle,
  onSelectAll,
  onDownload,
}: any) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
      <h3 className="text-sm font-semibold">Model Outputs</h3>
      <div className="flex flex-wrap gap-2">
        {options.map((opt: string) => (
          <button
            key={opt}
            onClick={() => toggle(opt)}
            className={`px-2 py-1 rounded text-[10px] border ${
              selected.includes(opt)
                ? "border-sky-400 bg-sky-500/10"
                : "border-slate-700 bg-slate-900"
            }`}
          >
            {opt}
          </button>
        ))}
        <button
          onClick={onSelectAll}
          className="px-2 py-1 rounded text-[10px] border border-emerald-400 bg-emerald-500/10"
        >
          Select All
        </button>
      </div>
      {selected.length > 0 && (
        <button
          onClick={onDownload}
          className="mt-3 px-3 py-2 rounded bg-sky-600 text-xs hover:bg-sky-500"
        >
          Download Model Data
        </button>
      )}
    </div>
  );
}

function AnomalySelector({
  vessels,
  anomalyVessel,
  setAnomalyVessel,
  anomalies,
  selectedAnomalies,
  setSelectedAnomalies,
  onDownload,
}: any) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-4">
      <h3 className="text-sm font-semibold">Anomalies Download</h3>

      {/* vessel */}
      <div>
        <p className="text-xs text-slate-400 mb-1">Select Vessel</p>
        <select
          value={anomalyVessel || ""}
          onChange={(e) => setAnomalyVessel(e.target.value)}
          className="w-full bg-slate-800 border border-slate-600 p-2 rounded text-xs"
        >
          <option value="">-- pick vessel --</option>
          {vessels.map((v: Vessel) => (
            <option key={v.id} value={v.name}>
              {v.name}
            </option>
          ))}
        </select>
      </div>

      {/* anomaly types */}
      {anomalyVessel && (
        <div>
          <p className="text-xs text-slate-400 mb-2">Select Anomaly Types</p>
          <div className="flex flex-wrap gap-2">
            {anomalies.map((a: string) => (
              <button
                key={a}
                onClick={() =>
                  selectedAnomalies.includes(a)
                    ? setSelectedAnomalies(
                        selectedAnomalies.filter((x: string) => x !== a)
                      )
                    : setSelectedAnomalies([...selectedAnomalies, a])
                }
                className={`px-2 py-1 rounded text-[10px] border ${
                  selectedAnomalies.includes(a)
                    ? "border-sky-400 bg-sky-500/10"
                    : "border-slate-700 bg-slate-900"
                }`}
              >
                {a}
              </button>
            ))}
            <button
              onClick={() => setSelectedAnomalies([...anomalies])}
              className="px-2 py-1 rounded text-[10px] border border-emerald-400 bg-emerald-500/10"
            >
              Select All
            </button>
          </div>
        </div>
      )}

      {selectedAnomalies.length > 0 && (
        <button
          onClick={onDownload}
          className="mt-3 px-3 py-2 rounded bg-sky-600 text-xs hover:bg-sky-500"
        >
          Download Logs
        </button>
      )}
    </div>
  );
}

/* ---------------------------------------------------------
   DATA EXPLORATION SCREEN
--------------------------------------------------------- */

function DataExplorationScreen({ onBack }: { onBack: () => void }) {
  return (
    <section className="space-y-4">
      {/* back button */}
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Analytics Hub
        </button>
      </div>
      
      {/* breadcrumb */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-slate-400">
          <button
            className="text-slate-300 hover:text-sky-300"
            onClick={onBack}
          >
            Analytics Hub
          </button>
          <span>/</span>
          <span className="text-slate-500">Data Exploration</span>
        </div>
        <span className="text-[11px] text-slate-500">
          First look at patterns, trends & distributions.
        </span>
      </div>

      {/* header */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-sm font-semibold">Exploratory Summary</h2>
        <p className="text-xs text-slate-400 mt-1">
          Basic distributions, missingness, variance metrics and seasonal decomposition.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-4">
        <MiniMetric label="Total Data Points" value="1,285,992" />
        <MiniMetric label="Sensors Covered" value="12" />
        <MiniMetric label="Missing Values" value="4.1%" />
        <MiniMetric label="Avg. Sampling Rate" value="1/5 sec" />
      </div>

      {/* sections */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* distributions */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
          <h3 className="text-sm font-semibold mb-2">Distributions</h3>
          <p className="text-xs text-slate-400 mb-3">
            Distribution preview for pressure, volume, temperature and flow.
          </p>
          <div className="grid gap-3">
            <FakeChartBlock
              title="Pressure Distribution"
              caption="Histogram + KDE (mock placeholder)"
            />
            <FakeChartBlock
              title="Volume Distribution"
              caption="Histogram + KDE (mock placeholder)"
            />
          </div>
        </div>

        {/* missingness */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
          <h3 className="text-sm font-semibold mb-2">Missingness Overview</h3>
          <p className="text-xs text-slate-400 mb-3">
            Sensor-level missing rate and temporal missing spikes.
          </p>
          <FakeChartBlock
            title="Missingness Timeline"
            caption="Shows missing bursts across sensors (mock)"
          />
        </div>
      </div>

      {/* second row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* decomposition */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
          <h3 className="text-sm font-semibold mb-2">
            Time Series Decomposition
          </h3>
          <p className="text-xs text-slate-400 mb-3">
            Trend, seasonality, residuals (applied to pressure as example).
          </p>
          <FakeChartBlock
            title="Trend & Seasonality"
            caption="Decomposed time-series components (mock)"
          />
        </div>

        {/* variance */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
          <h3 className="text-sm font-semibold mb-2">Top Sensors by Variance</h3>
          <p className="text-xs text-slate-400 mb-3">
            Highest volatility sensors over the past 7 days.
          </p>
          <ul className="text-xs text-slate-300 space-y-2">
            <li>Pressure FWD – Variance: 4.21</li>
            <li>Volume AFT – Variance: 3.88</li>
            <li>Flow Rate Mid – Variance: 2.95</li>
            <li>Temperature Bay – Variance: 2.57</li>
          </ul>
          <div className="mt-3">
            <FakeChartBlock
              title="Variance Comparison"
              caption="Bar chart of variance (mock)"
            />
          </div>
        </div>
      </div>

      {/* summary */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <h3 className="text-sm font-semibold mb-2">Summary</h3>
        <p className="text-xs text-slate-300">
          Data is moderately complete (4% missing), distributions appear stable, and
          only a handful of sensors show elevated variance. Seasonal patterns detected.
        </p>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------
   STATISTICAL DIAGNOSTICS SCREEN
--------------------------------------------------------- */

function StatisticalDiagnosticsScreen({ onBack }: { onBack: () => void }) {
  return (
    <section className="space-y-4">
      {/* back button */}
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Analytics Hub
        </button>
      </div>
      
      {/* breadcrumb */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-slate-400">
          <button
            className="text-slate-300 hover:text-sky-300"
            onClick={onBack}
          >
            Analytics Hub
          </button>
          <span>/</span>
          <span className="text-slate-500">Statistical Diagnostics</span>
        </div>
        <span className="text-[11px] text-slate-500">
          Stationarity • Drift • Structural tests
        </span>
      </div>

      {/* header */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-sm font-semibold">Statistical Diagnostics</h2>
        <p className="text-xs text-slate-400 mt-1">
          Tests and evaluations: ADF, KPSS, rolling variance, drift signals, and
          normality checks.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-4">
        <MiniMetric label="ADF Stationarity" value="Likely Stationary" />
        <MiniMetric label="KPSS" value="Trend-stationary" />
        <MiniMetric label="Variance Drift" value="Low" />
        <MiniMetric label="Seasonality" value="Detected" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ADF & KPSS */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
          <h3 className="text-sm font-semibold">ADF & KPSS Tests</h3>
          <p className="text-xs text-slate-400 mb-3">
            Unit root and trend stationarity tests for selected sensor signals.
          </p>
          <div className="space-y-2 text-xs text-slate-300">
            <p>
              <strong>ADF p-value:</strong> 0.021 (reject non-stationarity)
            </p>
            <p>
              <strong>KPSS p-value:</strong> 0.19 (fail to reject stationarity)
            </p>
            <p>
              <strong>Conclusion:</strong> Series is stationary with minor trend
              components.
            </p>
          </div>
          <div className="mt-3">
            <div className="relative h-64 bg-slate-800/50 rounded border border-slate-700">
              <img 
                src="/CHI/average_chi_per_subsystem.png" 
                alt="Average CHI per Subsystem Analysis"
                className="w-full h-full object-contain rounded"
              />
              <div className="absolute bottom-1 left-2 text-[10px] text-slate-400">
                CHI Health Index by Subsystem
              </div>
            </div>
          </div>
        </div>

        {/* drift */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
          <h3 className="text-sm font-semibold">Drift Analysis</h3>
          <p className="text-xs text-slate-400 mb-3">
            Change detection using rolling windows and drift thresholds.
          </p>
          <div className="relative h-64 bg-slate-800/50 rounded border border-slate-700">
            <img 
              src="/drift_analysis.png" 
              alt="Variance Drift Analysis"
              className="w-full h-full object-contain rounded"
            />
            <div className="absolute bottom-1 left-2 text-[10px] text-slate-400">
              Rolling Window Variance Drift Detection
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* normality */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
          <h3 className="text-sm font-semibold">Normality Tests</h3>
          <p className="text-xs text-slate-400 mb-3">
            Shapiro-Wilk, QQ plots, and distribution symmetry tests.
          </p>
          <ul className="text-xs text-slate-300 space-y-1">
            <li>Shapiro-Wilk p-value: 0.043 (light deviations)</li>
            <li>Skewness: 0.18</li>
            <li>Kurtosis: 3.11 (near-normal)</li>
          </ul>
          <div className="mt-3">
            <div className="relative h-64 bg-slate-800/50 rounded border border-slate-700">
              <img 
                src="/outliers/senosrCT020_01.png" 
                alt="CT020_01 Statistical Distribution Analysis"
                className="w-full h-full object-contain rounded"
              />
              <div className="absolute bottom-1 left-2 text-[10px] text-slate-400">
                Sensor CT020_01
              </div>
            </div>
          </div>
        </div>

        {/* seasonality */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
          <h3 className="text-sm font-semibold">Seasonality & Trend</h3>
          <p className="text-xs text-slate-400 mb-3">
            STL decomposition and periodicity detection.
          </p>
          <FakeChartBlock
            title="Seasonal Decomposition"
            caption="Trend + seasonal components (mock)"
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* rolling stats */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
          <h3 className="text-sm font-semibold">Rolling Statistics</h3>
          <p className="text-xs text-slate-400 mb-3">
            Rolling mean, variance and their stability over time.
          </p>
          <div className="relative h-64 bg-slate-800/50 rounded border border-slate-700">
            <img 
              src="/rolling_mean&variance.png" 
              alt="Rolling Mean and Variance Analysis"
              className="w-full h-full object-contain rounded"
            />
            <div className="absolute bottom-1 left-2 text-[10px] text-slate-400">
              Rolling Statistical Moments Analysis
            </div>
          </div>
        </div>

        {/* summary */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <h3 className="text-sm font-semibold mb-2">Overall Summary</h3>
          <p className="text-xs text-slate-300">
            Diagnostics suggests the signal is <strong>mostly stationary</strong> with minor
            drift. Normality is approximately satisfied, and periodic patterns exist.
            Model training conditions are favorable.
          </p>
          <ul className="list-disc pl-4 text-[11px] mt-3 text-slate-400 space-y-1">
            <li>Variance stable across windows</li>
            <li>Drift events limited and short-lived</li>
            <li>Strong seasonal signature improves forecasting</li>
            <li>Suitable for classical and neural time-series models</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------
   CORRELATION ANALYSIS SCREEN
--------------------------------------------------------- */

function CorrelationAnalysisScreen({ onBack }: { onBack: () => void }) {
  return (
    <section className="space-y-4">
      {/* back button */}
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Analytics Hub
        </button>
      </div>
      
      {/* breadcrumb */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-slate-400">
          <button
            className="text-slate-300 hover:text-sky-300"
            onClick={onBack}
          >
            Analytics Hub
          </button>
          <span>/</span>
          <span className="text-slate-500">Correlation Analysis</span>
        </div>
        <span className="text-[11px] text-slate-500">
          Relationships • PCA • Heatmaps
        </span>
      </div>

      {/* header */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-sm font-semibold">Correlation & Cross-Sensor Insights</h2>
        <p className="text-xs text-slate-400 mt-1">
          Derived from correlation heatmaps, cross-correlation functions, and PCA
          components across your vessel sensors.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-4">
        <MiniMetric label="Strong Correlations" value="5" />
        <MiniMetric label="Weak Correlations" value="14" />
        <MiniMetric label="PCA Components > 85%" value="2" />
        <MiniMetric label="Lag-Dependent Pairs" value="3" />
      </div>

      {/* Pearson / Spearman */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
          <h3 className="text-sm font-semibold">Pearson Correlation</h3>
          <p className="text-xs text-slate-400 mb-3">
            Linear correlation between sensors.
          </p>
          <div className="relative h-80 bg-slate-800/50 rounded border border-slate-700">
            <img 
              src="/correlation/sensor correlation heatmap.png" 
              alt="Sensor Correlation Heatmap Analysis"
              className="w-full h-full object-contain rounded"
            />
            <div className="absolute bottom-1 left-2 text-[10px] text-slate-400">
              Pearson Correlation Matrix
            </div>
          </div>
          <ul className="text-xs text-slate-300 mt-3 space-y-1">
            <li>Pressure ↔ Volume: 0.81</li>
            <li>Temp ↔ Flow Rate: 0.44</li>
            <li>Volume ↔ Flow Rate: 0.12</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
          <h3 className="text-sm font-semibold">Spearman Correlation</h3>
          <p className="text-xs text-slate-400 mb-3">
            Rank-order monotonic relationships.
          </p>
          <div className="relative h-80 bg-slate-800/50 rounded border border-slate-700">
            <img 
              src="/correlation/sensor_clustering_by_correlation.png" 
              alt="Sensor Clustering by Correlation Analysis"
              className="w-full h-full object-contain rounded"
            />
            <div className="absolute bottom-1 left-2 text-[10px] text-slate-400">
              Hierarchical Sensor Clustering Dendrogram
            </div>
          </div>
          <ul className="text-xs text-slate-300 mt-3 space-y-1">
            <li>Pressure ↔ Temperature: 0.73</li>
            <li>Flow Rate ↔ Volume: 0.51</li>
            <li>Temp ↔ Volume: 0.31</li>
          </ul>
        </div>
      </div>

      {/* lag + PCA */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
          <h3 className="text-sm font-semibold">Lag Correlation</h3>
          <p className="text-xs text-slate-400 mb-3">
            Cross-correlation function reveals lead-lag relationships.
          </p>
          <div className="relative h-64 bg-slate-800/50 rounded border border-slate-700">
            <img 
              src="/correlation/rolling correlation sensor 27.png" 
              alt="Rolling Correlation Analysis for Sensor 27"
              className="w-full h-full object-contain rounded"
            />
            <div className="absolute bottom-1 left-2 text-[10px] text-slate-400">
              Lag-Based Cross Correlation Function
            </div>
          </div>
          <ul className="text-xs text-slate-300 space-y-1 mt-3">
            <li>Pressure leads Volume by 2–3 timesteps</li>
            <li>Temperature lags Flow Rate by ~4 timesteps</li>
            <li>Minor lag relationships for other sensors</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
          <h3 className="text-sm font-semibold">PCA Components</h3>
          <p className="text-xs text-slate-400 mb-3">
            Dimensionality reduction using principal component analysis.
          </p>
          <FakeChartBlock
            title="PCA Explained Variance"
            caption="Scree plot of component contribution (mock)"
          />
          <ul className="text-xs text-slate-300 space-y-1 mt-3">
            <li>PC1 explains 61% variance</li>
            <li>PC2 explains 27% variance</li>
            <li>PC3 explains only 8% variance</li>
          </ul>
        </div>
      </div>

      {/* sensor pairs + summary */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
          <h3 className="text-sm font-semibold">
            Sensor-Pair Relationship Analysis
          </h3>
          <p className="text-xs text-slate-400 mb-3">
            Scatterplots + joint distributions for best correlated pairs.
          </p>
          <FakeChartBlock
            title="Pressure vs Volume"
            caption="Positive monotonic relationship (mock)"
          />
          <FakeChartBlock
            title="Temperature vs Flow Rate"
            caption="Moderate curved relationship (mock)"
          />
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <h3 className="text-sm font-semibold mb-2">Overall Summary</h3>
          <p className="text-xs text-slate-300">
            Correlation analysis reveals strong links between pressure & volume,
            moderate links between temperature and flow rate, and several lag
            relationships. PCA shows that most variance is captured by two components,
            enabling dimensionality reduction for modeling.
          </p>
          <ul className="list-disc pl-4 text-[11px] mt-3 text-slate-400 space-y-1">
            <li>Strong linear + monotonic correlations detected</li>
            <li>Lag structure supports GRU forecasting models</li>
            <li>PCA indicates redundancy between sensors</li>
            <li>
              Useful for feature selection and anomaly root-cause inference
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------
   OUTLIER VERIFICATION SCREEN
--------------------------------------------------------- */

function OutlierVerificationScreen({ onBack }: { onBack: () => void }) {
  return (
    <section className="space-y-4">
      {/* back button */}
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Analytics Hub
        </button>
      </div>
      
      {/* breadcrumb */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-slate-400">
          <button
            className="text-slate-300 hover:text-sky-300"
            onClick={onBack}
          >
            Analytics Hub
          </button>
          <span>/</span>
          <span className="text-slate-500">Outlier Verification</span>
        </div>
        <span className="text-[11px] text-slate-500">
          Anomalies • Verification • Detection
        </span>
      </div>

      {/* header */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-sm font-semibold">Outlier Verification</h2>
        <p className="text-xs text-slate-400 mt-1">
          Derived from: Isolation Forest, Z-score anomalies, AE & GRU spikes, and
          hybrid anomaly scoring.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-4">
        <MiniMetric label="Total Anomalies" value="48" />
        <MiniMetric label="Critical Events" value="7" />
        <MiniMetric label="Model-Flagged" value="21" />
        <MiniMetric label="Verified True" value="11" />
      </div>

      {/* IF & Z-score */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
          <h3 className="text-sm font-semibold">Isolation Forest Results</h3>
          <p className="text-xs text-slate-400 mb-3">
            Tree-based anomaly detector identifying sparse, isolated points.
          </p>
          <div className="relative h-64 bg-slate-800/50 rounded border border-slate-700">
            <img 
              src="/outliers/daily outlier ratio.png" 
              alt="Daily Outlier Ratio Analysis"
              className="w-full h-full object-contain rounded"
            />
            <div className="absolute bottom-1 left-2 text-[10px] text-slate-400">
              Daily Outlier Ratio
            </div>
          </div>
          <ul className="text-xs text-slate-300 mt-3 space-y-1">
            <li>Anomaly threshold: 0.62</li>
            <li>High-confidence anomalies: 9</li>
            <li>Low amplitude outliers: 17</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
          <h3 className="text-sm font-semibold">Z-Score Anomalies</h3>
          <p className="text-xs text-slate-400 mb-3">
            Outliers based on deviation from mean (threshold ±3σ).
          </p>
          <div className="relative h-64 bg-slate-800/50 rounded border border-slate-700">
            <img 
              src="/outliers/sensorCT015_01.png" 
              alt="CT015_01 Z-Score Outlier Analysis"
              className="w-full h-full object-contain rounded"
            />
            <div className="absolute bottom-1 left-2 text-[10px] text-slate-400">
              Sensor CT015_01
            </div>
          </div>
          <ul className="text-xs text-slate-300 mt-3 space-y-1">
            <li>Z &gt; 3: 5 events</li>
            <li>Z &lt; -3: 2 events</li>
            <li>Most anomalies cluster near boundary</li>
          </ul>
        </div>
      </div>

      {/* model-based + timeline */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
          <h3 className="text-sm font-semibold">
            AE + GRU Model-Based Anomalies
          </h3>
          <p className="text-xs text-slate-400 mb-3">
            Reconstruction error spikes and forecast mismatches.
          </p>
          <div className="relative h-64 bg-slate-800/50 rounded border border-slate-700">
            <img 
              src="/outliers/sensorCT019_01.png" 
              alt="CT019_01 Machine Learning Anomaly Detection"
              className="w-full h-full object-contain rounded"
            />
            <div className="absolute bottom-1 left-2 text-[10px] text-slate-400">
              Sensor CT019_01
            </div>
          </div>
          <ul className="text-xs text-slate-300 mt-3 space-y-1">
            <li>AE high spikes: 6</li>
            <li>GRU forecast errors: 11</li>
            <li>Hybrid consensus anomalies: 4</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
          <h3 className="text-sm font-semibold">Anomaly Timeline</h3>
          <p className="text-xs text-slate-400 mb-3">
            Overlay of all anomaly categories across time.
          </p>
          <div className="relative h-64 bg-slate-800/50 rounded border border-slate-700">
            <img 
              src="/outliers/sensorCT029.png" 
              alt="CT029 Unified Anomaly Timeline Analysis"
              className="w-full h-full object-contain rounded"
            />
            <div className="absolute bottom-1 left-2 text-[10px] text-slate-400">
              Sensor CT029
            </div>
          </div>
        </div>
      </div>

      {/* clusters + summary */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
          <h3 className="text-sm font-semibold">Sensor-Level Anomaly Clusters</h3>
          <p className="text-xs text-slate-400 mb-3">
            Cluster grouping using Isolation Forest vectors + AE error embeddings.
          </p>
          <div className="relative h-64 bg-slate-800/50 rounded border border-slate-700">
            <img 
              src="/outliers/sensorCT053_01.png" 
              alt="CT053_01 Anomaly Cluster Analysis"
              className="w-full h-full object-contain rounded"
            />
            <div className="absolute bottom-1 left-2 text-[10px] text-slate-400">
              Sensor CT053_01
            </div>
          </div>
          <ul className="text-xs text-slate-300 mt-3 space-y-1">
            <li>Cluster A — Stable (6 sensors)</li>
            <li>Cluster B — Mild anomalies (4 sensors)</li>
            <li>Cluster C — High severity (2 sensors)</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <h3 className="text-sm font-semibold mb-2">Verification Summary</h3>
          <p className="text-xs text-slate-300">
            Combined anomaly sources indicate <strong>low to medium volatility</strong>{" "}
            with a cluster of anomalies driven primarily by pressure and temperature
            sensors.
          </p>
          <ul className="list-disc pl-4 text-[11px] mt-3 text-slate-400 space-y-1">
            <li>Isolation Forest detects isolated high-impact points</li>
            <li>Z-score detects statistical deviations</li>
            <li>AE & GRU errors confirm structural mismatches</li>
            <li>Consensus anomalies appear most reliable</li>
            <li>Cluster C sensors require inspection</li>
          </ul>
        </div>
      </div>

      {/* events table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <h3 className="text-sm font-semibold mb-2">Anomaly Verification Table</h3>
        <p className="text-xs text-slate-400 mb-3">
          Aggregated anomaly signals with manual verification tags.
        </p>
        <div className="overflow-auto">
          <table className="min-w-full text-[11px] border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-1 pr-3 text-left">Time</th>
                <th className="py-1 pr-3 text-left">Sensor</th>
                <th className="py-1 pr-3 text-left">Type</th>
                <th className="py-1 pr-3 text-left">Score</th>
                <th className="py-1 pr-3 text-left">Verified</th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  time: "2025-11-24 04:12",
                  sensor: "Pressure FWD",
                  type: "Isolation Forest",
                  score: "0.91",
                  verified: "True",
                },
                {
                  time: "2025-11-24 06:33",
                  sensor: "Volume AFT",
                  type: "Z-Score",
                  score: "3.77σ",
                  verified: "False",
                },
                {
                  time: "2025-11-24 07:15",
                  sensor: "Temperature Bay",
                  type: "AE Error",
                  score: "High",
                  verified: "True",
                },
              ].map((row, idx) => (
                <tr key={idx} className="border-b border-slate-900/70">
                  <td className="py-1 pr-3">{row.time}</td>
                  <td className="py-1 pr-3">{row.sensor}</td>
                  <td className="py-1 pr-3">{row.type}</td>
                  <td className="py-1 pr-3">{row.score}</td>
                  <td className="py-1 pr-3">
                    <span
                      className={`px-2 py-0.5 rounded-full border ${
                        row.verified === "True"
                          ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                          : "bg-amber-100 text-amber-700 border-amber-300"
                      }`}
                    >
                      {row.verified}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------
   SMALL COMPONENTS
--------------------------------------------------------- */

function TopNavButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-[11px] font-medium transition ${
        active
          ? "bg-sky-500/20 text-sky-100 border border-sky-400/60"
          : "text-slate-300 border border-transparent hover:border-slate-600"
      }`}
    >
      {label}
    </button>
  );
}

function KpiCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "good" | "warn" | "bad";
}) {
  const ring =
    tone === "good"
      ? "ring-emerald-500/40"
      : tone === "warn"
      ? "ring-amber-500/40"
      : tone === "bad"
      ? "ring-rose-500/40"
      : "ring-slate-700";

  return (
    <div
      className={`rounded-2xl border border-slate-800 bg-slate-900/60 p-3 ring-1 ${ring}`}
    >
      <p className="text-[11px] uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-[11px] font-medium transition ${
        active
          ? "border-sky-400 bg-sky-500/10 text-sky-100"
          : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500"
      }`}
    >
      {label}
    </button>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2">
      <p className="text-[10px] text-slate-400">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}

function Marker({
  x,
  y,
  status,
  label,
  onClick,
}: {
  x: string;
  y: string;
  status: VesselStatus;
  label: string;
  onClick?: () => void;
}) {
  const color =
    status === "healthy"
      ? "bg-emerald-400"
      : status === "watch"
      ? "bg-amber-400"
      : "bg-rose-400";

  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute flex flex-col items-center text-[9px] focus:outline-none"
      style={{ left: x, top: y }}
    >
      <div className={`h-3 w-3 rounded-full ${color} shadow`} />
      <span className="mt-1 text-slate-200">{label}</span>
    </button>
  );
}

function HealthGauge({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  const angle = -90 + (clamped / 100) * 180;

  const color =
    clamped >= 80
      ? "stroke-emerald-400"
      : clamped >= 60
      ? "stroke-amber-400"
      : "stroke-rose-400";

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 100 60" className="w-40">
        <path
          d="M10,50 A40,40 0 0,1 90,50"
          className="fill-none stroke-slate-700"
          strokeWidth={6}
        />
        <path
          d="M10,50 A40,40 0 0,1 90,50"
          className={`fill-none ${color}`}
          strokeWidth={4}
          strokeDasharray="180"
          strokeDashoffset={180 - (180 * clamped) / 100}
        />
        <g transform="translate(50,50)">
          <line
            x1={0}
            y1={0}
            x2={35 * Math.cos((Math.PI * angle) / 180)}
            y2={35 * Math.sin((Math.PI * angle) / 180)}
            className="stroke-slate-100"
            strokeWidth={2}
          />
          <circle r={3} className="fill-slate-100" />
        </g>
      </svg>
      <p className="mt-1 text-sm font-semibold">{clamped}%</p>
    </div>
  );
}

function TabPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-[11px] font-medium ${
        active
          ? "bg-slate-100 text-slate-900"
          : "bg-slate-900 text-slate-300 border border-slate-700 hover:border-slate-500"
      }`}
    >
      {label}
    </button>
  );
}

function SeriesToggle({
  label,
  active,
  onToggle,
  colorClass,
}: {
  label: string;
  active: boolean;
  onToggle: () => void;
  colorClass: string;
}) {
  return (
    <button
      onClick={onToggle}
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${
        active
          ? `${colorClass} bg-slate-900`
          : "border-slate-600 bg-slate-900/60 text-slate-400"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          active ? colorClass.replace("border", "bg") : "bg-slate-500"
        }`}
      />
      <span>{label}</span>
    </button>
  );
}

function LegendDot({
  label,
  colorClass,
}: {
  label: string;
  colorClass: string;
}) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`h-2 w-2 rounded-full ${colorClass}`} />
      <span>{label}</span>
    </span>
  );
}

function ModelKpiCard({
  title,
  subtitle,
  description,
}: {
  title: string;
  subtitle: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
      <p className="text-[11px] text-slate-400">{subtitle}</p>
      <h3 className="text-sm font-semibold mt-1">{title}</h3>
      <p className="mt-2 text-[11px] text-slate-300">{description}</p>
    </div>
  );
}

function FakeChartBlock({
  title,
  caption,
}: {
  title: string;
  caption: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-xs flex flex-col gap-2">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-[11px] text-slate-400">
          Mock chart – real metrics to come later.
        </p>
      </div>
      <div className="h-32 rounded-lg bg-slate-950/80 relative overflow-hidden">
        {/* Realistic AE Error line with variations */}
        <svg className="absolute inset-0 w-full h-full">
          {/* AE Error with realistic sensor variations */}
          <path
            d="M0,25 L20,26 L40,24 L60,27 L80,35 L100,42 L120,38 L140,26 L160,24 L180,25 L200,23 L220,26 L240,24 L260,25 L280,32 L300,38 L320,35 L340,26 L360,24 L380,25 L400,23"
            stroke="#38bdf8"
            strokeWidth="1"
            fill="none"
            opacity="0.7"
          />
          {/* GRU Error with clear anomaly spikes */}
          <path
            d="M0,50 L25,52 L50,48 L75,51 L100,65 L125,72 L150,68 L175,52 L200,50 L225,48 L250,51 L275,49 L300,63 L325,68 L350,65 L375,52 L400,50"
            stroke="#fbbf24"
            strokeWidth="1"
            fill="none"
            opacity="0.7"
          />
          {/* Hybrid Score drops during anomalies */}
          <path
            d="M0,80 L30,82 L60,78 L90,80 L120,65 L150,58 L180,62 L210,78 L240,80 L270,82 L300,68 L330,62 L360,65 L390,78 L400,80"
            stroke="#10b981"
            strokeWidth="1.5"
            fill="none"
            opacity="0.8"
          />
        </svg>
        {/* Realistic anomaly zones */}
        <div className="absolute left-[24%] top-0 h-full w-[16%] bg-rose-500/10 border-x border-rose-500/40" />
        <div className="absolute left-[72%] top-0 h-full w-[14%] bg-rose-500/10 border-x border-rose-500/40" />
      </div>
      <p className="text-[11px] text-slate-400">{caption}</p>
    </div>
  );
}

function SeverityPill({ level }: { level: "Low" | "Medium" | "High" }) {
  const colors =
    level === "High"
      ? "bg-rose-100 text-rose-700 border-rose-300"
      : level === "Medium"
      ? "bg-amber-100 text-amber-800 border-amber-300"
      : "bg-emerald-100 text-emerald-700 border-emerald-300";
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${colors}`}
    >
      {level}
    </span>
  );
}

function AnalyticsCard({
  title,
  subtitle,
  description,
  onClick,
}: {
  title: string;
  subtitle: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-left hover:border-sky-500 transition group"
    >
      <h3 className="text-sm font-semibold group-hover:text-sky-300">
        {title}
      </h3>
      <p className="text-[11px] text-slate-400 mt-1">{subtitle}</p>
      <p className="text-xs text-slate-300 mt-3">{description}</p>
      <div className="mt-4 text-[11px] text-sky-400 group-hover:underline">
        Open →
      </div>
    </button>
  );
}