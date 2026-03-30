"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const PERMISSION_LABELS: Record<string, string> = {
  system_admin: "システム管理者",
  team_admin: "チーム管理者",
  vice_president: "副代表",
  treasurer: "会計担当",
  manager: "マネージャー",
  publicity: "広報担当",
  parent: "保護者",
};

const DEMO_MEMBERS = [
  { id: "m1", name: "山本太郎", permission_group: "team_admin", display_title: "監督" },
  { id: "m2", name: "田中次郎", permission_group: "manager", display_title: "コーチ" },
  { id: "m3", name: "佐藤花子", permission_group: "treasurer", display_title: "会計" },
  { id: "m4", name: "鈴木一郎", permission_group: "parent", display_title: "保護者" },
  { id: "m5", name: "高橋健太", permission_group: "parent", display_title: "保護者" },
  { id: "m6", name: "渡辺美咲", permission_group: "publicity", display_title: "広報" },
];

const DEMO_PENDING = [
  { id: "p1", name: "新規さん太郎", requested_at: "2026-03-29" },
];

export default function MembersPage() {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-3">
        <Link href="/settings" className="text-gray-400">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <h2 className="text-base font-bold text-gray-900">メンバー管理</h2>
      </div>

      <div className="space-y-4 p-4">
        {/* 参加承認待ち */}
        {DEMO_PENDING.length > 0 && (
          <Card className="border-l-4 border-l-orange-400">
            <CardHeader>
              <CardTitle>承認待ち</CardTitle>
            </CardHeader>
            <CardContent>
              {DEMO_PENDING.map((pending) => (
                <div key={pending.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{pending.name}</p>
                    <p className="text-xs text-gray-400">申請日: {pending.requested_at}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm">承認</Button>
                    <Button size="sm" variant="outline">拒否</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* メンバー一覧 */}
        <Card>
          <CardHeader>
            <CardTitle>メンバー一覧（{DEMO_MEMBERS.length}名）</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {DEMO_MEMBERS.map((member) => (
                <div key={member.id} className="rounded-lg border border-gray-100 p-3">
                  {editingId === member.id ? (
                    <MemberEditForm
                      member={member}
                      onClose={() => setEditingId(null)}
                    />
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900">{member.name}</p>
                          <Badge variant="primary">
                            {PERMISSION_LABELS[member.permission_group]}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500">表示: {member.display_title}</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(member.id)}>
                        編集
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MemberEditForm({
  member,
  onClose,
}: {
  member: { id: string; name: string; permission_group: string; display_title: string };
  onClose: () => void;
}) {
  const [permissionGroup, setPermissionGroup] = useState(member.permission_group);
  const [displayTitle, setDisplayTitle] = useState(member.display_title);

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-900">{member.name}</p>
      <Select label="権限グループ" value={permissionGroup} onChange={(e) => setPermissionGroup(e.target.value)}>
        {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
          <option key={key} value={key}>{label}</option>
        ))}
      </Select>
      <Input label="表示呼称" value={displayTitle} onChange={(e) => setDisplayTitle(e.target.value)} placeholder="例: 監督、コーチ" />
      <div className="flex gap-2">
        <Button size="sm" className="flex-1">保存</Button>
        <Button size="sm" variant="outline" className="flex-1" onClick={onClose}>キャンセル</Button>
      </div>
    </div>
  );
}
