import { Card, CardContent } from '@bps-companion/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  description?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

export function MetricCard({ 
  title, 
  value, 
  description, 
  icon, 
  trend, 
  trendValue 
}: MetricCardProps) {
  return (
    <Card className="h-full">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-medium text-muted-foreground line-clamp-2">{title}</p>
          {icon && <div className="text-muted-foreground shrink-0 scale-75">{icon}</div>}
        </div>
        <div className="mt-2 space-y-1">
          <p className="text-lg font-bold leading-none truncate" title={value}>{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground line-clamp-1" title={description}>{description}</p>
          )}
          {trend && trendValue && (
            <div className={`flex items-center gap-1 text-xs ${
              trend === 'up' ? 'text-green-600' : 
              trend === 'down' ? 'text-red-600' : 
              'text-gray-600'
            }`}>
              {trend === 'up' && <TrendingUp className="h-3 w-3" />}
              {trend === 'down' && <TrendingDown className="h-3 w-3" />}
              <span className="truncate">{trendValue}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}