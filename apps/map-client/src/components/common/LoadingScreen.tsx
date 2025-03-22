import React from 'react';
import {
  LoadingCard,
  LoadingContainer,
  LoadingSpinner,
  LoadingProgress,
  ErrorMessage,
  RetryButton,
  StatusText
} from '../styledComponents/screens/loadingScreenStyles';

interface LoadingScreenProps {
  isSyncing?: boolean;
  error?: Error | null;
  syncProgress?: {
    layers: number;
    polygons: number;
  };
  onRetry?: () => void;
}

export function LoadingScreen({
                                isSyncing = true,
                                error = null,
                                syncProgress = { layers: 0, polygons: 0 },
                                onRetry
                              }: LoadingScreenProps) {
  return (
    <LoadingContainer>
      <LoadingCard>
        <h2>Loading GeoMapApp</h2>

        {error ? (
          <>
            <ErrorMessage>
              <p>There was a problem connecting to the server:</p>
              <p>{error.message}</p>
              {syncProgress.layers > 0 && (
                <StatusText>
                  Working in offline mode with {syncProgress.layers} layers and {syncProgress.polygons} polygons.
                </StatusText>
              )}
            </ErrorMessage>
            {onRetry && (
              <RetryButton onClick={onRetry}>
                Try Again
              </RetryButton>
            )}
          </>
        ) : (
          <>
            <p>{isSyncing ? "Syncing data with server..." : "Preparing application..."}</p>
            <LoadingSpinner />

            {syncProgress.layers > 0 && (
              <LoadingProgress>
                Synchronized: {syncProgress.layers} layers, {syncProgress.polygons} polygons
              </LoadingProgress>
            )}
          </>
        )}
      </LoadingCard>
    </LoadingContainer>
  );
}
