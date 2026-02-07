import { useState } from 'react';
import { useMarkTaskCompleted, useUndoTaskCompletion, useDeleteTask } from '../hooks/useQueries';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Edit, Link2, DollarSign, Thermometer, Megaphone, Heart, Hourglass, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Task, FieldId, DurationUnit } from '../backend';
import EditTaskDialog from './EditTaskDialog';

interface TaskCardProps {
  task: Task;
  fieldId: FieldId;
  allTasks: Task[];
  fieldTag?: string;
}

// Helper function to format duration with unit
function formatDuration(durationInMinutes: number, unit: DurationUnit): string {
  let displayValue: number;
  let displayUnit: string;

  switch (unit) {
    case 'hours':
      displayValue = Math.round(durationInMinutes / 60);
      displayUnit = displayValue === 1 ? 'hour' : 'hours';
      break;
    case 'days':
      displayValue = Math.round(durationInMinutes / 1440);
      displayUnit = displayValue === 1 ? 'day' : 'days';
      break;
    default:
      displayValue = durationInMinutes;
      displayUnit = displayValue === 1 ? 'minute' : 'minutes';
  }

  return `${displayValue} ${displayUnit}`;
}

export default function TaskCard({ task, fieldId, allTasks, fieldTag }: TaskCardProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const markCompleted = useMarkTaskCompleted();
  const undoCompletion = useUndoTaskCompletion();
  const deleteTask = useDeleteTask();

  const handleComplete = async () => {
    try {
      await markCompleted.mutateAsync({ 
        taskId: task.id, 
        fieldId,
        silent: true, // Don't show the default success toast
      });

      // Show undo toast for the completion
      toast.success('Task completed', {
        duration: 5000,
        action: {
          label: 'Undo',
          onClick: async () => {
            try {
              await undoCompletion.mutateAsync({
                taskId: task.id,
                fieldId,
              });
              toast.success('Task restored');
            } catch (error: any) {
              const errorMessage = error?.message || 'Unknown error occurred';
              toast.error(`Failed to undo: ${errorMessage}`);
            }
          },
        },
      });
    } catch (error: any) {
      // Error is already handled by the mutation's onError
    }
  };

  const handleDelete = () => {
    deleteTask.mutate({ taskId: task.id, fieldId });
    setDeleteDialogOpen(false);
  };

  const getDependencyNames = () => {
    return task.dependencies
      .map((depId) => allTasks.find((t) => t.id === depId)?.name)
      .filter(Boolean);
  };

  const dependencyNames = getDependencyNames();

  const attributes = [
    { 
      label: 'Urgency', 
      value: Number(task.urgency), 
      color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
      icon: Thermometer
    },
    { 
      label: 'Value', 
      value: Number(task.value), 
      color: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
      icon: DollarSign
    },
    { 
      label: 'Interest', 
      value: Number(task.interest), 
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
      icon: Heart
    },
    { 
      label: 'Influence', 
      value: Number(task.influence), 
      color: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
      icon: Megaphone
    },
  ];

  return (
    <>
      <Card className="bg-card text-card-foreground transition-all hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Checkbox
              checked={false}
              onCheckedChange={handleComplete}
              disabled={markCompleted.isPending}
              className="mt-1"
              aria-label="Mark task as completed"
            />
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-semibold">{task.name}</h3>
                  {fieldTag && (
                    <Badge variant="outline" className="text-xs">
                      {fieldTag}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditDialogOpen(true)}
                    aria-label="Edit task"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteDialogOpen(true)}
                    disabled={deleteTask.isPending}
                    className="text-destructive hover:text-destructive"
                    aria-label="Delete task"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {attributes.map((attr) => {
                  const Icon = attr.icon;
                  return (
                    <Badge key={attr.label} variant="secondary" className={attr.color}>
                      <Icon className="h-3 w-3 mr-1" />
                      {attr.label}: {attr.value}
                    </Badge>
                  );
                })}
                <Badge 
                  variant="secondary" 
                  className="bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300"
                >
                  <Hourglass className="h-3 w-3 mr-1" />
                  {formatDuration(Number(task.duration), task.durationUnit)}
                </Badge>
              </div>

              {dependencyNames.length > 0 && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Link2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <span className="font-medium">Dependencies:</span>{' '}
                    {dependencyNames.join(', ')}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <EditTaskDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        task={task}
        fieldId={fieldId}
        existingTasks={allTasks}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{task.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
