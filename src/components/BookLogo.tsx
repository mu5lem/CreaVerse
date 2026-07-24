export function BookLogo({ className, size = 40 }: { className?: string; size?: number }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* book spine shadow */}
      <path
        d="M24 10 L24 40"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        opacity="0.35"
      />
      {/* left page */}
      <path
        d="M24 10 C 18 8, 12 8, 6 10 L 6 38 C 12 36, 18 36, 24 38 Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
        fill="none"
      />
      {/* right page */}
      <path
        d="M24 10 C 30 8, 36 8, 42 10 L 42 38 C 36 36, 30 36, 24 38 Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
        fill="none"
      />
      {/* accent spark */}
      <circle cx="24" cy="6" r="1.5" fill="var(--color-ember)" />
    </svg>
  );
}
