import { useState, useMemo } from 'react';
import { useGetAllFields } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useResilientActor } from '../hooks/useResilientActor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Folder, Search, SlidersHorizontal, ListTodo, DollarSign, Thermometer, Megaphone, Heart, Hourglass, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import FieldCard from '../components/FieldCard';
import CreateFieldDialog from '../components/CreateFieldDialog';
import FieldDetailView from '../components/FieldDetailView';
import AllTasksView from '../components/AllTasksView';
import SortDirectionToggle from '../components/SortDirectionToggle';
import type { Field, FieldId } from '../backend';

type SortOption = 'name' | 'createdAt' | 'avgUrgency' | 'avgValue' | 'avgInterest' | 'avgInfluence' | 'totalActiveTaskDuration';
type FilterAttribute = 'avgUrgency' | 'avgValue' | 'avgInterest' | 'avgInfluence' | 'totalActiveTaskDuration' | 'none';

export default function Dashboard() {
  const { data: fields = [], isLoading } = useGetAllFields();
  const { identity, login, isLoggingIn } = useInternetIdentity();
  const { isReady, isLoading: actorLoading } = useResilientActor();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedFieldId, setSelectedFieldId] = useState<FieldId | null>(null);
  const [activeTab, setActiveTab] = useState<'fields' | 'tasks'>('fields');
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterAttribute, setFilterAttribute] = useState<FilterAttribute>('none');
  const [filterMin, setFilterMin] = useState('0');
  const [filterMax, setFilterMax] = useState('100');

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();
  const isActorInitializing = isAuthenticated && (actorLoading || !isReady);

  // Derive the selected field from the latest data
  const selectedField = useMemo(() => {
    if (!selectedFieldId) return null;
    return fields.find(f => f.id === selectedFieldId) || null;
  }, [selectedFieldId, fields]);

  // Filter, search, and sort fields
  const filteredAndSortedFields = useMemo(() => {
    let result = [...fields];

    // Apply search filter (case-insensitive partial match)
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(field => 
        field.name.toLowerCase().includes(searchLower)
      );
    }

    // Apply attribute range filter
    if (filterAttribute !== 'none') {
      const min = Number(filterMin) || 0;
      const max = Number(filterMax) || 100;
      result = result.filter(field => {
        const value = Number(field[filterAttribute]);
        return value >= min && value <= max;
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'createdAt') {
        comparison = Number(a.createdAt - b.createdAt);
      } else {
        // Sort by average attributes or totalActiveTaskDuration
        comparison = Number(a[sortBy]) - Number(b[sortBy]);
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [fields, searchTerm, sortBy, sortDirection, filterAttribute, filterMin, filterMax]);

  const handleNewFieldClick = () => {
    if (!isAuthenticated) {
      toast.error('Please log in to create Fields', {
        description: 'You must be logged in with Internet Identity to create Fields.',
        action: {
          label: 'Log In',
          onClick: () => login(),
        },
      });
      return;
    }
    
    // Prevent opening dialog if actor is still initializing
    if (isActorInitializing) {
      toast.info('Connecting...', {
        description: 'Please wait while we connect to the backend.',
      });
      return;
    }
    
    setCreateDialogOpen(true);
  };

  if (selectedField) {
    return <FieldDetailView field={selectedField} onBack={() => setSelectedFieldId(null)} />;
  }

  return (
    <div className="container py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Manage your fields and tasks</p>
        </div>
        <Button onClick={handleNewFieldClick} disabled={isLoggingIn || isActorInitializing}>
          {isAuthenticated ? (
            <>
              <Plus className="mr-2 h-4 w-4" />
              {isActorInitializing ? 'Connecting...' : 'New Field'}
            </>
          ) : (
            <>
              <LogIn className="mr-2 h-4 w-4" />
              {isLoggingIn ? 'Logging in...' : 'Log In to Create'}
            </>
          )}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'fields' | 'tasks')} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="fields" className="flex items-center gap-2">
            <Folder className="h-4 w-4" />
            Fields
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <ListTodo className="h-4 w-4" />
            All Tasks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fields" className="space-y-6">
          {/* Search and Filter Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <SlidersHorizontal className="h-5 w-5" />
                Search & Filter
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Search */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search by name</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search fields..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                {/* Sort */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sort by</label>
                  <div className="flex gap-2">
                    <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="createdAt">Creation Date</SelectItem>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="avgUrgency">
                          <span className="flex items-center gap-2">
                            <Thermometer className="h-4 w-4 text-red-600 dark:text-red-400" />
                            Avg Urgency
                          </span>
                        </SelectItem>
                        <SelectItem value="avgValue">
                          <span className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                            Avg Value
                          </span>
                        </SelectItem>
                        <SelectItem value="avgInterest">
                          <span className="flex items-center gap-2">
                            <Heart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            Avg Interest
                          </span>
                        </SelectItem>
                        <SelectItem value="avgInfluence">
                          <span className="flex items-center gap-2">
                            <Megaphone className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            Avg Influence
                          </span>
                        </SelectItem>
                        <SelectItem value="totalActiveTaskDuration">
                          <span className="flex items-center gap-2">
                            <Hourglass className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                            Total Active Duration
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <SortDirectionToggle
                      direction={sortDirection}
                      onToggle={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                    />
                  </div>
                </div>

                {/* Filter Attribute */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Filter by attribute</label>
                  <Select value={filterAttribute} onValueChange={(value) => setFilterAttribute(value as FilterAttribute)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No filter</SelectItem>
                      <SelectItem value="avgUrgency">
                        <span className="flex items-center gap-2">
                          <Thermometer className="h-4 w-4 text-red-600 dark:text-red-400" />
                          Urgency
                        </span>
                      </SelectItem>
                      <SelectItem value="avgValue">
                        <span className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                          Value
                        </span>
                      </SelectItem>
                      <SelectItem value="avgInterest">
                        <span className="flex items-center gap-2">
                          <Heart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          Interest
                        </span>
                      </SelectItem>
                      <SelectItem value="avgInfluence">
                        <span className="flex items-center gap-2">
                          <Megaphone className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          Influence
                        </span>
                      </SelectItem>
                      <SelectItem value="totalActiveTaskDuration">
                        <span className="flex items-center gap-2">
                          <Hourglass className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                          Duration
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filter Range */}
                {filterAttribute !== 'none' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Range</label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={filterMin}
                        onChange={(e) => setFilterMin(e.target.value)}
                        className="w-20"
                        min="0"
                        max="100"
                      />
                      <span className="text-muted-foreground">-</span>
                      <Input
                        type="number"
                        placeholder="Max"
                        value={filterMax}
                        onChange={(e) => setFilterMax(e.target.value)}
                        className="w-20"
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Active filters summary */}
              {(searchTerm || filterAttribute !== 'none') && (
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <span>
                    Showing {filteredAndSortedFields.length} of {fields.length} field{fields.length !== 1 ? 's' : ''}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('');
                      setFilterAttribute('none');
                      setFilterMin('0');
                      setFilterMax('100');
                    }}
                    className="h-7 px-2"
                  >
                    Clear filters
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fields Grid */}
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 w-32 rounded bg-muted" />
                    <div className="h-4 w-24 rounded bg-muted" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {[...Array(5)].map((_, j) => (
                        <div key={j} className="h-4 rounded bg-muted" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : fields.length === 0 ? (
            <Card className="border-dashed">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Folder className="h-8 w-8 text-muted-foreground" />
                </div>
                <CardTitle>No fields yet</CardTitle>
                <CardDescription>
                  {isAuthenticated 
                    ? 'Create your first field to start organizing tasks'
                    : 'Log in to create fields and organize your tasks'}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Button onClick={handleNewFieldClick} disabled={isLoggingIn || isActorInitializing}>
                  {isAuthenticated ? (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      {isActorInitializing ? 'Connecting...' : 'Create Field'}
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      {isLoggingIn ? 'Logging in...' : 'Log In'}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : filteredAndSortedFields.length === 0 ? (
            <Card className="border-dashed">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <CardTitle>No fields match your filters</CardTitle>
                <CardDescription>Try adjusting your search or filter criteria</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterAttribute('none');
                    setFilterMin('0');
                    setFilterMax('100');
                  }}
                >
                  Clear filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAndSortedFields.map((field) => (
                <FieldCard key={field.id} field={field} onClick={() => setSelectedFieldId(field.id)} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tasks">
          <AllTasksView />
        </TabsContent>
      </Tabs>

      <CreateFieldDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </div>
  );
}
