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
import { DEFAULT_BACKGROUND_ID } from '../utils/fieldCardBackgrounds';

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isLoading: actorLoading, isReady } = useResilientActor();
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
        return profile;
      } catch (error) {
        console.error('[Profile Query] Profile fetch failed');
        console.error('[Profile Query] Error:', error);
        
        // Special handling: "User is not registered" means new user, not an error
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
    // Only enable when authenticated and actor is ready
    enabled: isReady && !!identity && !identity.getPrincipal().isAnonymous(),
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
    // Return loading state that accounts for actor dependency
    isLoading: actorLoading || query.isLoading,
    // Only mark as fetched when actor is ready and query has completed
    isFetched: isReady && !!identity && !identity.getPrincipal().isAnonymous() && query.isFetched,
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
      
      // Hard client-side guard: prevent anonymous/guest users from attempting profile save
      if (!identity || identity.getPrincipal().isAnonymous()) {
        console.error('[SaveProfile] Blocked: User is not authenticated (anonymous principal)');
        const error = new Error('LOGIN_REQUIRED: You must log in with Internet Identity to save your profile.');
        throw error;
      }
      
      // Guard against actor not ready (initializing after login)
      if (!isReady || actorLoading) {
        console.error('[SaveProfile] Blocked: Actor is initializing');
        const error = new Error('ACTOR_INITIALIZING: The connection is still initializing. Please wait a moment and try again.');
        throw error;
      }
      
      if (!actor) {
        console.error('[SaveProfile] Blocked: Actor not available');
        const error = new Error('ACTOR_UNAVAILABLE: Unable to connect to the backend. Please try again.');
        throw error;
      }
      
      console.log('[SaveProfile] All guards passed, calling backend saveCallerUserProfile...');
      await actor.saveCallerUserProfile(profile);
      console.log('[SaveProfile] Backend call successful');
    },
    onSuccess: (_, profile) => {
      console.log('[SaveProfile] Mutation success, updating profile cache with principal-scoped key:', principalKey);
      queryClient.setQueryData(['currentUserProfile', principalKey], profile);
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile', principalKey] });
      toast.success('Profile saved successfully');
    },
    onError: (error: unknown) => {
      console.error('[SaveProfile] Mutation error handler triggered');
      const normalized = normalizeProfileSaveError(error);
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

  return useMutation({
    mutationFn: async ({ name, backgroundColor }: { name: string; backgroundColor?: string }) => {
      if (!identity || identity.getPrincipal().isAnonymous()) {
        throw new Error('LOGIN_REQUIRED: You must log in with Internet Identity to create Fields.');
      }
      
      if (!isReady || actorLoading) {
        throw new Error('ACTOR_INITIALIZING: The connection is still initializing. Please wait a moment and try again.');
      }
      
      if (!actor) {
        throw new Error('ACTOR_UNAVAILABLE: Unable to connect to the backend. Please try again.');
      }
      
      const finalBackgroundColor = backgroundColor || DEFAULT_BACKGROUND_ID;
      return actor.createField(name, DEFAULT_ICON, DEFAULT_COLOR_ID, finalBackgroundColor);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fields'] });
      toast.success('Field created successfully');
    },
    onError: (error: unknown) => {
      const normalized = normalizeFieldCreationError(error);
      toast.error(normalized.message);
    },
  });
}

export function useUpdateField() {
  const { actor } = useResilientActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      fieldId, 
      name, 
      icon, 
      color, 
      backgroundColor 
    }: { 
      fieldId: FieldId; 
      name: string; 
      icon: string; 
      color: string; 
      backgroundColor: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateField(fieldId, name, icon, color, backgroundColor);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fields'] });
      toast.success('Field updated successfully');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to update field';
      toast.error(message);
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fields'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Field deleted successfully');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to delete field';
      toast.error(message);
    },
  });
}

// Task Queries
export function useGetAllTasks() {
  const { actor, isLoading } = useResilientActor();

  return useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllTasks();
    },
    enabled: !!actor && !isLoading,
    refetchOnWindowFocus: true,
  });
}

export function useGetTasksByField(fieldId: FieldId) {
  const { actor, isLoading } = useResilientActor();

  return useQuery<Task[]>({
    queryKey: ['tasks', fieldId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTasksByField(fieldId);
    },
    enabled: !!actor && !isLoading && !!fieldId,
    refetchOnWindowFocus: true,
  });
}

export function useCreateTask() {
  const { actor } = useResilientActor();
  const queryClient = useQueryClient();

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
      return actor.createTask(
        fieldId,
        name,
        urgency,
        value,
        interest,
        influence,
        duration,
        durationUnit,
        dependencies
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['fields'] });
      toast.success('Task created successfully');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to create task';
      toast.error(message);
    },
  });
}

export function useUpdateTask() {
  const { actor } = useResilientActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
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
      return actor.updateTask(
        taskId,
        name,
        urgency,
        value,
        interest,
        influence,
        duration,
        durationUnit,
        dependencies
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['fields'] });
      toast.success('Task updated successfully');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to update task';
      toast.error(message);
    },
  });
}

export function useMoveTaskToField() {
  const { actor } = useResilientActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, newFieldId }: { taskId: TaskId; newFieldId: FieldId }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.moveTaskToField(taskId, newFieldId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['fields'] });
      toast.success('Task moved successfully');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to move task';
      toast.error(message);
    },
  });
}

export function useMarkTaskCompleted() {
  const { actor } = useResilientActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: TaskId) => {
      if (!actor) throw new Error('Actor not available');
      return actor.markTaskCompleted(taskId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['fields'] });
      toast.success('Task marked as completed');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to mark task as completed';
      toast.error(message);
    },
  });
}

export function useUndoTaskCompletion() {
  const { actor } = useResilientActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: TaskId) => {
      if (!actor) throw new Error('Actor not available');
      return actor.undoTaskCompletion(taskId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['fields'] });
      toast.success('Task marked as incomplete');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to undo task completion';
      toast.error(message);
    },
  });
}

export function useDeleteTask() {
  const { actor } = useResilientActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: TaskId) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteTask(taskId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['fields'] });
      toast.success('Task deleted successfully');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to delete task';
      toast.error(message);
    },
  });
}

// Export/Import
export function useExportUserData() {
  const { actor, isReady } = useResilientActor();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async (): Promise<ExportPayload> => {
      if (!identity || identity.getPrincipal().isAnonymous()) {
        throw new Error('LOGIN_REQUIRED');
      }
      
      if (!isReady || !actor) {
        throw new Error('ACTOR_UNAVAILABLE');
      }

      return actor.exportUserData();
    },
    onError: (error: unknown) => {
      const normalized = normalizeExportUserDataError(error);
      toast.error(normalized.message);
    },
  });
}

export function useImportUserData() {
  const { actor } = useResilientActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ExportPayload) => {
      if (!actor) throw new Error('Actor not available');
      return actor.importUserData(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fields'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Data imported successfully');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to import data';
      toast.error(message);
    },
  });
}
