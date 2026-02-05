import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, DollarSign, Thermometer, Megaphone, Heart, Hourglass } from 'lucide-react';
import type { Field } from '../backend';
import { useGetTasksByField } from '../hooks/useQueries';
import { formatTotalDuration } from '../utils/duration';
import { getIconComponent, getColorValue } from '../utils/fieldAppearance';
import { getBackgroundCssVar } from '../utils/fieldCardBackgrounds';

interface FieldCardProps {
  field: Field;
  onClick: () => void;
}

export default function FieldCard({ field, onClick }: FieldCardProps) {
  const { data: tasks = [] } = useGetTasksByField(field.id);

  const attributes = [
    { 
      label: 'Urgency', 
      value: Number(field.avgUrgency), 
      color: 'text-red-600 dark:text-red-400',
      icon: Thermometer
    },
    { 
      label: 'Value', 
      value: Number(field.avgValue), 
      color: 'text-green-600 dark:text-green-400',
      icon: DollarSign
    },
    { 
      label: 'Interest', 
      value: Number(field.avgInterest), 
      color: 'text-blue-600 dark:text-blue-400',
      icon: Heart
    },
    { 
      label: 'Influence', 
      value: Number(field.avgInfluence), 
      color: 'text-purple-600 dark:text-purple-400',
      icon: Megaphone
    },
    { 
      label: 'Duration', 
      value: formatTotalDuration(Number(field.totalActiveTaskDuration)), 
      color: 'text-orange-600 dark:text-orange-400',
      icon: Hourglass
    },
  ];

  const FieldIcon = getIconComponent(field.icon);
  const fieldColor = getColorValue(field.color);
  const backgroundColor = getBackgroundCssVar(field.backgroundColor);

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
      onClick={onClick}
      style={{ backgroundColor }}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div 
              className="flex items-center justify-center w-10 h-10 rounded-lg"
              style={{ backgroundColor: `${fieldColor}20` }}
            >
              <div style={{ color: fieldColor }}>
                <FieldIcon size={20} />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="line-clamp-1">{field.name}</CardTitle>
              <CardDescription className="mt-1">
                {tasks.length} active {tasks.length === 1 ? 'task' : 'tasks'}
              </CardDescription>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        </div>
      </CardHeader>
      <CardContent>
        {/* 3-column grid on small/medium screens, single row with horizontal scroll on large screens */}
        <div className="grid grid-cols-3 gap-2 lg:flex lg:flex-nowrap lg:gap-3 lg:overflow-x-auto lg:pb-1">
          {attributes.map((attr) => {
            const Icon = attr.icon;
            return (
              <div key={attr.label} className="flex flex-col items-center justify-center text-sm lg:flex-shrink-0 lg:min-w-[100px]">
                <span className="text-muted-foreground flex items-center gap-1.5 mb-1">
                  <Icon className="h-4 w-4" />
                  <span className="text-xs lg:text-sm">{attr.label}</span>
                </span>
                <Badge variant="outline" className={attr.color}>
                  {attr.value}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
