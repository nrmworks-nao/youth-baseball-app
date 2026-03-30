"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const DEMO_TEAMS = [
  { id: "t1", name: "東ライオンズ", region: "東京都", league: "少年野球連盟A", member_count: 18, home_ground: "東公園グラウンド" },
  { id: "t2", name: "南イーグルス", region: "東京都", league: "少年野球連盟B", member_count: 15, home_ground: "南河川敷" },
  { id: "t3", name: "北スターズ", region: "埼玉県", league: "少年野球連盟A", member_count: 20, home_ground: "北市民球場" },
  { id: "t4", name: "西ドラゴンズ", region: "神奈川県", league: "少年野球連盟C", member_count: 12, home_ground: "西運動公園" },
];

const REGIONS = ["", "東京都", "埼玉県", "神奈川県", "千葉県"];
const LEAGUES = ["", "少年野球連盟A", "少年野球連盟B", "少年野球連盟C"];

export default function TeamSearchPage() {
  const [keyword, setKeyword] = useState("");
  const [region, setRegion] = useState("");
  const [league, setLeague] = useState("");

  const filtered = DEMO_TEAMS.filter((team) => {
    if (keyword && !team.name.includes(keyword) && !team.home_ground.includes(keyword)) return false;
    if (region && team.region !== region) return false;
    if (league && team.league !== league) return false;
    return true;
  });

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
      </div>

      {/* 結果 */}
      <div className="space-y-2 p-4">
        <p className="text-xs text-gray-500">{filtered.length}チームが見つかりました</p>
        {filtered.map((team) => (
          <Link key={team.id} href={`/teams/${team.id}/profile`}>
            <Card className="p-4 transition-colors hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{team.name}</h3>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <Badge variant="default">{team.region}</Badge>
                    <Badge variant="practice">{team.league}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{team.home_ground}</p>
                </div>
                <span className="text-xs text-gray-400">{team.member_count}名</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
