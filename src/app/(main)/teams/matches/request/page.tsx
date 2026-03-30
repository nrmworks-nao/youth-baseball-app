"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const DEMO_TEAMS = [
  { id: "t1", name: "東ライオンズ" },
  { id: "t2", name: "南イーグルス" },
  { id: "t3", name: "北スターズ" },
  { id: "t4", name: "西ドラゴンズ" },
];

export default function MatchRequestPage() {
  const [toTeam, setToTeam] = useState("");
  const [format, setFormat] = useState("practice_match");
  const [venue, setVenue] = useState("");
  const [message, setMessage] = useState("");
  const [dates, setDates] = useState([{ date: "", startTime: "", endTime: "" }]);

  const addDate = () => {
    if (dates.length < 5) {
      setDates([...dates, { date: "", startTime: "", endTime: "" }]);
    }
  };

  const removeDate = (index: number) => {
    setDates(dates.filter((_, i) => i !== index));
  };

  const updateDate = (index: number, field: string, value: string) => {
    setDates(dates.map((d, i) => (i === index ? { ...d, [field]: value } : d)));
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-3">
        <Link href="/teams/matches" className="text-gray-400">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <h2 className="text-base font-bold text-gray-900">練習試合申し込み</h2>
      </div>

      <div className="space-y-4 p-4">
        <Card className="p-4">
          <div className="space-y-3">
            <Select label="相手チーム" value={toTeam} onChange={(e) => setToTeam(e.target.value)}>
              <option value="">チームを選択...</option>
              {DEMO_TEAMS.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </Select>

            <Select label="形式" value={format} onChange={(e) => setFormat(e.target.value)}>
              <option value="practice_match">練習試合</option>
              <option value="joint_practice">合同練習</option>
            </Select>

            <Input
              label="会場（希望）"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="グラウンド名など"
            />
          </div>
        </Card>

        {/* 日程候補 */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">希望日時（複数候補）</h3>
            <Button size="sm" variant="outline" onClick={addDate} disabled={dates.length >= 5}>
              + 追加
            </Button>
          </div>
          <div className="mt-3 space-y-3">
            {dates.map((d, index) => (
              <div key={index} className="rounded-lg border border-gray-200 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">候補{index + 1}</span>
                  {dates.length > 1 && (
                    <button onClick={() => removeDate(index)} className="text-xs text-red-500">
                      削除
                    </button>
                  )}
                </div>
                <div className="mt-2 space-y-2">
                  <Input
                    label="日付"
                    type="date"
                    value={d.date}
                    onChange={(e) => updateDate(index, "date", e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      label="開始時間"
                      type="time"
                      value={d.startTime}
                      onChange={(e) => updateDate(index, "startTime", e.target.value)}
                    />
                    <Input
                      label="終了時間"
                      type="time"
                      value={d.endTime}
                      onChange={(e) => updateDate(index, "endTime", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <Textarea
            label="メッセージ（任意）"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="ご連絡事項があれば..."
          />
        </Card>

        <Button className="w-full" size="lg" disabled={!toTeam || dates.every((d) => !d.date)}>
          申し込みを送信
        </Button>
      </div>
    </div>
  );
}
