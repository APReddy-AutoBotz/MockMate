
import React from 'react';

interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
    iconOnly?: boolean;
    className?: string;
}

export const Logo = ({ className = '', iconOnly = false, ...props }: LogoProps) => {
    // Brand Colors
    const ACTION_TEAL = "#14C8B0";
    const INFO_BLUE = "#38BDF8";
    const TEXT_PRIMARY = "#E6F1F8";
    const ICON_NAVY = "#020617";
    const M_STROKE = "#CBD5E1";

    return (
        <div className={`flex items-center ${className}`} {...props}>
            <svg
                viewBox={iconOnly ? "0 0 512 512" : "0 0 3000 512"}
                xmlns="http://www.w3.org/2000/svg"
                role="img"
                aria-label="MockMate Logo"
                className="h-full w-auto"
                preserveAspectRatio="xMinYMid meet"
            >
                <defs>
                    <linearGradient id="tieGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F97316" />
                        <stop offset="100%" stopColor="#EA580C" />
                    </linearGradient>
                </defs>

                {/* ICON: PROFESSIONAL M + TIE */}
                <g>
                    <rect x="64" y="64" width="384" height="384" rx="80" fill={ICON_NAVY} />
                    
                    {/* M structure */}
                    <path 
                        d="M156 360V190L256 290L356 190V360"
                        fill="none" 
                        stroke={M_STROKE} 
                        strokeWidth="38" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                    />

                    {/* Tie */}
                    <polygon points="256,225 232,255 256,285 280,255" fill="url(#tieGradient)" />
                    <polygon points="244,285 268,285 256,360" fill="url(#tieGradient)" />
                </g>

                {/* WORDMARK - Increased spacing to 900 for premium balance */}
                {!iconOnly && (
                    <g transform="translate(900, 275)">
                        {/* 'Mock' - Heavy White */}
                        <text 
                            x="0" 
                            y="0"
                            fontFamily="Inter, system-ui, sans-serif"
                            fontSize="230"
                            fontWeight="900"
                            letterSpacing="-12"
                            fill={TEXT_PRIMARY}
                        >
                            Mock<tspan fill={ACTION_TEAL}>Mate</tspan>
                        </text>

                        {/* Tagline - Professional Alignment */}
                        <text 
                            x="8" 
                            y="115"
                            fontFamily="Inter, system-ui, sans-serif"
                            fontSize="52"
                            fontWeight="800"
                            letterSpacing="24"
                            fill={INFO_BLUE}
                            style={{ textTransform: 'uppercase' }}
                        >
                            Ace Your Interview
                        </text>
                    </g>
                )}
            </svg>
        </div>
    );
};
