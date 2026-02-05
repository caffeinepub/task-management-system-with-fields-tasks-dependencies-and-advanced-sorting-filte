import { useInternetIdentity } from './useInternetIdentity';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { type backendInterface } from '../backend';
import { createActorWithConfig } from '../config';

const ACTOR_QUERY_KEY = 'resilient-actor';

interface ActorState {
  actor: backendInterface | null;
  isLoading: boolean;
  error: Error | null;
}

export function useResilientActor() {
  const { identity, isInitializing } = useInternetIdentity();
  const queryClient = useQueryClient();
  const previousActorRef = useRef<backendInterface | null>(null);

  // Determine if we have an authenticated (non-anonymous) identity
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  const actorQuery = useQuery<backendInterface, Error>({
    queryKey: [ACTOR_QUERY_KEY, identity?.getPrincipal().toString()],
    queryFn: async () => {
      console.log('[Actor Init] Starting actor initialization...');
      console.log('[Actor Init] Is authenticated:', isAuthenticated);

      try {
        // Create actor with appropriate identity
        const actorOptions = identity ? {
          agentOptions: {
            identity
          }
        } : undefined;

        console.log('[Actor Init] Creating actor with', identity ? 'authenticated' : 'anonymous', 'identity');
        const actor = await createActorWithConfig(actorOptions);
        
        console.log('[Actor Init] Actor initialization complete');
        return actor;
      } catch (error) {
        console.error('[Actor Init] Actor initialization failed');
        console.error('[Actor Init] Error:', error);
        console.error('[Actor Init] Error type:', typeof error);
        
        // Log structured error details for diagnosis
        if (error && typeof error === 'object') {
          const anyError = error as any;
          console.error('[Actor Init] Error keys:', Object.keys(anyError));
          if (anyError.message) console.error('[Actor Init] Message:', anyError.message);
          if (anyError.reject_message) console.error('[Actor Init] Reject message:', anyError.reject_message);
          if (anyError.code) console.error('[Actor Init] Code:', anyError.code);
          if (anyError.reject_code) console.error('[Actor Init] Reject code:', anyError.reject_code);
        }
        
        // Annotate error with stage information for better UI messaging
        const annotatedError = error instanceof Error ? error : new Error(String(error));
        (annotatedError as any).stage = 'actor-init';
        throw annotatedError;
      }
    },
    staleTime: Infinity,
    gcTime: Infinity, // Keep actor in cache
    // Only enable when identity initialization is complete
    enabled: !isInitializing,
    retry: (failureCount, error) => {
      // Only retry network errors, not auth errors or stopped-canister errors
      const errorText = String(error?.message || error).toLowerCase();
      const isNetworkError = errorText.includes('network') || errorText.includes('fetch');
      const isStoppedCanister = errorText.includes('is stopped');
      
      // Don't retry stopped-canister errors (user should manually retry after backend is restarted)
      if (isStoppedCanister) return false;
      
      return isNetworkError && failureCount < 2;
    },
    retryDelay: 1000,
  });

  // When actor instance changes (login/logout), invalidate all non-actor caches
  useEffect(() => {
    const currentActor = actorQuery.data;
    
    // Only invalidate if we have a new actor instance (not just initial load)
    if (currentActor && currentActor !== previousActorRef.current && previousActorRef.current !== null) {
      console.log('[Actor Change] Actor instance changed, invalidating dependent queries');
      
      // Invalidate all queries except actor queries
      queryClient.invalidateQueries({
        predicate: (query) => {
          return !query.queryKey.includes(ACTOR_QUERY_KEY);
        }
      });
      
      // Refetch fields and profile to ensure fresh data
      queryClient.refetchQueries({ queryKey: ['fields'] });
      queryClient.refetchQueries({ queryKey: ['currentUserProfile'] });
    }
    
    previousActorRef.current = currentActor || null;
  }, [actorQuery.data, queryClient]);

  // Derive a readiness signal: actor is ready when it's available and not currently fetching
  // For authenticated users, we need both actor ready AND identity settled
  const isReady = !!actorQuery.data && !actorQuery.isFetching && !actorQuery.isLoading && !isInitializing;

  return {
    actor: actorQuery.data || null,
    isLoading: actorQuery.isLoading || actorQuery.isFetching || isInitializing,
    isReady, // New readiness signal for mutations
    error: actorQuery.error,
    refetch: actorQuery.refetch,
  };
}
