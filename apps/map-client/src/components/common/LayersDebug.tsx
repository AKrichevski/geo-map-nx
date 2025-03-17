import React from 'react';
import { useLayers } from '../../hooks';
import { DebugContainer, DebugList, DebugListItem, NoLayersMessage } from '../styledComponents/layersDebugStyles';

export function LayersDebug() {
  const { layers, selectedLayerId } = useLayers();

  return (
    <DebugContainer>
      <div><strong>Layers ({layers?.length || 0}):</strong></div>
      {layers && layers.length > 0 ? (
        <DebugList>
          {layers.map(layer => (
            <DebugListItem
              key={layer.id}
              $isSelected={selectedLayerId === layer.id}
            >
              {layer.name} (ID: {layer.id})
            </DebugListItem>
          ))}
        </DebugList>
      ) : (
        <NoLayersMessage>No layers available</NoLayersMessage>
      )}
      <div><strong>Selected ID:</strong> {selectedLayerId || 'None'}</div>
    </DebugContainer>
  );
}
