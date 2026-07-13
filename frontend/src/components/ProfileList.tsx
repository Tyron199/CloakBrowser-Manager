import { Archive, Plus, Search, Monitor, FolderOpen } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Profile } from "../lib/api";
import { countryFlag, countryName } from "../lib/countries";
import { StatusIndicator } from "./StatusIndicator";

interface ProfileListProps {
  profiles: Profile[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onOpenSharedFiles: () => void;
}

export function ProfileList({
  profiles,
  selectedId,
  onSelect,
  onNew,
  onOpenSharedFiles,
}: ProfileListProps) {
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const archivedCount = useMemo(
    () => profiles.filter((p) => p.archived).length,
    [profiles],
  );

  // Countries from currently visible set (respects show-archived toggle)
  const usedCountries = useMemo(() => {
    const codes = new Set<string>();
    for (const p of profiles) {
      if (!showArchived && p.archived) continue;
      if (p.country) codes.add(p.country);
    }
    return Array.from(codes).sort((a, b) =>
      countryName(a).localeCompare(countryName(b)),
    );
  }, [profiles, showArchived]);

  useEffect(() => {
    if (countryFilter && !usedCountries.includes(countryFilter)) {
      setCountryFilter("");
    }
  }, [countryFilter, usedCountries]);

  const filtered = profiles.filter((p) => {
    if (!showArchived && p.archived) return false;
    if (countryFilter && p.country !== countryFilter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const runningCount = profiles.filter((p) => p.status === "running").length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <Monitor className="h-4 w-4 text-accent" />
          <h1 className="text-sm font-semibold tracking-tight">CloakBrowser Manager</h1>
        </div>
        {runningCount > 0 && (
          <div className="text-xs text-gray-500 mb-3">
            {runningCount} running
          </div>
        )}
        {/* Search */}
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
          <input
            type="text"
            placeholder="Search profiles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-8 py-1.5 text-xs"
          />
        </div>
        {/* Country filter — only shown when at least one visible profile has a country */}
        {usedCountries.length > 0 && (
          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="input py-1.5 text-xs mb-2"
            title="Filter by country"
          >
            <option value="">All countries</option>
            {usedCountries.map((code) => (
              <option key={code} value={code}>
                {countryFlag(code)} {countryName(code)}
              </option>
            ))}
          </select>
        )}
        {/* Show archived — only when something is archived */}
        {archivedCount > 0 && (
          <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="rounded border-border bg-surface-2"
            />
            <Archive className="h-3 w-3" />
            <span>Show archived ({archivedCount})</span>
          </label>
        )}
      </div>

      {/* Profile list */}
      <div className="flex-1 overflow-y-auto p-2">
        {filtered.length === 0 && (
          <div className="text-center text-gray-500 text-xs py-8">
            {profiles.length === 0
              ? "No profiles yet"
              : archivedCount > 0 && !showArchived
                ? "No active profiles — enable Show archived"
                : "No matches"}
          </div>
        )}
        {filtered.map((profile) => (
          <button
            key={profile.id}
            onClick={() => onSelect(profile.id)}
            className={`w-full text-left px-3 py-2.5 rounded-md mb-1 transition-colors ${
              selectedId === profile.id
                ? "bg-surface-3 border border-border-hover"
                : "hover:bg-surface-2 border border-transparent"
            } ${profile.archived ? "opacity-70" : ""}`}
          >
            <div className="flex items-center gap-2">
              <StatusIndicator status={profile.status} />
              <span className="text-sm font-medium truncate flex-1">{profile.name}</span>
              {profile.archived && (
                <span
                  className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-surface-4 text-gray-500 inline-flex items-center gap-1"
                  title="Archived"
                >
                  <Archive className="h-2.5 w-2.5" />
                  <span>Archived</span>
                </span>
              )}
              {profile.country && (
                <span
                  className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-surface-4 text-gray-300 inline-flex items-center gap-1"
                  title={countryName(profile.country)}
                >
                  <span className="leading-none">{countryFlag(profile.country)}</span>
                  <span>{profile.country}</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 ml-4">
              <span className="text-xs text-gray-500 capitalize">{profile.platform}</span>
              {profile.proxy && (
                <>
                  <span className="text-xs text-gray-600">·</span>
                  <span className="text-xs text-gray-500">Proxy</span>
                </>
              )}
            </div>
            {profile.tags.length > 0 && (
              <div className="flex gap-1 mt-1.5 ml-4 flex-wrap">
                {profile.tags.map((t) => (
                  <span
                    key={t.tag}
                    className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-4 text-gray-400"
                    style={t.color ? { backgroundColor: `${t.color}20`, color: t.color } : undefined}
                  >
                    {t.tag}
                  </span>
                ))}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="p-3 border-t border-border space-y-2">
        <button onClick={onNew} className="btn-secondary w-full flex items-center justify-center gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          <span>New Profile</span>
        </button>
        <button
          onClick={onOpenSharedFiles}
          className="btn-secondary w-full flex items-center justify-center gap-1.5"
          title="Upload files accessible inside browsers"
        >
          <FolderOpen className="h-3.5 w-3.5" />
          <span>Shared Files</span>
        </button>
      </div>
    </div>
  );
}
