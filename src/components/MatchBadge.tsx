interface MatchBadgeProps {
  percentage: number;
}

export default function MatchBadge({ percentage }: MatchBadgeProps) {
  let color = "bg-stone-200 text-stone-600";
  if (percentage >= 85) color = "bg-green-100 text-green-800";
  else if (percentage >= 70) color = "bg-amber-100 text-amber-800";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${color}`}
    >
      {percentage}% match
    </span>
  );
}
