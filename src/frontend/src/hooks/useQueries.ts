import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useResilientActor } from './useResilientActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { Field, Task, UserProfile, FieldId, TaskId, DurationUnit, ExportPayload } from '../backend';
import { toast } from 'sonner';
import { normalizeFieldCreationError } from '../utils/fieldCreationErrors';
import { normalizeProfileSaveError } from '../utils/profileSaveErrors';
import { normalizeExportUserDataError } from '../utils/exportUserDataErrors';
import { isUserNotRegisteredError } from '../utils/bootErrorMessages';
import { DEFAULT_ICON, DEFAULT_COLOR_ID } from '../utils/fieldAppearance';

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isLoading: actorLoading } = useResilientActor();
  const { identity } = useInternetIdentity();

  // Get principal string for cache key scoping (empty string when not authenticated)
  const principalKey = identity && !identity.getPrincipal().isAnonymous() 
    ? identity.getPrincipal().toString() 
    : '';

  const query = useQuery<UserProfile | null, Error>({
    queryKey: ['currentUserProfile', principalKey],
    queryFn: async () => {
      if (!actor) {
        console.log('[Profile Query] Actor not available, skipping profile fetch');
        throw new Error('Actor not available');
      }
      console.log('[Profile Query] Fetching caller user profile for principal:', principalKey);
      try {
        const profile = await actor.getCallerUserProfile();
        console.log('[Profile Query] Profile fetch successful:', profile ? 'Profile exists' : 'No profile (null returned)');
        // Backend returns null when no profile exists - this is the normal case for new users
        return profile;
      } catch (error) {
        console.error('[Profile Query] Profile fetch failed');
        console.error('[Profile Query] Error:', error);
        console.error('[Profile Query] Error type:', typeof error);
        
        // Log structured error details for diagnosis
        if (error && typeof error === 'object') {
          const anyError = error as any;
          console.error('[Profile Query] Error keys:', Object.keys(anyError));
          if (anyError.message) console.error('[Profile Query] Message:', anyError.message);
          if (anyError.reject_message) console.error('[Profile Query] Reject message:', anyError.reject_message);
          if (anyError.code) console.error('[Profile Query] Code:', anyError.code);
          if (anyError.reject_code) console.error('[Profile Query] Reject code:', anyError.reject_code);
        }
        
        // Special handling: "User is not registered" means new user, not an error
        // Return null to trigger profile setup flow instead of boot error
        // Note: This is a fallback - normally the backend returns null, not an error
        if (isUserNotRegisteredError(error)) {
          console.log('[Profile Query] User not registered detected - treating as new user (returning null)');
          return null;
        }
        
        // Annotate error with stage information for better UI messaging
        const annotatedError = error instanceof Error ? error : new Error(String(error));
        (annotatedError as any).stage = 'profile-fetch';
        throw annotatedError;
      }
    },
    // Only enable when authenticated (not anonymous) and actor is ready
    enabled: !!actor && !actorLoading && !!identity && !identity.getPrincipal().isAnonymous(),
    retry: (failureCount, error) => {
      // Don't retry "User is not registered" - it's not a transient error
      if (isUserNotRegisteredError(error)) {
        console.log('[Profile Query] User not registered, not retrying');
        return false;
      }
      
      // Don't retry authorization errors
      const isAuthError = error?.message?.toLowerCase().includes('unauthorized') ||
                         error?.message?.toLowerCase().includes('permission');
      if (isAuthError) {
        console.log('[Profile Query] Auth error detected, not retrying');
        return false;
      }
      // Retry network errors up to 2 times
      return failureCount < 2;
    },
    retryDelay: 1000,
  });

  return {
    ...query,
    isLoading: actorLoading || query.isLoading,
    isFetched: !!actor && !actorLoading && !!identity && !identity.getPrincipal().isAnonymous() && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor, isLoading: actorLoading, isReady } = useResilientActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  // Get principal string for cache key scoping
  const principalKey = identity && !identity.getPrincipal().isAnonymous() 
    ? identity.getPrincipal().toString() 
    : '';

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      console.log('[SaveProfile] Mutation attempt started');
      console.log('[SaveProfile] Actor available:', !!actor);
      console.log('[SaveProfile] Actor loading:', actorLoading);
      console.log('[SaveProfile] Actor ready:', isReady);
      console.log('[SaveProfile] Identity available:', !!identity);
      console.log('[SaveProfile] Identity is anonymous:', identity?.getPrincipal().isAnonymous());
      
      // Hard client-side guard: prevent anonymous/guest users from attempting profile save
      if (!identity || identity.getPrincipal().isAnonymous()) {
        console.error('[SaveProfile] Blocked: User is not authenticated (anonymous principal)');
        const error = new Error('LOGIN_REQUIRED: You must log in with Internet Identity to save your profile.');
        console.error('[SaveProfile] Error object:', error);
        throw error;
      }
      
      // Guard against actor not ready (initializing after login)
      if (!isReady || actorLoading) {
        console.error('[SaveProfile] Blocked: Actor is initializing');
        const error = new Error('ACTOR_INITIALIZING: The connection is still initializing. Please wait a moment and try again.');
        console.error('[SaveProfile] Error object:', error);
        throw error;
      }
      
      if (!actor) {
        console.error('[SaveProfile] Blocked: Actor not available');
        const error = new Error('ACTOR_UNAVAILABLE: Unable to connect to the backend. Please try again.');
        console.error('[SaveProfile] Error object:', error);
        throw error;
      }
      
      console.log('[SaveProfile] All guards passed, calling backend saveCallerUserProfile...');
      try {
        await actor.saveCallerUserProfile(profile);
        console.log('[SaveProfile] Backend call successful');
      } catch (error) {
        console.error('[SaveProfile] Backend call failed');
        console.error('[SaveProfile] Error object:', error);
        console.error('[SaveProfile] Error type:', typeof error);
        console.error('[SaveProfile] Error message:', error instanceof Error ? error.message : String(error));
        
        // Log nested error properties if available (for reject messages from IC)
        if (error && typeof error === 'object') {
          console.error('[SaveProfile] Error keys:', Object.keys(error));
          const anyError = error as any;
          if (anyError.message) console.error('[SaveProfile] Nested message:', anyError.message);
          if (anyError.reject_message) console.error('[SaveProfile] Reject message:', anyError.reject_message);
        }
        
        throw error;
      }
    },
    onSuccess: (_, profile) => {
      console.log('[SaveProfile] Mutation success, updating profile cache with principal-scoped key:', principalKey);
      // Immediately set the profile in cache to dismiss ProfileSetupModal (using principal-scoped key)
      queryClient.setQueryData(['currentUserProfile', principalKey], profile);
      // Then invalidate and refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile', principalKey] });
      toast.success('Profile saved successfully');
    },
    onError: (error: unknown) => {
      console.error('[SaveProfile] Mutation error handler triggered');
      const normalized = normalizeProfileSaveError(error);
      console.error('[SaveProfile] Normalized error category:', normalized.category);
      console.error('[SaveProfile] Normalized error message:', normalized.message);
      toast.error(normalized.message);
    },
  });
}

// Field Queries
export function useGetAllFields() {
  const { actor, isLoading } = useResilientActor();

  return useQuery<Field[]>({
    queryKey: ['fields'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllFields();
    },
    enabled: !!actor && !isLoading,
    refetchOnWindowFocus: true,
  });
}

export function useCreateField() {
  const { actor, isLoading: actorLoading, isReady } = useResilientActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  // Get principal string for cache key scoping
  const principalKey = identity && !identity.getPrincipal().isAnonymous() 
    ? identity.getPrincipal().toString() 
    : '';

  return useMutation({
    mutationFn: async (name: string) => {
      console.log('[CreateField] Mutation attempt started');
      console.log('[CreateField] Actor available:', !!actor);
      console.log('[CreateField] Actor loading:', actorLoading);
      console.log('[CreateField] Actor ready:', isReady);
      console.log('[CreateField] Identity available:', !!identity);
      console.log('[CreateField] Identity is anonymous:', identity?.getPrincipal().isAnonymous());
      
      // Hard client-side guard: prevent anonymous/guest users from attempting field creation
      if (!identity || identity.getPrincipal().isAnonymous()) {
        console.error('[CreateField] Blocked: User is not authenticated (anonymous principal)');
        const error = new Error('LOGIN_REQUIRED: You must log in with Internet Identity to create Fields.');
        console.error('[CreateField] Error object:', error);
        console.error('[CreateField] Error message:', error.message);
        throw error;
      }
      
      // Guard against actor not ready (initializing after login)
      if (!isReady || actorLoading) {
        console.error('[CreateField] Blocked: Actor is initializing');
        const error = new Error('ACTOR_INITIALIZING: The connection is still initializing. Please wait a moment and try again.');
        console.error('[CreateField] Error object:', error);
        console.error('[CreateField] Error message:', error.message);
        throw error;
      }
      
      if (!actor) {
        console.error('[CreateField] Blocked: Actor not available');
        const error = new Error('ACTOR_UNAVAILABLE: Unable to connect to the backend. Please try again.');
        console.error('[CreateField] Error object:', error);
        console.error('[CreateField] Error message:', error.message);
        throw error;
      }
      
      console.log('[CreateField] All guards passed, calling backend createField...');
      try {
        const result = await actor.createField(name, DEFAULT_ICON, DEFAULT_COLOR_ID);
        console.log('[CreateField] Backend call successful, fieldId:', result);
        return result;
      } catch (error) {
        console.error('[CreateField] Backend call failed');
        console.error('[CreateField] Error object:', error);
        console.error('[CreateField] Error type:', typeof error);
        console.error('[CreateField] Error message:', error instanceof Error ? error.message : String(error));
        console.error('[CreateField] Error stack:', error instanceof Error ? error.stack : 'N/A');
        
        // Log nested error properties if available (for reject messages from IC)
        if (error && typeof error === 'object') {
          console.error('[CreateField] Error keys:', Object.keys(error));
          const anyError = error as any;
          if (anyError.message) console.error('[CreateField] Nested message:', anyError.message);
          if (anyError.code) console.error('[CreateField] Error code:', anyError.code);
          if (anyError.reject_message) console.error('[CreateField] Reject message:', anyError.reject_message);
          if (anyError.reject_code) console.error('[CreateField] Reject code:', anyError.reject_code);
        }
        
        throw error;
      }
    },
    onSuccess: () => {
      console.log('[CreateField] Mutation success, invalidating and refetching fields');
      // Immediately refetch fields to show the new field
      queryClient.invalidateQueries({ queryKey: ['fields'] });
      queryClient.refetchQueries({ queryKey: ['fields'] });
      toast.success('Field created successfully');
    },
    onError: (error: unknown) => {
      console.error('[CreateField] Mutation error handler triggered');
      console.error('[CreateField] Raw error:', error);
      
      const normalized = normalizeFieldCreationError(error);
      console.error('[CreateField] Normalized error category:', normalized.category);
      console.error('[CreateField] Normalized error message:', normalized.message);
      
      // If the error is "User is not registered", refresh profile state
      // so the ProfileSetupModal can be shown
      if (isUserNotRegisteredError(error)) {
        console.log('[CreateField] User not registered detected - refreshing profile state to trigger ProfileSetupModal');
        queryClient.invalidateQueries({ queryKey: ['currentUserProfile', principalKey] });
        queryClient.refetchQueries({ queryKey: ['currentUserProfile', principalKey] });
        // Don't show the toast - let the ProfileSetupModal appear instead
        return;
      }
      
      toast.error(normalized.message);
    },
  });
}

export function useUpdateField() {
  const { actor } = useResilientActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fieldId, name, icon, color }: { fieldId: FieldId; name: string; icon: string; color: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateField(fieldId, name, icon, color);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fields'] });
      toast.success('Field updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update field: ${error.message}`);
    },
  });
}

export function useDeleteField() {
  const { actor } = useResilientActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fieldId: FieldId) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteField(fieldId);
    },
    onSuccess: (_, fieldId) => {
      // Optimistically update caches to immediately reflect deletion
      queryClient.setQueryData<Field[]>(['fields'], (oldFields) => {
        if (!oldFields) return [];
        return oldFields.filter(f => f.id !== fieldId);
      });

      queryClient.setQueryData<Task[]>(['allTasks'], (oldTasks) => {
        if (!oldTasks) return [];
        return oldTasks.filter(t => t.fieldId !== fieldId);
      });

      // Invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['fields'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', fieldId] });
      queryClient.invalidateQueries({ queryKey: ['allTasks'] });
      
      toast.success('Field and all its tasks deleted successfully');
    },
    onError: (error: Error) => {
      const errorMessage = error?.message || 'Unknown error occurred';
      toast.error(`Failed to delete field: ${errorMessage}`);
    },
  });
}

// Task Queries
export function useGetAllTasks() {
  const { actor, isLoading } = useResilientActor();

  return useQuery<Task[]>({
    queryKey: ['allTasks'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllTasks();
    },
    enabled: !!actor && !isLoading,
    refetchOnWindowFocus: true,
  });
}

export function useGetTasksByField(fieldId: FieldId | null) {
  const { actor, isLoading } = useResilientActor();

  return useQuery<Task[]>({
    queryKey: ['tasks', fieldId],
    queryFn: async () => {
      if (!actor || !fieldId) return [];
      return actor.getTasksByField(fieldId);
    },
    enabled: !!actor && !isLoading && !!fieldId,
    refetchOnWindowFocus: true,
  });
}

export function useCreateTask() {
  const { actor } = useResilientActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  // Get principal string for cache key scoping
  const principalKey = identity && !identity.getPrincipal().isAnonymous() 
    ? identity.getPrincipal().toString() 
    : '';

  return useMutation({
    mutationFn: async ({
      fieldId,
      name,
      urgency,
      value,
      interest,
      influence,
      duration,
      durationUnit,
      dependencies,
    }: {
      fieldId: FieldId;
      name: string;
      urgency: bigint;
      value: bigint;
      interest: bigint;
      influence: bigint;
      duration: bigint;
      durationUnit: DurationUnit;
      dependencies: TaskId[];
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createTask(fieldId, name, urgency, value, interest, influence, duration, durationUnit, dependencies);
    },
    onSuccess: (_, variables) => {
      // Invalidate tasks for this field
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.fieldId] });
      // Invalidate all tasks query
      queryClient.invalidateQueries({ queryKey: ['allTasks'] });
      // Invalidate all fields to update real-time averages
      queryClient.invalidateQueries({ queryKey: ['fields'] });
      toast.success('Task created successfully');
    },
    onError: (error: unknown) => {
      // Check for missing profile during task creation
      if (isUserNotRegisteredError(error)) {
        console.log('[CreateTask] User not registered detected - refreshing profile state to trigger ProfileSetupModal');
        queryClient.invalidateQueries({ queryKey: ['currentUserProfile', principalKey] });
        queryClient.refetchQueries({ queryKey: ['currentUserProfile', principalKey] });
        // Don't show the toast - let the ProfileSetupModal appear instead
        return;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to create task: ${errorMessage}`);
    },
  });
}

export function useUpdateTask() {
  const { actor } = useResilientActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  // Get principal string for cache key scoping
  const principalKey = identity && !identity.getPrincipal().isAnonymous() 
    ? identity.getPrincipal().toString() 
    : '';

  return useMutation({
    mutationFn: async ({
      taskId,
      fieldId,
      name,
      urgency,
      value,
      interest,
      influence,
      duration,
      durationUnit,
      dependencies,
    }: {
      taskId: TaskId;
      fieldId: FieldId;
      name: string;
      urgency: bigint;
      value: bigint;
      interest: bigint;
      influence: bigint;
      duration: bigint;
      durationUnit: DurationUnit;
      dependencies: TaskId[];
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateTask(taskId, name, urgency, value, interest, influence, duration, durationUnit, dependencies);
    },
    onSuccess: (_, variables) => {
      // Invalidate tasks for this field
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.fieldId] });
      // Invalidate all tasks query
      queryClient.invalidateQueries({ queryKey: ['allTasks'] });
      // Invalidate all fields to update real-time averages
      queryClient.invalidateQueries({ queryKey: ['fields'] });
      toast.success('Task updated successfully');
    },
    onError: (error: unknown) => {
      // Check for missing profile during task update
      if (isUserNotRegisteredError(error)) {
        console.log('[UpdateTask] User not registered detected - refreshing profile state to trigger ProfileSetupModal');
        queryClient.invalidateQueries({ queryKey: ['currentUserProfile', principalKey] });
        queryClient.refetchQueries({ queryKey: ['currentUserProfile', principalKey] });
        // Don't show the toast - let the ProfileSetupModal appear instead
        return;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to update task: ${errorMessage}`);
    },
  });
}

export function useMoveTaskToField() {
  const { actor } = useResilientActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  // Get principal string for cache key scoping
  const principalKey = identity && !identity.getPrincipal().isAnonymous() 
    ? identity.getPrincipal().toString() 
    : '';

  return useMutation({
    mutationFn: async ({ 
      taskId, 
      oldFieldId, 
      newFieldId,
      silent = false,
    }: { 
      taskId: TaskId; 
      oldFieldId: FieldId; 
      newFieldId: FieldId;
      silent?: boolean;
    }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.moveTaskToField(taskId, newFieldId);
      return { silent };
    },
    onSuccess: ({ silent }, variables) => {
      // Invalidate tasks for both source and destination fields
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.oldFieldId] });
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.newFieldId] });
      // Invalidate all tasks query
      queryClient.invalidateQueries({ queryKey: ['allTasks'] });
      // Invalidate all fields to update real-time averages for both fields
      queryClient.invalidateQueries({ queryKey: ['fields'] });
      
      // Only show toast if not silent
      if (!silent) {
        toast.success('Task moved successfully');
      }
    },
    onError: (error: unknown) => {
      // Check for missing profile during task move
      if (isUserNotRegisteredError(error)) {
        console.log('[MoveTask] User not registered detected - refreshing profile state to trigger ProfileSetupModal');
        queryClient.invalidateQueries({ queryKey: ['currentUserProfile', principalKey] });
        queryClient.refetchQueries({ queryKey: ['currentUserProfile', principalKey] });
        // Don't show the toast - let the ProfileSetupModal appear instead
        return;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to move task: ${errorMessage}`);
    },
  });
}

export function useMarkTaskCompleted() {
  const { actor } = useResilientActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  // Get principal string for cache key scoping
  const principalKey = identity && !identity.getPrincipal().isAnonymous() 
    ? identity.getPrincipal().toString() 
    : '';

  return useMutation({
    mutationFn: async ({ 
      taskId, 
      fieldId,
      silent = false,
    }: { 
      taskId: TaskId; 
      fieldId: FieldId;
      silent?: boolean;
    }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.markTaskCompleted(taskId);
      return { silent };
    },
    onSuccess: ({ silent }, variables) => {
      // Invalidate tasks for this field
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.fieldId] });
      // Invalidate all tasks query
      queryClient.invalidateQueries({ queryKey: ['allTasks'] });
      // Invalidate all fields to update real-time averages
      queryClient.invalidateQueries({ queryKey: ['fields'] });
      
      // Only show toast if not silent
      if (!silent) {
        toast.success('Task completed');
      }
    },
    onError: (error: unknown) => {
      // Check for missing profile during task completion
      if (isUserNotRegisteredError(error)) {
        console.log('[MarkTaskCompleted] User not registered detected - refreshing profile state to trigger ProfileSetupModal');
        queryClient.invalidateQueries({ queryKey: ['currentUserProfile', principalKey] });
        queryClient.refetchQueries({ queryKey: ['currentUserProfile', principalKey] });
        // Don't show the toast - let the ProfileSetupModal appear instead
        return;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to mark task as completed: ${errorMessage}`);
    },
  });
}

export function useUndoTaskCompletion() {
  const { actor } = useResilientActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  // Get principal string for cache key scoping
  const principalKey = identity && !identity.getPrincipal().isAnonymous() 
    ? identity.getPrincipal().toString() 
    : '';

  return useMutation({
    mutationFn: async ({ taskId, fieldId }: { taskId: TaskId; fieldId: FieldId }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.undoTaskCompletion(taskId);
    },
    onSuccess: (_, variables) => {
      // Invalidate tasks for this field
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.fieldId] });
      // Invalidate all tasks query
      queryClient.invalidateQueries({ queryKey: ['allTasks'] });
      // Invalidate all fields to update real-time averages
      queryClient.invalidateQueries({ queryKey: ['fields'] });
    },
    onError: (error: unknown) => {
      // Check for missing profile during undo
      if (isUserNotRegisteredError(error)) {
        console.log('[UndoTaskCompletion] User not registered detected - refreshing profile state to trigger ProfileSetupModal');
        queryClient.invalidateQueries({ queryKey: ['currentUserProfile', principalKey] });
        queryClient.refetchQueries({ queryKey: ['currentUserProfile', principalKey] });
        // Don't show the toast - let the ProfileSetupModal appear instead
        return;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to undo completion: ${errorMessage}`);
    },
  });
}

export function useDeleteTask() {
  const { actor } = useResilientActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  // Get principal string for cache key scoping
  const principalKey = identity && !identity.getPrincipal().isAnonymous() 
    ? identity.getPrincipal().toString() 
    : '';

  return useMutation({
    mutationFn: async ({ taskId, fieldId }: { taskId: TaskId; fieldId: FieldId }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteTask(taskId);
    },
    onSuccess: (_, variables) => {
      // Invalidate tasks for this field
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.fieldId] });
      // Invalidate all tasks query
      queryClient.invalidateQueries({ queryKey: ['allTasks'] });
      // Invalidate all fields to update real-time averages
      queryClient.invalidateQueries({ queryKey: ['fields'] });
      toast.success('Task deleted');
    },
    onError: (error: unknown) => {
      // Check for missing profile during task deletion
      if (isUserNotRegisteredError(error)) {
        console.log('[DeleteTask] User not registered detected - refreshing profile state to trigger ProfileSetupModal');
        queryClient.invalidateQueries({ queryKey: ['currentUserProfile', principalKey] });
        queryClient.refetchQueries({ queryKey: ['currentUserProfile', principalKey] });
        // Don't show the toast - let the ProfileSetupModal appear instead
        return;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to delete task: ${errorMessage}`);
    },
  });
}

export function useSearchTasks(fieldId: FieldId | null, searchTerm: string) {
  const { actor, isLoading } = useResilientActor();

  return useQuery<Task[]>({
    queryKey: ['tasks', fieldId, 'search', searchTerm],
    queryFn: async () => {
      if (!actor || !fieldId || !searchTerm) return [];
      return actor.searchTasks(fieldId, searchTerm);
    },
    enabled: !!actor && !isLoading && !!fieldId && !!searchTerm,
  });
}

export function useFilterTasksByAttribute(
  fieldId: FieldId | null,
  attribute: string,
  minValue: bigint,
  maxValue: bigint,
  enabled: boolean
) {
  const { actor, isLoading } = useResilientActor();

  return useQuery<Task[]>({
    queryKey: ['tasks', fieldId, 'filter', attribute, minValue.toString(), maxValue.toString()],
    queryFn: async () => {
      if (!actor || !fieldId) return [];
      return actor.filterTasksByAttribute(fieldId, attribute, minValue, maxValue);
    },
    enabled: !!actor && !isLoading && !!fieldId && enabled,
  });
}

// Export User Data
export function useExportUserData() {
  const { actor, isLoading: actorLoading, isReady } = useResilientActor();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async (): Promise<ExportPayload> => {
      console.log('[ExportUserData] Mutation attempt started');
      console.log('[ExportUserData] Actor available:', !!actor);
      console.log('[ExportUserData] Actor loading:', actorLoading);
      console.log('[ExportUserData] Actor ready:', isReady);
      console.log('[ExportUserData] Identity available:', !!identity);
      console.log('[ExportUserData] Identity is anonymous:', identity?.getPrincipal().isAnonymous());
      
      // Hard client-side guard: prevent anonymous/guest users from attempting export
      if (!identity || identity.getPrincipal().isAnonymous()) {
        console.error('[ExportUserData] Blocked: User is not authenticated (anonymous principal)');
        const error = new Error('LOGIN_REQUIRED: You must log in with Internet Identity to export your data.');
        console.error('[ExportUserData] Error object:', error);
        throw error;
      }
      
      // Guard against actor not ready (initializing after login)
      if (!isReady || actorLoading) {
        console.error('[ExportUserData] Blocked: Actor is initializing');
        const error = new Error('ACTOR_INITIALIZING: The connection is still initializing. Please wait a moment and try again.');
        console.error('[ExportUserData] Error object:', error);
        throw error;
      }
      
      if (!actor) {
        console.error('[ExportUserData] Blocked: Actor not available');
        const error = new Error('ACTOR_UNAVAILABLE: Unable to connect to the backend. Please try again.');
        console.error('[ExportUserData] Error object:', error);
        throw error;
      }
      
      console.log('[ExportUserData] All guards passed, calling backend exportUserData...');
      try {
        const result = await actor.exportUserData();
        console.log('[ExportUserData] Backend call successful, fields:', result.fields.length, 'tasks:', result.tasks.length);
        return result;
      } catch (error) {
        console.error('[ExportUserData] Backend call failed');
        console.error('[ExportUserData] Error object:', error);
        console.error('[ExportUserData] Error type:', typeof error);
        console.error('[ExportUserData] Error message:', error instanceof Error ? error.message : String(error));
        
        // Log nested error properties if available (for reject messages from IC)
        if (error && typeof error === 'object') {
          console.error('[ExportUserData] Error keys:', Object.keys(error));
          const anyError = error as any;
          if (anyError.message) console.error('[ExportUserData] Nested message:', anyError.message);
          if (anyError.code) console.error('[ExportUserData] Error code:', anyError.code);
          if (anyError.reject_message) console.error('[ExportUserData] Reject message:', anyError.reject_message);
          if (anyError.reject_code) console.error('[ExportUserData] Reject code:', anyError.reject_code);
        }
        
        throw error;
      }
    },
    onError: (error: unknown) => {
      console.error('[ExportUserData] Mutation error handler triggered');
      console.error('[ExportUserData] Raw error:', error);
      
      const normalized = normalizeExportUserDataError(error);
      console.error('[ExportUserData] Normalized error category:', normalized.category);
      console.error('[ExportUserData] Normalized error message:', normalized.message);
      
      toast.error(normalized.message);
    },
  });
}

// Import User Data
export function useImportUserData() {
  const { actor, isLoading: actorLoading, isReady } = useResilientActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ExportPayload): Promise<void> => {
      console.log('[ImportUserData] Mutation attempt started');
      console.log('[ImportUserData] Actor available:', !!actor);
      console.log('[ImportUserData] Actor loading:', actorLoading);
      console.log('[ImportUserData] Actor ready:', isReady);
      console.log('[ImportUserData] Identity available:', !!identity);
      console.log('[ImportUserData] Identity is anonymous:', identity?.getPrincipal().isAnonymous());
      
      // Hard client-side guard: prevent anonymous/guest users from attempting import
      if (!identity || identity.getPrincipal().isAnonymous()) {
        console.error('[ImportUserData] Blocked: User is not authenticated (anonymous principal)');
        const error = new Error('LOGIN_REQUIRED: You must log in with Internet Identity to import data.');
        console.error('[ImportUserData] Error object:', error);
        throw error;
      }
      
      // Guard against actor not ready (initializing after login)
      if (!isReady || actorLoading) {
        console.error('[ImportUserData] Blocked: Actor is initializing');
        const error = new Error('ACTOR_INITIALIZING: The connection is still initializing. Please wait a moment and try again.');
        console.error('[ImportUserData] Error object:', error);
        throw error;
      }
      
      if (!actor) {
        console.error('[ImportUserData] Blocked: Actor not available');
        const error = new Error('ACTOR_UNAVAILABLE: Unable to connect to the backend. Please try again.');
        console.error('[ImportUserData] Error object:', error);
        throw error;
      }
      
      console.log('[ImportUserData] All guards passed, calling backend importUserData...');
      console.log('[ImportUserData] Payload contains:', payload.fields.length, 'fields and', payload.tasks.length, 'tasks');
      try {
        await actor.importUserData(payload);
        console.log('[ImportUserData] Backend call successful');
      } catch (error) {
        console.error('[ImportUserData] Backend call failed');
        console.error('[ImportUserData] Error object:', error);
        console.error('[ImportUserData] Error type:', typeof error);
        console.error('[ImportUserData] Error message:', error instanceof Error ? error.message : String(error));
        
        // Log nested error properties if available (for reject messages from IC)
        if (error && typeof error === 'object') {
          console.error('[ImportUserData] Error keys:', Object.keys(error));
          const anyError = error as any;
          if (anyError.message) console.error('[ImportUserData] Nested message:', anyError.message);
          if (anyError.code) console.error('[ImportUserData] Error code:', anyError.code);
          if (anyError.reject_message) console.error('[ImportUserData] Reject message:', anyError.reject_message);
          if (anyError.reject_code) console.error('[ImportUserData] Reject code:', anyError.reject_code);
        }
        
        throw error;
      }
    },
    onSuccess: () => {
      console.log('[ImportUserData] Mutation success, invalidating all data caches');
      // Invalidate all data queries to reflect imported data
      queryClient.invalidateQueries({ queryKey: ['fields'] });
      queryClient.invalidateQueries({ queryKey: ['allTasks'] });
      // Invalidate all task queries (including field-scoped, search, and filter variants)
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0];
          return key === 'tasks';
        }
      });
      
      toast.success('Data imported successfully', {
        description: 'All your Fields and Tasks have been restored.',
      });
    },
    onError: (error: unknown) => {
      console.error('[ImportUserData] Mutation error handler triggered');
      console.error('[ImportUserData] Raw error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error('Failed to import data', {
        description: errorMessage,
      });
    },
  });
}
