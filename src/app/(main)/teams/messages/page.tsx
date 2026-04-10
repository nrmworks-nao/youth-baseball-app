"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { ErrorDisplay } from "@/components/ui/error-display";
import { useCurrentTeam } from "@/hooks/useCurrentTeam";
import { usePermission } from "@/hooks/usePermission";
import {
  getInterTeamMessages,
  getMessageThread,
  sendInterTeamMessage,
  markMessageAsRead,
} from "@/lib/supabase/queries/inter-team";
import { supabase } from "@/lib/supabase/client";
import { getErrorMessage } from "@/lib/supabase/error-handler";
import type { InterTeamMessage } from "@/types";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "今日";
  if (days === 1) return "昨日";
  return `${days}日前`;
}

export default function TeamMessagesPage() {
  const router = useRouter();
  const { currentTeam, currentMembership, isLoading: teamLoading } = useCurrentTeam();
  const { canManageInterTeam } = usePermission(currentMembership?.permission_group ?? null, currentMembership?.is_admin ?? false);

  const [threads, setThreads] = useState<InterTeamMessage[]>([]);
  const [selectedThread, setSelectedThread] = useState<InterTeamMessage | null>(null);
  const [threadMessages, setThreadMessages] = useState<InterTeamMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 新規作成フォーム
  const [showCompose, setShowCompose] = useState(false);
  const [toTeamId, setToTeamId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [isSending, setIsSending] = useState(false);

  const fetchThreads = useCallback(async () => {
    if (!currentTeam) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getInterTeamMessages(currentTeam.id);
      setThreads(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [currentTeam]);

  useEffect(() => {
    if (!teamLoading && currentTeam) {
      fetchThreads();
    }
  }, [teamLoading, currentTeam, fetchThreads]);

  const openThread = async (thread: InterTeamMessage) => {
    setSelectedThread(thread);
    try {
      const messages = await getMessageThread(thread.id);
      setThreadMessages(messages);
      // 受信メッセージを既読に
      if (!thread.is_read && thread.to_team_id === currentTeam?.id) {
        await markMessageAsRead(thread.id);
        setThreads((prev) =>
          prev.map((t) => (t.id === thread.id ? { ...t, is_read: true } : t))
        );
      }
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleSend = async () => {
    if (!currentTeam || !toTeamId.trim() || !subject.trim() || !body.trim()) return;
    setIsSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await sendInterTeamMessage({
        from_team_id: currentTeam.id,
        to_team_id: toTeamId.trim(),
        sender_id: user.id,
        subject: subject.trim(),
        body: body.trim(),
      });
      setShowCompose(false);
      setToTeamId("");
      setSubject("");
      setBody("");
      await fetchThreads();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSending(false);
    }
  };

  const handleReply = async () => {
    if (!currentTeam || !selectedThread || !replyBody.trim()) return;
    setIsSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const toTeamId = selectedThread.from_team_id === currentTeam.id
        ? selectedThread.to_team_id
        : selectedThread.from_team_id;
      await sendInterTeamMessage({
        from_team_id: currentTeam.id,
        to_team_id: toTeamId,
        sender_id: user.id,
        subject: `Re: ${selectedThread.subject}`,
        body: replyBody.trim(),
        parent_message_id: selectedThread.id,
      });
      setReplyBody("");
      const messages = await getMessageThread(selectedThread.id);
      setThreadMessages(messages);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSending(false);
    }
  };

  if (teamLoading || isLoading) {
    return <Loading text="メッセージを読み込み中..." />;
  }
  if (!canManageInterTeam()) {
    return <ErrorDisplay message="権限がありません" />;
  }

  if (error) {
    return <ErrorDisplay message={error} onRetry={fetchThreads} />;
  }

  if (!currentTeam) {
    return <ErrorDisplay title="チーム未選択" message="チームを選択してください。" />;
  }

  // スレッド詳細表示
  if (selectedThread) {
    return (
      <div className="flex flex-col">
        <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-3">
          <button onClick={() => setSelectedThread(null)} className="text-gray-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h2 className="text-base font-bold text-gray-900 truncate">{selectedThread.subject}</h2>
        </div>

        <div className="flex-1 space-y-3 p-4">
          {threadMessages.map((msg) => {
            const isOwn = msg.from_team_id === currentTeam.id;
            const senderName = (msg as unknown as { users?: { display_name: string } }).users?.display_name ?? "不明";
            return (
              <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-lg p-3 ${isOwn ? "bg-green-100" : "bg-gray-100"}`}>
                  <p className="text-xs font-medium text-gray-500">{senderName}</p>
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{msg.body}</p>
                  <p className="mt-1 text-[10px] text-gray-400">{timeAgo(msg.created_at)}</p>
                </div>
              </div>
            );
          })}
        </div>

        {canManageInterTeam() && (
          <div className="border-t border-gray-200 bg-white p-4">
            <div className="flex gap-2">
              <Textarea
                label=""
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                placeholder="返信を入力..."
                className="flex-1"
              />
              <Button onClick={handleReply} disabled={!replyBody.trim() || isSending}>
                送信
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className="flex items-center text-gray-600 hover:text-gray-900">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h2 className="text-base font-bold text-gray-900">チーム間メッセージ</h2>
        </div>
        {canManageInterTeam() && (
          <Button size="sm" onClick={() => setShowCompose(!showCompose)}>
            {showCompose ? "閉じる" : "+ 新規"}
          </Button>
        )}
      </div>

      <div className="space-y-4 p-4">
        {/* 新規作成フォーム */}
        {showCompose && (
          <Card className="p-4">
            <h3 className="mb-3 text-sm font-medium text-gray-900">新しいメッセージ</h3>
            <div className="space-y-3">
              <Input label="宛先チームID" value={toTeamId} onChange={(e) => setToTeamId(e.target.value)} placeholder="チームIDを入力..." />
              <Input label="件名" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="件名" />
              <Textarea label="本文" value={body} onChange={(e) => setBody(e.target.value)} placeholder="メッセージ本文..." />
              <Button className="w-full" onClick={handleSend} disabled={isSending || !toTeamId.trim() || !subject.trim() || !body.trim()}>
                {isSending ? "送信中..." : "送信"}
              </Button>
            </div>
          </Card>
        )}

        {/* スレッド一覧 */}
        {threads.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">メッセージはありません</p>
        ) : (
          threads.map((thread) => {
            const isIncoming = thread.to_team_id === currentTeam.id;
            const fromTeamName = (thread as unknown as { from_team?: { name: string } }).from_team?.name ?? "不明";
            const toTeamName = (thread as unknown as { to_team?: { name: string } }).to_team?.name ?? "不明";
            return (
              <button
                key={thread.id}
                onClick={() => openThread(thread)}
                className="w-full text-left"
              >
                <Card
                  className={`p-4 transition-colors hover:bg-gray-50 ${
                    !thread.is_read && isIncoming ? "bg-green-50/50" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant={isIncoming ? "practice" : "default"}>
                          {isIncoming ? "受信" : "送信"}
                        </Badge>
                        <span className="truncate text-sm font-medium text-gray-900">
                          {thread.subject}
                        </span>
                        {!thread.is_read && isIncoming && (
                          <span className="h-2 w-2 flex-shrink-0 rounded-full bg-green-500" />
                        )}
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        {isIncoming ? fromTeamName : `→ ${toTeamName}`}
                      </p>
                      <p className="mt-1 text-xs text-gray-400 line-clamp-1">
                        {thread.body}
                      </p>
                    </div>
                    <span className="flex-shrink-0 text-[10px] text-gray-400">
                      {timeAgo(thread.created_at)}
                    </span>
                  </div>
                </Card>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
