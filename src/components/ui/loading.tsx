import { cn } from "@/lib/utils/cn";

interface LoadingProps {
  className?: string;
  text?: string;
}

export function Loading({ className, text = "読み込み中..." }: LoadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-12",
        className
      )}
    >
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-green-600" />
      <p className="text-sm text-gray-500">{text}</p>
    </div>
  );
}

export function PageLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loading />
    </div>
  );
}
