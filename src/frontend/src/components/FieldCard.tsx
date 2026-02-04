import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, DollarSign, Thermometer, Megaphone, Heart, Hourglass } from 'lucide-react';
import type { Field } from '../backend';
import { useGetTasksByField } from '../hooks/useQueries';
import { formatTotalDuration } from '../utils/duration';

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

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="line-clamp-1">{field.name}</CardTitle>
            <CardDescription className="mt-1">
              {tasks.length} active {tasks.length === 1 ? 'task' : 'tasks'}
            </CardDescription>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {attributes.map((attr) => {
            const Icon = attr.icon;
            return (
              <div key={attr.label} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Icon className="h-4 w-4" />
                  {attr.label}
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
