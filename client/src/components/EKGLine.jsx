export default function EKGLine({ className = '' }) {
  return (
    <div className={`ekg-container w-full h-8 ${className}`}>
      <svg
        viewBox="0 0 600 40"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <path
          d="M0,20 L50,20 L60,20 L70,10 L80,30 L90,5 L100,35 L110,20 L120,20 L170,20 L180,20 L190,10 L200,30 L210,5 L220,35 L230,20 L240,20 L290,20 L300,20 L310,10 L320,30 L330,5 L340,35 L350,20 L360,20 L410,20 L420,20 L430,10 L440,30 L450,5 L460,35 L470,20 L480,20 L530,20 L540,20 L550,10 L560,30 L570,5 L580,35 L590,20 L600,20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="ekg-line text-healthcare-500 dark:text-healthcare-400"
        />
      </svg>
    </div>
  );
}
