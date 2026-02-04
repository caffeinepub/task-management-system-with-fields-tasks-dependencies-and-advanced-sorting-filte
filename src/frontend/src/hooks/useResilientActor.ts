import { useInternetIdentity } from './useInternetIdentity';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { type backendInterface } from '../backend';
import { createActorWithConfig } from '../config';
import { getSecretParameter } from '../utils/urlParams';

const ACTOR_QUERY_KEY = 'resilient-actor';

interface ActorState {
  actor: backendInterface | null;
  isLoading: boolean;
  error: Error | null;
}

export function useResilientActor() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const previousActorRef = useRef<backendInterface | null>(null);

  const actorQuery = useQuery<backendInterface, Error>({
    queryKey: [ACTOR_QUERY_KEY, identity?.getPrincipal().toString()],
    queryFn: async () => {
      console.log('[Actor Init] Starting actor initialization...');
      const isAuthenticated = !!identity;

      if (!isAuthenticated) {
        console.log('[Actor Init] Creating anonymous actor');
        // Return anonymous actor if not authenticated
        return await createActorWithConfig();
      }

      console.log('[Actor Init] Creating authenticated actor');
      const actorOptions = {
        agentOptions: {
          identity
        }
      };

      const actor = await createActorWithConfig(actorOptions);
      
      // Safely attempt access control initialization
      // Skip if token is missing or empty to prevent crashes
      const adminToken = getSecretParameter('caffeineAdminToken') || '';
      
      if (adminToken.trim()) {
        try {
          console.log('[Actor Init] Attempting access control initialization');
          await actor._initializeAccessControlWithSecret(adminToken);
          console.log('[Actor Init] Access control initialized successfully');
        } catch (initError) {
          // Log but don't throw - allow user to proceed as normal user
          console.warn('[Actor Init] Access control initialization failed (non-critical):', initError);
        }
      } else {
        console.log('[Actor Init] No admin token provided, skipping access control');
      }
      
      console.log('[Actor Init] Actor initialization complete');
      return actor;
    },
    staleTime: Infinity,
    gcTime: Infinity, // Keep actor in cache
    enabled: true,
    retry: (failureCount, error) => {
      // Only retry network errors, not auth errors
      const isNetworkError = error?.message?.toLowerCase().includes('network') || 
                            error?.message?.toLowerCase().includes('fetch');
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
  const isReady = !!actorQuery.data && !actorQuery.isFetching && !actorQuery.isLoading;

  return {
    actor: actorQuery.data || null,
    isLoading: actorQuery.isLoading || actorQuery.isFetching,
    isReady, // New readiness signal for mutations
    error: actorQuery.error,
    refetch: actorQuery.refetch,
  };
}
