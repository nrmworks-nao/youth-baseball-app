"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error-display";
import { useCurrentTeam } from "@/hooks/useCurrentTeam";
import { usePermission } from "@/hooks/usePermission";
import {
  searchTeams,
  getFavoriteTeams,
  getFavoriteTeamProfiles,
  addFavoriteTeam,
  removeFavoriteTeam,
} from "@/lib/supabase/queries/inter-team";
import { supabase } from "@/lib/supabase/client";
import { getErrorMessage } from "@/lib/supabase/error-handler";
import type { TeamProfile } from "@/types";

const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県',
  '岐阜県', '静岡県', '愛知県', '三重県',
  '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県',
  '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県',
  '福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
];
const LEAGUES = ["", "少年野球連盟A", "少年野球連盟B", "少年野球連盟C"];

export default function TeamSearchPage() {
  const { currentMembership, isLoading: teamLoading } = useCurrentTeam();
  const { canManageInterTeam } = usePermission(currentMembership?.permission_group ?? null, currentMembership?.is_admin ?? false);
  const [keyword, setKeyword] = useState("");
  const [region, setRegion] = useState("");
  const [league, setLeague] = useState("");
  const [results, setResults] = useState<TeamProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // お気に入り関連state
  const [userId, setUserId] = useState<string | null>(null);
  const [favoriteTeamIds, setFavoriteTeamIds] = useState<Set<string>>(new Set());
  const [favoriteProfiles, setFavoriteProfiles] = useState<TeamProfile[]>([]);
  const [togglingFavorite, setTogglingFavorite] = useState<Set<string>>(new Set());

  // ユーザーID取得 & お気に入り初期読み込み
  useEffect(() => {
    async function loadUserAndFavorites() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      try {
        const ids = await getFavoriteTeams(user.id);
        setFavoriteTeamIds(new Set(ids));
        if (ids.length > 0) {
          const profiles = await getFavoriteTeamProfiles(ids);
          setFavoriteProfiles(profiles);
        }
      } catch {
        // お気に入り読み込み失敗は静かに無視
      }
    }
    loadUserAndFavorites();
  }, []);

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

  const handleToggleFavorite = useCallback(async (e: React.MouseEvent, teamId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!userId || togglingFavorite.has(teamId)) return;

    setTogglingFavorite((prev) => new Set(prev).add(teamId));
    const isFav = favoriteTeamIds.has(teamId);

    try {
      if (isFav) {
        await removeFavoriteTeam(userId, teamId);
        setFavoriteTeamIds((prev) => {
          const next = new Set(prev);
          next.delete(teamId);
          return next;
        });
        setFavoriteProfiles((prev) => prev.filter((p) => p.team_id !== teamId));
      } else {
        await addFavoriteTeam(userId, teamId);
        setFavoriteTeamIds((prev) => new Set(prev).add(teamId));
        // お気に入りプロフィールに追加（検索結果 or お気に入りセクションから探す）
        const profile = results.find((p) => p.team_id === teamId);
        if (profile) {
          setFavoriteProfiles((prev) => [...prev, profile]);
        } else {
          // 検索結果にない場合は再取得
          const profiles = await getFavoriteTeamProfiles([teamId]);
          if (profiles.length > 0) {
            setFavoriteProfiles((prev) => [...prev, profiles[0]]);
          }
        }
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setTogglingFavorite((prev) => {
        const next = new Set(prev);
        next.delete(teamId);
        return next;
      });
    }
  }, [userId, favoriteTeamIds, togglingFavorite, results]);

  const myTeamId = currentMembership?.team.id;

  const renderTeamCard = (profile: TeamProfile, showFavoriteButton: boolean) => (
    <Link key={profile.team_id} href={`/teams/${profile.team_id}/profile`}>
      <Card className="p-4 transition-colors hover:bg-gray-50">
        <div className="flex items-start gap-3">
          {profile.team?.logo_url ? (
            <Image
              src={profile.team.logo_url}
              alt={profile.team?.name ?? "チームロゴ"}
              width={48}
              height={48}
              className="shrink-0 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-lg text-gray-400">
              ⚾
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-gray-900">{profile.team?.name ?? "チーム"}</h3>
                {myTeamId && profile.team_id === myTeamId && (
                  <Badge variant="primary">自チーム</Badge>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {profile.member_count != null && (
                  <span className="text-xs text-gray-400">{profile.member_count}名</span>
                )}
                {showFavoriteButton && userId && (
                  <button
                    type="button"
                    onClick={(e) => handleToggleFavorite(e, profile.team_id)}
                    disabled={togglingFavorite.has(profile.team_id)}
                    className="p-1 transition-colors disabled:opacity-50"
                    aria-label={favoriteTeamIds.has(profile.team_id) ? "お気に入り解除" : "お気に入り追加"}
                  >
                    <Heart
                      className={`h-5 w-5 ${
                        favoriteTeamIds.has(profile.team_id)
                          ? "fill-red-500 text-red-500"
                          : "text-gray-300 hover:text-red-300"
                      }`}
                    />
                  </button>
                )}
              </div>
            </div>
            <div className="mt-1 flex flex-wrap gap-1">
              {profile.team?.region && <Badge variant="default">{profile.team.region}</Badge>}
              {profile.team?.league && <Badge variant="practice">{profile.team.league}</Badge>}
            </div>
            {profile.introduction && (
              <p className="mt-1 line-clamp-2 text-xs text-gray-600">{profile.introduction}</p>
            )}
            {profile.home_ground && (
              <p className="mt-1 text-xs text-gray-500">📍 {profile.home_ground}</p>
            )}
            {profile.practice_schedule && (
              <p className="mt-1 text-xs text-gray-500">📅 {profile.practice_schedule}</p>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );

  if (teamLoading) return <Loading className="min-h-screen" />;
  if (!canManageInterTeam()) return <ErrorDisplay message="権限がありません" />;

  return (
    <div className="flex flex-col">
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <h2 className="text-base font-bold text-gray-900">チーム検索</h2>
      </div>

      {/* お気に入りチームセクション */}
      {favoriteProfiles.length > 0 && (
        <div className="space-y-2 p-4 pb-0">
          <h3 className="text-sm font-bold text-gray-700">お気に入りチーム</h3>
          {favoriteProfiles.map((profile) => renderTeamCard(profile, true))}
        </div>
      )}

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
            {PREFECTURES.map((r) => (
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
          {results.map((profile) => renderTeamCard(profile, true))}
        </div>
      )}
    </div>
  );
}
