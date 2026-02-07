import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, DollarSign, Thermometer, Megaphone, Heart, Hourglass } from 'lucide-react';
import type { Field } from '../backend';
import { useGetTasksByField } from '../hooks/useQueries';
import { formatTotalDuration } from '../utils/duration';
import { getIconComponent, getColorValue } from '../utils/fieldAppearance';
import { getSoftCardBackground, getSoftIconChipBackground } from '../utils/softColorTint';
import { useTheme } from 'next-themes';

interface FieldCardProps {
  field: Field;
  onClick: () => void;
}

export default function FieldCard({ field, onClick }: FieldCardProps) {
  const { data: tasks = [] } = useGetTasksByField(field.id);
  const { resolvedTheme } = useTheme();

  const attributes = [
    { 
      icon: Thermometer, 
      label: 'Urgency', 
      value: field.avgUrgency,
      color: '#EF4444'
    },
    { 
      icon: DollarSign, 
      label: 'Value', 
      value: field.avgValue,
      color: '#10B981'
    },
    { 
      icon: Heart, 
      label: 'Interest', 
      value: field.avgInterest,
      color: '#EC4899'
    },
    { 
      icon: Megaphone, 
      label: 'Influence', 
      value: field.avgInfluence,
      color: '#8B5CF6'
    },
  ];

  const FieldIcon = getIconComponent(field.icon);
  // Resolve color ID to hex value (handles both color IDs like "teal" and hex values like "#14B8A6")
  const iconColor = getColorValue(field.color);
  const isDark = resolvedTheme === 'dark';
  
  // Pass resolved hex color to soft tint functions
  const cardBgColor = getSoftCardBackground(iconColor, isDark);
  const iconChipBgColor = getSoftIconChipBackground(iconColor, isDark);

  return (
    <Card 
      className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] border-2"
      onClick={onClick}
      style={{ 
        backgroundColor: cardBgColor,
        borderColor: iconColor + '20'
      }}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="flex h-12 w-12 items-center justify-center rounded-lg"
              style={{ 
                backgroundColor: iconChipBgColor,
              }}
            >
              <FieldIcon size={24} style={{ color: iconColor }} />
            </div>
            <div>
              <CardTitle className="text-xl">{field.name}</CardTitle>
              <CardDescription className="mt-1">
                {Number(field.taskCount)} active {Number(field.taskCount) === 1 ? 'task' : 'tasks'}
              </CardDescription>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Hourglass className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Total Duration: {formatTotalDuration(Number(field.totalActiveTaskDuration))}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {attributes.map((attr) => (
              <Badge 
                key={attr.label} 
                variant="outline" 
                className="flex items-center gap-1.5 justify-center py-1.5"
              >
                <attr.icon className="h-3.5 w-3.5" style={{ color: attr.color }} />
                <span className="text-xs">{attr.label}: {Number(attr.value)}</span>
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
