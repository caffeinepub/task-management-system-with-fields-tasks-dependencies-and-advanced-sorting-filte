import { useState, useMemo } from 'react';
import { useGetTasksByField, useDeleteField } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { ArrowLeft, Plus, Search, SortAsc, DollarSign, Thermometer, Megaphone, Heart, Hourglass, Trash2 } from 'lucide-react';
import type { Field } from '../backend';
import TaskCard from './TaskCard';
import CreateTaskDialog from './CreateTaskDialog';
import EditFieldDialog from './EditFieldDialog';
import SortDirectionToggle from './SortDirectionToggle';
import { formatTotalDuration } from '../utils/duration';

interface FieldDetailViewProps {
  field: Field;
  onBack: () => void;
}

type SortOption = 'name' | 'urgency' | 'value' | 'interest' | 'influence' | 'duration';

export default function FieldDetailView({ field, onBack }: FieldDetailViewProps) {
  const { data: tasks = [], isLoading } = useGetTasksByField(field.id);
  const deleteFieldMutation = useDeleteField();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editFieldDialogOpen, setEditFieldDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const filteredAndSortedTasks = useMemo(() => {
    let result = [...tasks];

    // Filter by search term
    if (searchTerm) {
      result = result.filter((task) =>
        task.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else {
        const aVal = Number(a[sortBy]);
        const bVal = Number(b[sortBy]);
        comparison = aVal - bVal;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [tasks, searchTerm, sortBy, sortOrder]);

  const handleDeleteField = async () => {
    await deleteFieldMutation.mutateAsync(field.id);
    setDeleteDialogOpen(false);
    onBack();
  };

  const attributes = [
    { 
      label: 'Urgency', 
      value: Number(field.avgUrgency), 
      color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
      icon: Thermometer
    },
    { 
      label: 'Value', 
      value: Number(field.avgValue), 
      color: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
      icon: DollarSign
    },
    { 
      label: 'Interest', 
      value: Number(field.avgInterest), 
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
      icon: Heart
    },
    { 
      label: 'Influence', 
      value: Number(field.avgInfluence), 
      color: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
      icon: Megaphone
    },
    { 
      label: 'Duration', 
      value: formatTotalDuration(Number(field.totalActiveTaskDuration)), 
      color: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
      icon: Hourglass
    },
  ];

  return (
    <div className="container py-8">
      <div className="mb-6">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{field.name}</h1>
              <Button variant="outline" size="sm" onClick={() => setEditFieldDialogOpen(true)}>
                Edit
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setDeleteDialogOpen(true)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-1 text-muted-foreground">
              {tasks.length} active {tasks.length === 1 ? 'task' : 'tasks'}
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {attributes.map((attr) => {
            const Icon = attr.icon;
            return (
              <Badge key={attr.label} variant="secondary" className={attr.color}>
                <Icon className="h-3 w-3 mr-1" />
                {attr.label}: {attr.value}
              </Badge>
            );
          })}
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger className="w-[160px]">
              <SortAsc className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="urgency">Urgency</SelectItem>
              <SelectItem value="value">Value</SelectItem>
              <SelectItem value="interest">Interest</SelectItem>
              <SelectItem value="influence">Influence</SelectItem>
              <SelectItem value="duration">Duration</SelectItem>
            </SelectContent>
          </Select>
          <SortDirectionToggle
            direction={sortOrder}
            onToggle={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : filteredAndSortedTasks.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            {searchTerm ? 'No tasks found matching your search.' : 'No tasks yet. Create one to get started!'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedTasks.map((task) => (
            <TaskCard key={task.id} task={task} fieldId={field.id} allTasks={tasks} />
          ))}
        </div>
      )}

      <CreateTaskDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        fieldId={field.id}
        existingTasks={tasks}
      />

      <EditFieldDialog
        open={editFieldDialogOpen}
        onOpenChange={setEditFieldDialogOpen}
        field={field}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Field</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{field.name}"? This will permanently delete the field and all {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} in it. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteFieldMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteField}
              disabled={deleteFieldMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteFieldMutation.isPending ? 'Deleting...' : 'Delete Field'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
