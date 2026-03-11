'use client';

import { useTheme } from 'next-themes';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export function StatsChart({ data }: { data: { date: string; views: number }[] }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <div className="h-[200px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <XAxis 
            dataKey="date" 
            stroke={isDark ? '#52525b' : '#d4d4d8'} 
            fontSize={10} 
            tickLine={false} 
            axisLine={false} 
            tickMargin={10}
            minTickGap={20}
          />
          <YAxis 
            stroke={isDark ? '#52525b' : '#d4d4d8'} 
            fontSize={10} 
            tickLine={false} 
            axisLine={false} 
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: isDark ? '#18181b' : '#ffffff', 
              borderColor: isDark ? '#27272a' : '#e4e4e7',
              borderRadius: '12px',
              fontSize: '12px',
              color: isDark ? '#e4e4e7' : '#18181b',
              fontWeight: 500,
            }}
            itemStyle={{ color: '#a78bfa' }}
          />
          <Line 
            type="monotone" 
            dataKey="views" 
            stroke="#a78bfa" 
            strokeWidth={3} 
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: '#a78bfa' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
