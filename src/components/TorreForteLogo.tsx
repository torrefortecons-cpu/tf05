import React from 'react';

interface TorreForteLogoProps {
  className?: string;
  classNameBg?: string;
}

export default function TorreForteLogo({ className = "w-5 h-5", classNameBg = "text-[#C67C3E]" }: TorreForteLogoProps) {
  return (
    <svg 
      viewBox="0 0 120 120" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      {/* Pitched Roof outline */}
      <path 
        d="M 12 60 L 60 18 L 108 60" 
        stroke="currentColor" 
        strokeWidth="5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      
      {/* House walls and floor */}
      <path 
        d="M 22 62 L 22 108 L 98 108 L 98 62" 
        stroke="currentColor" 
        strokeWidth="5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />

      {/* Connection Lines of the Network Nodes (Smart Home grid) */}
      {/* Center node top */}
      <path d="M 60 38 L 60 66" stroke="currentColor" strokeWidth="2.5" />
      {/* Side nodes connected to center */}
      <path d="M 60 48 L 48 48" stroke="currentColor" strokeWidth="2" />
      <path d="M 60 58 L 36 58" stroke="currentColor" strokeWidth="2" />
      <path d="M 60 76 M 38 76 L 48 76" stroke="currentColor" strokeWidth="2" />
      <path d="M 38 88 L 48 88" stroke="currentColor" strokeWidth="2" />
      <path d="M 60 90 L 60 98" stroke="currentColor" strokeWidth="2" strokeDasharray="none" />
      <path d="M 72 82 L 86 82" stroke="currentColor" strokeWidth="2" />
      <path d="M 76 42 L 76 66 L 90 66" stroke="currentColor" strokeWidth="2" />
      <path d="M 17 68 M 16 68 L 16 93 L 21 93" stroke="currentColor" strokeWidth="2" />

      {/* Central TV Screen with mount */}
      <g>
        <rect x="44" y="66" width="32" height="19" rx="1.5" fill="currentColor" />
        <line x1="44" y1="87" x2="76" y2="87" stroke="currentColor" strokeWidth="2" />
        <text 
          x="60" 
          y="78" 
          fill="white" 
          fontSize="8" 
          fontWeight="bold" 
          textAnchor="middle" 
          fontFamily="system-ui, sans-serif"
          className="select-none"
        >
          TV
        </text>
      </g>

      {/* Climate Indoor split unit (Left wall inside) */}
      <rect x="23" y="62" width="6" height="13" rx="1" fill="#C67C3E" className={classNameBg} />
      {/* AC waves representation */}
      <path d="M 31 65 L 33 65" stroke="currentColor" strokeWidth="1" />
      <path d="M 31 68 L 33 68" stroke="currentColor" strokeWidth="1" />
      <path d="M 31 71 L 33 71" stroke="currentColor" strokeWidth="1" />

      {/* Climate Outdoor condenser unit (Left wall outside) */}
      <rect x="11" y="93" width="9" height="14" rx="1.5" fill="#C67C3E" className={classNameBg} />
      <circle cx="15.5" cy="100" r="3" stroke="white" strokeWidth="1" />
      <line x1="15.5" y1="97.5" x2="15.5" y2="102.5" stroke="white" strokeWidth="1" />
      <line x1="13" y1="100" x2="18" y2="100" stroke="white" strokeWidth="1" />

      {/* Security Camera unit (Right wall outside) */}
      <g transform="translate(98, 65)">
        <path d="M 0 5 L -2 5" stroke="currentColor" strokeWidth="2" />
        <rect x="0" y="0" width="12" height="7" rx="1" fill="#C67C3E" className={classNameBg} />
        {/* camera lens/front */}
        <polygon points="12,1 15,0 15,7 12,6" fill="#C67C3E" className={classNameBg} />
      </g>

      {/* Yellow/Gold Smart Nodes */}
      <circle cx="60" cy="33" r="4.5" fill="#C67C3E" className={classNameBg} />
      <circle cx="48" cy="48" r="4.5" fill="#C67C3E" className={classNameBg} />
      <circle cx="32" cy="58" r="4.5" fill="#C67C3E" className={classNameBg} />
      <circle cx="34" cy="76" r="4.5" fill="#C67C3E" className={classNameBg} />
      <circle cx="34" cy="88" r="4.5" fill="#C67C3E" className={classNameBg} />
      <circle cx="50" cy="90" r="4.5" fill="#C67C3E" className={classNameBg} />
      <circle cx="66" cy="90" r="4.5" fill="#C67C3E" className={classNameBg} />
      <circle cx="60" cy="100" r="4.5" fill="#C67C3E" className={classNameBg} />
      <circle cx="86" cy="82" r="4.5" fill="#C67C3E" className={classNameBg} />
      <circle cx="76" cy="42" r="4.5" fill="#C67C3E" className={classNameBg} />
    </svg>
  );
}
