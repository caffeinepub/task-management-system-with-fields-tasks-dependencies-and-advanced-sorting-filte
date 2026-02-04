import { useState } from 'react';
import { useCreateTask } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import type { Task, FieldId, DurationUnit } from '../backend';

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export default function CreateTaskDialog({
  open,
  onOpenChange,
  fieldId,
  existingTasks,
}: CreateTaskDialogProps) {
  const [name, setName] = useState('');
  const [urgency, setUrgency] = useState(3);
  const [value, setValue] = useState(3);
  const [interest, setInterest] = useState(3);
  const [influence, setInfluence] = useState(3);
  const [duration, setDuration] = useState(15);
  const [durationUnit, setDurationUnit] = useState<DurationUnit>('minutes' as DurationUnit);
  const [dependencies, setDependencies] = useState<string[]>([]);

  const createTask = useCreateTask();

  const resetForm = () => {
    setName('');
    setUrgency(3);
    setValue(3);
    setInterest(3);
    setInfluence(3);
    setDuration(15);
    setDurationUnit('minutes' as DurationUnit);
    setDependencies([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && duration > 0) {
      createTask.mutate(
        {
          fieldId,
          name: name.trim(),
          urgency: BigInt(urgency),
          value: BigInt(value),
          interest: BigInt(interest),
          influence: BigInt(influence),
          duration: BigInt(duration),
          durationUnit,
          dependencies,
        },
        {
          onSuccess: () => {
            resetForm();
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Add a new task with its attributes (1-5 scale) and dependencies.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="task-name">Task Name</Label>
              <Input
                id="task-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter task name"
                autoFocus
              />
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
                <Label htmlFor="duration">Duration</Label>
                <div className="flex gap-2">
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    value={duration}
                    onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 15))}
                    placeholder="Enter duration"
                    className="flex-1"
                  />
                  <Select
                    value={durationUnit}
                    onValueChange={(value) => setDurationUnit(value as DurationUnit)}
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

            {existingTasks.length > 0 && (
              <div className="space-y-2">
                <Label>Dependencies (optional)</Label>
                <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border p-3">
                  {existingTasks.map((task) => (
                    <div key={task.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`dep-${task.id}`}
                        checked={dependencies.includes(task.id)}
                        onCheckedChange={() => toggleDependency(task.id)}
                      />
                      <label
                        htmlFor={`dep-${task.id}`}
                        className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {task.name}
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
            <Button type="submit" disabled={!name.trim() || duration <= 0 || createTask.isPending}>
              {createTask.isPending ? 'Creating...' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
