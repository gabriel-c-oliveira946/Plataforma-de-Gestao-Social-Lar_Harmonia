import React from 'react';

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
  variant?: 'full' | 'icon';
  showText?: boolean;
  textColor?: string;
}

export default function LarHarmoniaLogo({
  size = 40,
  className = '',
  variant = 'icon',
  showText = false,
  textColor = 'text-gray-900',
  ...props
}: LogoProps) {
  const iconSvg = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform duration-200 ${className}`}
      {...props}
    >
      <defs>
        {/* Gradiente da metade esquerda (Menta / Seafoam Translúcido) */}
        <linearGradient id="lhMintGradient" x1="20%" y1="15%" x2="80%" y2="90%">
          <stop offset="0%" stopColor="#A8EFE0" />
          <stop offset="40%" stopColor="#70DBC4" />
          <stop offset="85%" stopColor="#48C3AA" />
          <stop offset="100%" stopColor="#36AA93" />
        </linearGradient>

        {/* Brilho suave da borda esquerda */}
        <linearGradient id="lhMintGlow" x1="0%" y1="30%" x2="100%" y2="70%">
          <stop offset="0%" stopColor="#D5FFF7" stopOpacity="0.85" />
          <stop offset="50%" stopColor="#87E5D0" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#3EBAA0" stopOpacity="0.1" />
        </linearGradient>

        {/* Gradiente da metade direita (Teal / Verde Petróleo Profundo 3D) */}
        <linearGradient id="lhTealGradient" x1="50%" y1="10%" x2="90%" y2="95%">
          <stop offset="0%" stopColor="#2A8B97" />
          <stop offset="40%" stopColor="#1C7480" />
          <stop offset="85%" stopColor="#155D67" />
          <stop offset="100%" stopColor="#0E454D" />
        </linearGradient>

        {/* Face superior chanfrada do bloco 3D (Bisel Superior) */}
        <linearGradient id="lhTopBevel" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4EC2D0" />
          <stop offset="60%" stopColor="#2C919E" />
          <stop offset="100%" stopColor="#1E7582" />
        </linearGradient>

        {/* Sombra da parede interna do bloco 3D */}
        <linearGradient id="lhInnerWall" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0B373E" />
          <stop offset="100%" stopColor="#195F69" />
        </linearGradient>

        {/* Filtro de sombra sutil para profundidade */}
        <filter id="lhShadow" x="-10%" y="-10%" width="125%" height="125%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0A3C43" floodOpacity="0.18" />
        </filter>
      </defs>

      <g filter="url(#lhShadow)">
        {/* ========================================================
            1. METADE ESQUERDA: Arco curvo menta / seafoam vítreo
           ======================================================== */}
        <path
          d="M 96 34
             C 55 35, 29 65, 29 101
             C 29 125, 41 146, 72 166
             C 61 154, 52 135, 52 108
             C 52 82, 69 57, 96 52
             Z"
          fill="url(#lhMintGradient)"
        />

        {/* Realce vítreo na crista do arco menta */}
        <path
          d="M 96 34
             C 56 35, 33 64, 32 99
             C 32 114, 38 132, 54 148
             C 43 133, 39 116, 39 99
             C 39 68, 62 41, 96 36
             Z"
          fill="url(#lhMintGlow)"
        />

        {/* ========================================================
            2. METADE DIREITA: Bloco 3D curvo teal / verde petróleo
           ======================================================== */}
        
        {/* Arco principal frontal direito */}
        <path
          d="M 96 56
             L 105 56
             C 138 62, 158 87, 158 114
             C 158 138, 145 156, 123 169
             C 146 156, 171 133, 171 101
             C 171 63, 144 33, 105 28
             L 96 26
             Z"
          fill="url(#lhTealGradient)"
        />

        {/* Face chanfrada superior do bloco 3D direito (Destaque arquitetônico) */}
        <path
          d="M 96 26
             L 116 30
             C 132 34, 142 41, 147 48
             L 138 52
             C 130 45, 120 40, 105 38
             L 96 36
             Z"
          fill="url(#lhTopBevel)"
        />

        {/* Parede interna da junta central superior */}
        <path
          d="M 96 26
             L 96 56
             L 100 54
             L 100 34
             Z"
          fill="url(#lhInnerWall)"
          opacity="0.8"
        />

        {/* Friso de luz suave na curva externa direita */}
        <path
          d="M 116 30
             C 142 35, 169 64, 169 101
             C 169 123, 154 146, 134 161
             C 158 147, 172 124, 172 101
             C 172 63, 144 34, 116 30
             Z"
          fill="#5AD0DE"
          opacity="0.25"
        />
      </g>
    </svg>
  );

  if (variant === 'full' || showText) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {iconSvg}
        <div className="flex flex-col leading-tight">
          <span className={`font-bold text-base sm:text-lg tracking-tight ${textColor}`}>
            Lar Harmonia
          </span>
          <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">
            Gestão Social
          </span>
        </div>
      </div>
    );
  }

  return iconSvg;
}
