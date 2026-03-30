import { cn } from "@/lib/utils/cn";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-4",
  lg: "h-12 w-12 border-4",
};

export function LoadingSpinner({
  size = "md",
  className,
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        "animate-spin rounded-full border-gray-200 border-t-green-600",
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="読み込み中"
    />
  );
}

interface LoadingOverlayProps {
  text?: string;
}

export function LoadingOverlay({
  text = "読み込み中...",
}: LoadingOverlayProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <LoadingSpinner size="lg" />
      <p className="text-sm text-gray-500">{text}</p>
    </div>
  );
}
