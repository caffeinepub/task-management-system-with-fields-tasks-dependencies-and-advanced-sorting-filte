import { useState, useMemo } from 'react';
import { useGetAllTasks, useGetAllFields } from '../hooks/useQueries';
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
import { Search, SortAsc, ListTodo } from 'lucide-react';
import TaskCard from './TaskCard';
import SortDirectionToggle from './SortDirectionToggle';

type SortOption = 'name' | 'urgency' | 'value' | 'interest' | 'influence' | 'duration';

export default function AllTasksView() {
  const { data: tasks = [], isLoading } = useGetAllTasks();
  const { data: fields = [] } = useGetAllFields();
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

  const getFieldName = (fieldId: string) => {
    const field = fields.find((f) => f.id === fieldId);
    return field?.name || 'Unknown Field';
  };

  return (
    <div className="container py-8">
      <div className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <ListTodo className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold tracking-tight">All Tasks</h1>
            </div>
            <p className="mt-1 text-muted-foreground">
              {tasks.length} active {tasks.length === 1 ? 'task' : 'tasks'} across all fields
            </p>
          </div>
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
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : filteredAndSortedTasks.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            {searchTerm ? 'No tasks found matching your search.' : 'No tasks yet. Create a field and add tasks to get started!'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAndSortedTasks.map((task) => (
            <TaskCard 
              key={task.id} 
              task={task} 
              fieldId={task.fieldId} 
              allTasks={tasks}
              fieldTag={getFieldName(task.fieldId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
