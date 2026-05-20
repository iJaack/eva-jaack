"use client";

function scoreColor(score: number): string {
  if (score >= 75) return "var(--color-success)";
  if (score >= 50) return "var(--color-warning)";
  if (score >= 25) return "var(--color-caution)";
  return "var(--color-danger)";
}

export default function TrustScore({
  score,
  size = 80,
  label,
}: {
  score: number;
  size?: number;
  label?: string;
}) {
  const color = scoreColor(score);
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = (score / 100) * circumference;

  return (
    <div className="trust-score" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--faint)"
          strokeWidth={4}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeDasharray={`${filled} ${circumference - filled}`}
          strokeDashoffset={circumference / 4}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray var(--dur-slow) var(--ease-out)" }}
        />
      </svg>
      <div className="trust-score-value" style={{ color }}>
        {score}
      </div>
      {label && <div className="trust-score-label">{label}</div>}
    </div>
  );
}

export function ScoreBadge({
  score,
  label,
}: {
  score: number;
  label?: string;
}) {
  const color = scoreColor(score);
  return (
    <span
      className="score-badge"
      style={{
        background: `color-mix(in oklch, ${color} 14%, transparent)`,
        color,
        borderColor: `color-mix(in oklch, ${color} 40%, transparent)`,
      }}
    >
      {label ? `${label}: ` : ""}
      {score}
    </span>
  );
}
