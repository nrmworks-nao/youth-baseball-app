"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error-display";
import { searchTeams } from "@/lib/supabase/queries/inter-team";
import { getErrorMessage } from "@/lib/supabase/error-handler";
import type { TeamProfile } from "@/types";

const REGIONS = ["", "東京都", "埼玉県", "神奈川県", "千葉県"];
const LEAGUES = ["", "少年野球連盟A", "少年野球連盟B", "少年野球連盟C"];

export default function TeamSearchPage() {
  const [keyword, setKeyword] = useState("");
  const [region, setRegion] = useState("");
  const [league, setLeague] = useState("");
  const [results, setResults] = useState<TeamProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await searchTeams({
        keyword: keyword.trim() || undefined,
        region: region || undefined,
        league: league || undefined,
      });
      setResults(data);
      setHasSearched(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [keyword, region, league]);

  return (
    <div className="flex flex-col">
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <h2 className="text-base font-bold text-gray-900">チーム検索</h2>
      </div>

      {/* 検索フィルター */}
      <div className="space-y-2 bg-white px-4 py-3">
        <Input
          label=""
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="チーム名・キーワードで検索..."
        />
        <div className="grid grid-cols-2 gap-2">
          <Select label="" value={region} onChange={(e) => setRegion(e.target.value)}>
            <option value="">地域を選択</option>
            {REGIONS.filter(Boolean).map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </Select>
          <Select label="" value={league} onChange={(e) => setLeague(e.target.value)}>
            <option value="">リーグを選択</option>
            {LEAGUES.filter(Boolean).map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </Select>
        </div>
        <Button className="w-full" onClick={handleSearch} disabled={isLoading}>
          {isLoading ? "検索中..." : "検索"}
        </Button>
      </div>

      {/* 結果 */}
      {error && <ErrorDisplay message={error} onRetry={handleSearch} />}

      {isLoading && <Loading text="チームを検索中..." />}

      {!isLoading && !error && (
        <div className="space-y-2 p-4">
          {hasSearched && (
            <p className="text-xs text-gray-500">{results.length}チームが見つかりました</p>
          )}
          {results.map((profile) => {
            const team = (profile as unknown as { teams?: { id: string; name: string; region?: string; league?: string } }).teams;
            return (
              <Link key={profile.team_id} href={`/teams/${profile.team_id}/profile`}>
                <Card className="p-4 transition-colors hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">{team?.name ?? "チーム"}</h3>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {team?.region && <Badge variant="default">{team.region}</Badge>}
                        {team?.league && <Badge variant="practice">{team.league}</Badge>}
                      </div>
                      {profile.home_ground && (
                        <p className="mt-1 text-xs text-gray-500">{profile.home_ground}</p>
                      )}
                    </div>
                    {profile.member_count != null && (
                      <span className="text-xs text-gray-400">{profile.member_count}名</span>
                    )}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
