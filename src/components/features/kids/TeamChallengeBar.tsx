"use client";

import { cn } from "@/lib/utils/cn";
import type { TeamChallenge } from "@/types";

interface TeamChallengeBarProps {
  challenge: TeamChallenge;
  className?: string;
}

export function TeamChallengeBar({
  challenge,
  className,
}: TeamChallengeBarProps) {
  const progress = Math.min(
    (challenge.current_value / challenge.target_value) * 100,
    100
  );
  const isCompleted = challenge.current_value >= challenge.target_value;

  return (
    <div
      className={cn(
        "rounded-xl border-2 p-3",
        isCompleted
          ? "border-yellow-400 bg-gradient-to-r from-yellow-50 to-amber-50"
          : "border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50",
        className
      )}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-base">{isCompleted ? "🎉" : "🎯"}</span>
          <span className="text-sm font-bold text-gray-900">
            {challenge.title}
          </span>
        </div>
        <span className="text-xs font-medium text-gray-500">
          {challenge.current_value} / {challenge.target_value}
        </span>
      </div>

      {/* プログレスバー */}
      <div className="relative h-4 overflow-hidden rounded-full bg-gray-200">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            isCompleted
              ? "bg-gradient-to-r from-yellow-400 to-amber-500"
              : "bg-gradient-to-r from-blue-400 to-indigo-500"
          )}
          style={{ width: `${progress}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-bold text-white drop-shadow-sm">
            {Math.round(progress)}%
          </span>
        </div>
      </div>

      {challenge.description && (
        <p className="mt-1.5 text-xs text-gray-500">{challenge.description}</p>
      )}

      {isCompleted && (
        <div className="mt-2 rounded-lg bg-yellow-100 px-2 py-1 text-center text-xs font-bold text-yellow-800">
          達成おめでとう！
        </div>
      )}
    </div>
  );
}
