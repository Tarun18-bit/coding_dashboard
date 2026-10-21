import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: string;
  variant?: 'blue' | 'cyan' | 'green' | 'amber' | 'rose' | 'purple';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  badge,
  variant = 'blue',
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'green':
        return {
          iconBg: 'bg-[#14CA74]/15 border-[#14CA74]/30 text-[#14CA74]',
          badge: 'bg-[#14CA74]/15 text-[#14CA74] border-[#14CA74]/30',
        };
      case 'cyan':
        return {
          iconBg: 'bg-[#00C2FF]/15 border-[#00C2FF]/30 text-[#00C2FF]',
          badge: 'bg-[#00C2FF]/15 text-[#00C2FF] border-[#00C2FF]/30',
        };
      case 'amber':
        return {
          iconBg: 'bg-[#FDB52A]/15 border-[#FDB52A]/30 text-[#FDB52A]',
          badge: 'bg-[#FDB52A]/15 text-[#FDB52A] border-[#FDB52A]/30',
        };
      case 'rose':
        return {
          iconBg: 'bg-[#FF5A65]/15 border-[#FF5A65]/30 text-[#FF5A65]',
          badge: 'bg-[#FF5A65]/15 text-[#FF5A65] border-[#FF5A65]/30',
        };
      case 'purple':
        return {
          iconBg: 'bg-[#CB3CFF]/15 border-[#CB3CFF]/30 text-[#CB3CFF]',
          badge: 'bg-[#CB3CFF]/15 text-[#CB3CFF] border-[#CB3CFF]/30',
        };
      default:
        return {
          iconBg: 'bg-[#0E43FB]/15 border-[#0E43FB]/30 text-[#0E43FB]',
          badge: 'bg-[#0E43FB]/15 text-[#D1DBF9] border-[#0E43FB]/30',
        };
    }
  };

  const v = getVariantStyles();

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[rgba(126,137,172,0.18)] bg-[#0B1739] p-5 shadow-lg shadow-[rgba(1,5,17,0.4)] transition-all duration-200 hover:border-[rgba(14,67,251,0.4)] hover:shadow-[0_8px_30px_-4px_rgba(14,67,251,0.25)] hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#AEB9E1]">
          {title}
        </span>
        {icon && (
          <div className={`flex h-8 w-8 items-center justify-center rounded-xl border ${v.iconBg} transition-transform group-hover:scale-105`}>
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2.5">
        <span className="text-3xl font-bold tracking-tight text-white font-mono">
          {value}
        </span>
        {badge && (
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide ${v.badge}`}>
            {badge}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1.5 text-xs text-[#7E89AC] font-medium">{subtitle}</p>
      )}
    </div>
  );
};
