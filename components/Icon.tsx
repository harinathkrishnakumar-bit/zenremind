
import React from 'react';

interface IconProps {
  name: 'calendar' | 'clock' | 'check' | 'plus' | 'trash' | 'edit' | 'alert' | 'star' | 'list' | 'target' | 'sparkles' | 'cake';
  className?: string;
}

export const Icon: React.FC<IconProps> = ({ name, className = "w-5 h-5" }) => {
  const paths: Record<string, React.ReactElement> = {
    calendar: <path d="M19 4H5c-1.11 0-1.99.9-1.99 2L3 18c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H5V10h14v8zm0-10H5V6h14v2z" />,
    clock: <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />,
    check: <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />,
    plus: <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />,
    trash: <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />,
    edit: <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />,
    alert: <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />,
    star: <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />,
    list: <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />,
    target: <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3-8c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3z" />,
    sparkles: <path d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61z" />,
    cake: <path d="M12 6a2 2 0 0 1 2 2c0 .38-.1.74-.29 1.05l-.09.13H15a3 3 0 0 1 3 3v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5a3 3 0 0 1 3-3h1.38l-.09-.13A2 2 0 0 1 10 8c0-1.1.9-2 2-2zm0 2c-.55 0-1 .45-1 1 0 .21.07.41.18.57L12 10.74l.82-1.17c.11-.16.18-.36.18-.57 0-.55-.45-1-1-1zm5 5H7v5h10v-5zM12 2a1 1 0 0 1 1 1v2h-2V3a1 1 0 0 1 1-1z" />
  };

  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      {paths[name]}
    </svg>
  );
};
