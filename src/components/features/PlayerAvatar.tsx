"use client";

interface PlayerAvatarProps {
  player: {
    name: string;
    card_photo_url?: string | null;
    number?: number;
  };
  size?: "sm" | "md" | "lg" | "xl";
  showNumber?: boolean;
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-12 h-12 text-sm",
  lg: "w-16 h-16 text-lg",
  xl: "w-24 h-24 text-2xl",
};

const numberSizeClasses = {
  sm: "w-4 h-4 text-[8px] -bottom-0.5 -right-0.5",
  md: "w-5 h-5 text-xs -bottom-1 -right-1",
  lg: "w-6 h-6 text-xs -bottom-1 -right-1",
  xl: "w-7 h-7 text-sm -bottom-1 -right-1",
};

export function PlayerAvatar({
  player,
  size = "md",
  showNumber = false,
}: PlayerAvatarProps) {
  const initial = player.name.charAt(0);

  return (
    <div className="relative flex-shrink-0">
      {player.card_photo_url ? (
        <img
          src={player.card_photo_url}
          alt={player.name}
          className={`${sizeClasses[size]} rounded-full object-cover border-2 border-gray-200`}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} rounded-full bg-green-100 text-green-700 font-bold flex items-center justify-center border-2 border-gray-200`}
        >
          {initial}
        </div>
      )}
      {showNumber && player.number != null && (
        <span
          className={`absolute ${numberSizeClasses[size]} bg-gray-800 text-white rounded-full flex items-center justify-center font-bold`}
        >
          {player.number}
        </span>
      )}
    </div>
  );
}
