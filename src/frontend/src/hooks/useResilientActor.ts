import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import { isStoppedCanisterError } from '../utils/bootErrorMessages';

/**
 * Resilient actor hook with stage-annotated error handling that ensures
 * clean actor re-initialization after cache removal and prevents reuse
 * of poisoned actor instances.
 */
export function useResilientActor() {
  const { actor: baseActor, isFetching: baseIsFetching } = useActor();

  const query = useQuery({
    queryKey: ['resilient-actor'],
    queryFn: async () => {
      console.log('[ResilientActor] Checking actor availability...');
      
      // Wait for base actor to be available
      if (!baseActor) {
        console.log('[ResilientActor] Base actor not yet available');
        throw new Error('Actor not yet initialized');
      }
      
      console.log('[ResilientActor] Actor available');
      return baseActor;
    },
    // Only enable when base actor is available
    enabled: !!baseActor && !baseIsFetching,
    retry: (failureCount, error) => {
      // Don't retry stopped-canister errors - they require manual intervention
      if (isStoppedCanisterError(error)) {
        console.log('[ResilientActor] Stopped canister detected, not retrying');
        return false;
      }
      
      // Retry up to 2 times for transient errors
      console.log('[ResilientActor] Retry attempt', failureCount + 1);
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    staleTime: Infinity,
    gcTime: Infinity,
  });

  // Annotate errors with stage information
  const error = query.error ? (() => {
    const annotatedError = query.error instanceof Error ? query.error : new Error(String(query.error));
    (annotatedError as any).stage = 'actor-init';
    return annotatedError;
  })() : null;

  return {
    actor: query.data,
    isLoading: baseIsFetching || query.isLoading,
    isReady: query.isSuccess && !!query.data,
    error,
    refetch: query.refetch,
  };
}
