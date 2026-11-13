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
          iconBg: 'bg-[#8B5CF6]/15 border-[#8B5CF6]/30 text-[#8B5CF6]',
          badge: 'bg-[#8B5CF6]/15 text-[#8B5CF6] border-[#8B5CF6]/30',
        };
      default:
        return {
          iconBg: 'bg-[#2563EB]/15 border-[#2563EB]/30 text-[#2563EB]',
          badge: 'bg-[#2563EB]/15 text-[#D1DBF9] border-[#2563EB]/30',
        };
    }
  };

  const v = getVariantStyles();

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[rgba(126,137,172,0.18)] bg-[#0E1628] p-5 shadow-lg shadow-[rgba(1,5,17,0.4)] transition-all duration-200 hover:border-[rgba(37,99,235,0.4)] hover:shadow-[0_8px_30px_-4px_rgba(37,99,235,0.25)] hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#AEB9E1]">
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
          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold tracking-wide ${v.badge}`}>
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
