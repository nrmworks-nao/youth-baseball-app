"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LineSettingsPage() {
  const [groupId, setGroupId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [isActive, setIsActive] = useState(false);

  // 通知項目のON/OFF
  const [notifyPost, setNotifyPost] = useState(true);
  const [notifyEvent, setNotifyEvent] = useState(true);
  const [notifyPayment, setNotifyPayment] = useState(true);
  const [notifyShop, setNotifyShop] = useState(false);
  const [batchMode, setBatchMode] = useState(false);

  const notifyItems = [
    { key: "post", label: "投稿・連絡", value: notifyPost, setter: setNotifyPost },
    { key: "event", label: "イベント・予定", value: notifyEvent, setter: setNotifyEvent },
    { key: "payment", label: "会費・集金", value: notifyPayment, setter: setNotifyPayment },
    { key: "shop", label: "おすすめ商品", value: notifyShop, setter: setNotifyShop },
  ];

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-3">
        <Link href="/settings" className="text-gray-400">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <h2 className="text-base font-bold text-gray-900">LINE連携設定</h2>
      </div>

      <div className="space-y-4 p-4">
        {/* Bot設定 */}
        <Card>
          <CardHeader>
            <CardTitle>LINE Bot設定</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Input
                label="LINEグループID"
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                placeholder="Cxxxxxxxxxx..."
              />
              <p className="text-xs text-gray-400">
                Botをグループに招待すると自動で取得されます
              </p>
              <Input
                label="チャネルアクセストークン"
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="LINE Developers で取得"
              />
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">LINE通知を有効にする</span>
                <button
                  onClick={() => setIsActive(!isActive)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    isActive ? "bg-green-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                      isActive ? "translate-x-5" : ""
                    }`}
                  />
                </button>
              </div>
              <Button className="w-full">保存</Button>
            </div>
          </CardContent>
        </Card>

        {/* 通知項目設定 */}
        <Card>
          <CardHeader>
            <CardTitle>通知項目</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notifyItems.map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{item.label}</span>
                  <button
                    onClick={() => item.setter(!item.value)}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      item.value ? "bg-green-600" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                        item.value ? "translate-x-5" : ""
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* まとめ通知モード */}
        <Card>
          <CardHeader>
            <CardTitle>まとめ通知</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700">まとめ通知モード</p>
                <p className="text-xs text-gray-400">
                  通知をまとめて1日1回送信します
                </p>
              </div>
              <button
                onClick={() => setBatchMode(!batchMode)}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  batchMode ? "bg-green-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                    batchMode ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
