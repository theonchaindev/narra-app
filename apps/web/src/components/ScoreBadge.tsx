"use client";

interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

export function ScoreBadge({ score, size = "md" }: ScoreBadgeProps) {
  const getColor = () => {
    if (score >= 70) return "text-green-400 bg-green-400/10 border-green-400/30";
    if (score >= 45) return "text-yellow-400 bg-yellow-400/10 border-yellow-400/30";
    return "text-orange-400 bg-orange-400/10 border-orange-400/30";
  };

  const getLabel = () => {
    if (score >= 70) return "High Signal";
    if (score >= 45) return "Medium";
    return "Low";
  };

  const sizeClass = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-0.5",
    lg: "text-base px-3 py-1",
  }[size];

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${getColor()} ${sizeClass}`}>
      <span className="font-mono font-bold">{score}</span>
      <span className="opacity-70">{getLabel()}</span>
    </div>
  );
}
