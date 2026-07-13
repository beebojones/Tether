// The Tether mark — "Bond": two nodes, one taut line (John's pick, 2026-07-12).
// Drawn inline so it inherits currentColor; sits on the brand-gradient tiles.
export default function TetherMark({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      stroke="currentColor"
      strokeWidth="52"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="168" cy="256" r="92" />
      <circle cx="400" cy="256" r="44" />
      <line x1="260" y1="256" x2="356" y2="256" />
    </svg>
  );
}
