import React from 'react';
import { LoadingCard, LoadingContainer, LoadingSpinner } from '../styledComponents/screens/loadingScreenStyles';

export function LoadingScreen() {
  return (
    <LoadingContainer>
      <LoadingCard>
        <h2>Loading GeoMapApp</h2>
        <p>Connecting to server...</p>
        <LoadingSpinner />
      </LoadingCard>
    </LoadingContainer>
  );
}
