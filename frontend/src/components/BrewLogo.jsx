export default function BrewLogo({ size = 32, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`brew-logo ${className}`}
      aria-hidden="true"
    >
      {/* Outer ring */}
      <circle cx="16" cy="16" r="14.5" stroke="#d49463" strokeWidth="0.75"/>
      {/* Subtle inner accent */}
      <circle cx="16" cy="16" r="12" stroke="#d49463" strokeWidth="0.25" opacity="0.25"/>
      {/* Pour-over cone body */}
      <path
        d="M10.5 8.5 L16 20.5 L21.5 8.5"
        stroke="#d49463"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Horizontal filter ribs */}
      <line x1="12.5" y1="11.5" x2="19.5" y2="11.5" stroke="#d49463" strokeWidth="0.75" strokeLinecap="round" opacity="0.55"/>
      <line x1="14"   y1="14.5" x2="18"   y2="14.5" stroke="#d49463" strokeWidth="0.75" strokeLinecap="round" opacity="0.55"/>
      {/* Drip */}
      <circle cx="16" cy="23.5" r="1.25" fill="#d49463"/>
    </svg>
  );
}
