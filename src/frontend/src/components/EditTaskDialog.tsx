import { useState, useEffect } from 'react';
import { useUpdateTask, useMoveTaskToField, useGetAllFields } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { convertFromMinutes, convertDurationUnit } from '../utils/duration';
import type { Task, FieldId, DurationUnit } from '../backend';

interface EditTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task;
  fieldId: FieldId;
  existingTasks: Task[];
}

interface ScaleInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  description?: string;
}

function ScaleInput({ label, value, onChange, description }: ScaleInputProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        {description && <span className="text-xs text-muted-foreground">{description}</span>}
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => onChange(num)}
            className={`flex h-10 flex-1 items-center justify-center rounded-md border-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
              value === num
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-input bg-background hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            {num}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function EditTaskDialog({
  open,
  onOpenChange,
  task,
  fieldId,
  existingTasks,
}: EditTaskDialogProps) {
  const [name, setName] = useState(task.name);
  const [urgency, setUrgency] = useState(Number(task.urgency));
  const [value, setValue] = useState(Number(task.value));
  const [interest, setInterest] = useState(Number(task.interest));
  const [influence, setInfluence] = useState(Number(task.influence));
  const [durationInput, setDurationInput] = useState('');
  const [durationUnit, setDurationUnit] = useState<DurationUnit>(task.durationUnit);
  const [dependencies, setDependencies] = useState<string[]>(task.dependencies);
  const [selectedFieldId, setSelectedFieldId] = useState<FieldId>(fieldId);

  const updateTask = useUpdateTask();
  const moveTask = useMoveTaskToField();
  const { data: allFields = [] } = useGetAllFields();

  useEffect(() => {
    if (open) {
      setName(task.name);
      setUrgency(Math.min(5, Math.max(1, Number(task.urgency))));
      setValue(Math.min(5, Math.max(1, Number(task.value))));
      setInterest(Math.min(5, Math.max(1, Number(task.interest))));
      setInfluence(Math.min(5, Math.max(1, Number(task.influence))));
      
      // Convert duration from minutes (backend storage) to the user's preferred unit
      const storedUnit = task.durationUnit;
      const convertedDuration = convertFromMinutes(Number(task.duration), storedUnit);
      
      // If duration is 0, show empty input; otherwise show the value
      setDurationInput(convertedDuration === 0 ? '' : String(convertedDuration));
      setDurationUnit(storedUnit);
      
      setDependencies(task.dependencies);
      setSelectedFieldId(fieldId);
    }
  }, [open, task, fieldId]);

  const handleDurationUnitChange = (newUnit: DurationUnit) => {
    // Only convert if there's a value to convert
    if (durationInput.trim() === '') {
      setDurationUnit(newUnit);
      return;
    }

    const currentValue = parseInt(durationInput) || 0;
    const convertedValue = convertDurationUnit(currentValue, durationUnit, newUnit);
    setDurationInput(String(convertedValue));
    setDurationUnit(newUnit);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Parse duration, treating empty as 0
    const durationValue = durationInput.trim() === '' ? 0 : parseInt(durationInput) || 0;
    
    if (name.trim()) {
      const hasFieldChanged = selectedFieldId !== fieldId;
      
      // If field has changed, move the task first
      if (hasFieldChanged) {
        try {
          const oldFieldName = allFields.find(f => f.id === fieldId)?.name || 'previous field';
          const newFieldName = allFields.find(f => f.id === selectedFieldId)?.name || 'new field';
          
          await moveTask.mutateAsync({
            taskId: task.id,
            oldFieldId: fieldId,
            newFieldId: selectedFieldId,
            silent: true, // Don't show the default success toast
          });

          // Show undo toast for the move
          toast.success(`Task moved to ${newFieldName}`, {
            duration: 5000,
            action: {
              label: 'Undo',
              onClick: async () => {
                try {
                  await moveTask.mutateAsync({
                    taskId: task.id,
                    oldFieldId: selectedFieldId,
                    newFieldId: fieldId,
                    silent: true,
                  });
                  toast.success(`Task moved back to ${oldFieldName}`);
                } catch (error: any) {
                  const errorMessage = error?.message || 'Unknown error occurred';
                  toast.error(`Failed to undo move: ${errorMessage}`);
                }
              },
            },
          });
        } catch (error: any) {
          // Error is already handled by the mutation's onError with robust error handling
          return;
        }
      }

      // Then update the task attributes
      updateTask.mutate(
        {
          taskId: task.id,
          fieldId: selectedFieldId, // Use the new field ID for cache invalidation
          name: name.trim(),
          urgency: BigInt(urgency),
          value: BigInt(value),
          interest: BigInt(interest),
          influence: BigInt(influence),
          duration: BigInt(durationValue),
          durationUnit,
          dependencies,
        },
        {
          onSuccess: () => {
            onOpenChange(false);
          },
        }
      );
    }
  };

  const toggleDependency = (taskId: string) => {
    setDependencies((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const availableTasks = existingTasks.filter((t) => t.id !== task.id);
  const isProcessing = updateTask.isPending || moveTask.isPending;

  // Get the currently selected field for the tag
  const currentField = allFields.find(f => f.id === selectedFieldId);
  const currentFieldName = currentField?.name || 'Unknown Field';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>Edit Task</DialogTitle>
            <Badge variant="secondary" className="text-xs">
              {currentFieldName}
            </Badge>
          </div>
          <DialogDescription>
            Update task attributes (1-5 scale), move to a different field, and manage dependencies.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-task-name">Task Name</Label>
              <Input
                id="edit-task-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter task name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-field">Move to Field</Label>
              <Select
                value={selectedFieldId}
                onValueChange={(value) => setSelectedFieldId(value)}
              >
                <SelectTrigger id="edit-field">
                  <SelectValue placeholder="Select a field" />
                </SelectTrigger>
                <SelectContent>
                  {allFields.map((field) => (
                    <SelectItem key={field.id} value={field.id}>
                      {field.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <ScaleInput
                label="Urgency"
                value={urgency}
                onChange={setUrgency}
                description="1 = Low, 5 = High"
              />

              <ScaleInput
                label="Value"
                value={value}
                onChange={setValue}
                description="1 = Low, 5 = High"
              />

              <ScaleInput
                label="Interest"
                value={interest}
                onChange={setInterest}
                description="1 = Low, 5 = High"
              />

              <ScaleInput
                label="Influence"
                value={influence}
                onChange={setInfluence}
                description="1 = Low, 5 = High"
              />

              <div className="space-y-2">
                <Label htmlFor="edit-duration">Duration (optional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="edit-duration"
                    type="number"
                    min="0"
                    value={durationInput}
                    onChange={(e) => setDurationInput(e.target.value)}
                    placeholder="Enter duration"
                    className="flex-1"
                  />
                  <Select
                    value={durationUnit}
                    onValueChange={handleDurationUnitChange}
                  >
                    <SelectTrigger className="w-[130px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minutes">Minutes</SelectItem>
                      <SelectItem value="hours">Hours</SelectItem>
                      <SelectItem value="days">Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {availableTasks.length > 0 && (
              <div className="space-y-2">
                <Label>Dependencies (optional)</Label>
                <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border p-3">
                  {availableTasks.map((t) => (
                    <div key={t.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-dep-${t.id}`}
                        checked={dependencies.includes(t.id)}
                        onCheckedChange={() => toggleDependency(t.id)}
                      />
                      <label
                        htmlFor={`edit-dep-${t.id}`}
                        className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {t.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || isProcessing}>
              {isProcessing ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
