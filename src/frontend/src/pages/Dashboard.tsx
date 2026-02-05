import { useState, useMemo, useRef } from 'react';
import { useGetAllFields, useExportUserData, useImportUserData } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useResilientActor } from '../hooks/useResilientActor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Folder, Search, SlidersHorizontal, ListTodo, DollarSign, Thermometer, Megaphone, Heart, Hourglass, LogIn, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
import FieldCard from '../components/FieldCard';
import CreateFieldDialog from '../components/CreateFieldDialog';
import FieldDetailView from '../components/FieldDetailView';
import FieldDetailErrorBoundary from '../components/FieldDetailErrorBoundary';
import AllTasksView from '../components/AllTasksView';
import SortDirectionToggle from '../components/SortDirectionToggle';
import ImportDataConfirmDialog from '../components/ImportDataConfirmDialog';
import { downloadJson } from '../utils/downloadJson';
import { parseExportPayload } from '../utils/parseExportPayload';
import type { Field, FieldId, ExportPayload } from '../backend';

type SortOption = 'name' | 'createdAt' | 'avgUrgency' | 'avgValue' | 'avgInterest' | 'avgInfluence' | 'totalActiveTaskDuration';

export default function Dashboard() {
  const { data: fields = [], isLoading } = useGetAllFields();
  const { identity, login, isLoggingIn } = useInternetIdentity();
  const { isReady, isLoading: actorLoading } = useResilientActor();
  const exportMutation = useExportUserData();
  const importMutation = useImportUserData();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedFieldId, setSelectedFieldId] = useState<FieldId | null>(null);
  const [activeTab, setActiveTab] = useState<'fields' | 'tasks'>('fields');
  
  // Import state
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importPayload, setImportPayload] = useState<ExportPayload | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Search and sort state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();
  const isActorInitializing = isAuthenticated && (actorLoading || !isReady);

  // Derive the selected field from the latest data
  const selectedField = useMemo(() => {
    if (!selectedFieldId) return null;
    return fields.find(f => f.id === selectedFieldId) || null;
  }, [selectedFieldId, fields]);

  // Filter by search and sort fields
  const filteredAndSortedFields = useMemo(() => {
    let result = [...fields];

    // Apply search filter (case-insensitive partial match)
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(field => 
        field.name.toLowerCase().includes(searchLower)
      );
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
  }, [fields, searchTerm, sortBy, sortDirection]);

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

  const handleExportClick = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to export data', {
        description: 'You must be logged in with Internet Identity to export your data.',
        action: {
          label: 'Log In',
          onClick: () => login(),
        },
      });
      return;
    }
    
    // Prevent export if actor is still initializing
    if (isActorInitializing) {
      toast.info('Connecting...', {
        description: 'Please wait while we connect to the backend.',
      });
      return;
    }
    
    try {
      console.log('[Dashboard] Starting export...');
      const exportData = await exportMutation.mutateAsync();
      console.log('[Dashboard] Export data received, attempting download...');
      
      try {
        downloadJson(exportData);
        console.log('[Dashboard] Download triggered successfully');
        toast.success('Data exported successfully', {
          description: `Exported ${exportData.fields.length} field${exportData.fields.length !== 1 ? 's' : ''} and ${exportData.tasks.length} task${exportData.tasks.length !== 1 ? 's' : ''}.`,
        });
      } catch (downloadError) {
        console.error('[Dashboard] Download generation failed:', downloadError);
        toast.error('Failed to download export file', {
          description: 'The data was retrieved but could not be saved. Please try again.',
        });
      }
    } catch (error) {
      // Backend export error is already handled by the mutation's onError handler
      console.error('[Dashboard] Export failed:', error);
    }
  };

  const handleImportClick = () => {
    if (!isAuthenticated) {
      toast.error('Please log in to import data', {
        description: 'You must be logged in with Internet Identity to import data.',
        action: {
          label: 'Log In',
          onClick: () => login(),
        },
      });
      return;
    }
    
    // Prevent import if actor is still initializing
    if (isActorInitializing) {
      toast.info('Connecting...', {
        description: 'Please wait while we connect to the backend.',
      });
      return;
    }
    
    // Trigger file input
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset file input so the same file can be selected again
    event.target.value = '';

    try {
      // Read file as text
      const text = await file.text();
      
      // Parse JSON
      let json: unknown;
      try {
        json = JSON.parse(text);
      } catch (parseError) {
        console.error('[Dashboard] JSON parse error:', parseError);
        toast.error('Invalid file format', {
          description: 'The selected file is not valid JSON.',
        });
        return;
      }

      // Validate and parse payload
      try {
        const payload = parseExportPayload(json);
        console.log('[Dashboard] Payload parsed successfully:', payload.fields.length, 'fields,', payload.tasks.length, 'tasks');
        
        // Store payload and open confirmation dialog
        setImportPayload(payload);
        setImportDialogOpen(true);
      } catch (validationError) {
        console.error('[Dashboard] Payload validation error:', validationError);
        const errorMessage = validationError instanceof Error ? validationError.message : 'Unknown validation error';
        toast.error('Invalid export file', {
          description: errorMessage,
        });
      }
    } catch (error) {
      console.error('[Dashboard] File read error:', error);
      toast.error('Failed to read file', {
        description: 'Could not read the selected file. Please try again.',
      });
    }
  };

  const handleImportConfirm = async () => {
    if (!importPayload) return;

    try {
      await importMutation.mutateAsync(importPayload);
      // Success toast is shown by the mutation's onSuccess handler
      setImportDialogOpen(false);
      setImportPayload(null);
    } catch (error) {
      // Error toast is shown by the mutation's onError handler
      console.error('[Dashboard] Import failed:', error);
    }
  };

  const handleImportCancel = () => {
    setImportDialogOpen(false);
    setImportPayload(null);
  };

  if (selectedField) {
    return (
      <FieldDetailErrorBoundary onBack={() => setSelectedFieldId(null)}>
        <FieldDetailView field={selectedField} onBack={() => setSelectedFieldId(null)} />
      </FieldDetailErrorBoundary>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Manage your fields and tasks</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleImportClick} 
            disabled={isLoggingIn || isActorInitializing || importMutation.isPending}
            className="flex-shrink-0"
          >
            {importMutation.isPending ? (
              <>
                <Upload className="mr-2 h-4 w-4 animate-pulse" />
                <span className="whitespace-nowrap">Importing...</span>
              </>
            ) : isAuthenticated ? (
              <>
                <Upload className="mr-2 h-4 w-4" />
                <span className="whitespace-nowrap">{isActorInitializing ? 'Connecting...' : 'Import Data'}</span>
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                <span className="whitespace-nowrap">{isLoggingIn ? 'Logging in...' : 'Log In to Import'}</span>
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleExportClick} 
            disabled={isLoggingIn || isActorInitializing || exportMutation.isPending}
            className="flex-shrink-0"
          >
            {exportMutation.isPending ? (
              <>
                <Download className="mr-2 h-4 w-4 animate-pulse" />
                <span className="whitespace-nowrap">Exporting...</span>
              </>
            ) : isAuthenticated ? (
              <>
                <Download className="mr-2 h-4 w-4" />
                <span className="whitespace-nowrap">{isActorInitializing ? 'Connecting...' : 'Export Data'}</span>
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                <span className="whitespace-nowrap">{isLoggingIn ? 'Logging in...' : 'Log In to Export'}</span>
              </>
            )}
          </Button>
          <Button 
            onClick={handleNewFieldClick} 
            disabled={isLoggingIn || isActorInitializing}
            className="flex-shrink-0"
          >
            {isAuthenticated ? (
              <>
                <Plus className="mr-2 h-4 w-4" />
                <span className="whitespace-nowrap">{isActorInitializing ? 'Connecting...' : 'New Field'}</span>
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                <span className="whitespace-nowrap">{isLoggingIn ? 'Logging in...' : 'Log In to Create'}</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleFileSelect}
        className="hidden"
      />

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
          {/* Search and Sort Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <SlidersHorizontal className="h-5 w-5" />
                Search & Sort
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
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
              </div>

              {/* Active search summary */}
              {searchTerm && (
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <span>
                    Showing {filteredAndSortedFields.length} of {fields.length} field{fields.length !== 1 ? 's' : ''}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchTerm('')}
                    className="h-7 px-2"
                  >
                    Clear search
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
                <CardTitle>No fields match your search</CardTitle>
                <CardDescription>Try adjusting your search term</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => setSearchTerm('')}
                >
                  Clear search
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
      
      {importPayload && (
        <ImportDataConfirmDialog
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
          onConfirm={handleImportConfirm}
          isLoading={importMutation.isPending}
          fieldCount={importPayload.fields.length}
          taskCount={importPayload.tasks.length}
        />
      )}
    </div>
  );
}
