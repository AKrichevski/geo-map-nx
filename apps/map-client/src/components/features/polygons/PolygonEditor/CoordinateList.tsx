import React, { useCallback } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult
} from '@hello-pangea/dnd';
import { FiX } from 'react-icons/fi';
import {
  CoordinateText,
  DraggableItem,
  DroppableContainer, IndexLabel,
  ListContainer, RemoveButton
} from '../../../styledComponents/polygonEditor/coordinateListStyles';

interface CoordinateListProps {
  coordinates: [number, number][];
  updatePoints: (newCoords: [number, number][]) => void;
}

export const CoordinateList: React.FC<CoordinateListProps> = ({
                                                                coordinates,
                                                                updatePoints,
                                                              }) => {
  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;

    const items = [...coordinates];
    const [moved] = items.splice(result.source.index, 1);

    items.splice(result.destination.index, 0, moved);

    updatePoints(items);
  }, [coordinates, updatePoints]);

  const remove = useCallback((idx: number) => {
    const filteredItems = coordinates.filter((_, i) => i !== idx);
    updatePoints(filteredItems);
  }, [coordinates, updatePoints]);

  return (
    <ListContainer>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="coordsDroppable">
          {(provided) => (
            <DroppableContainer
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {coordinates && coordinates.map(([lng, lat], index) => {
                const id = String(index);
                return (
                  <Draggable key={id} draggableId={id} index={index}>
                    {(provided2) => (
                      <DraggableItem
                        ref={provided2.innerRef}
                        {...provided2.draggableProps}
                        {...provided2.dragHandleProps}
                        style={provided2.draggableProps.style}
                      >
                        <IndexLabel>
                          #{index + 1}
                        </IndexLabel>
                        <CoordinateText>
                          X: {lng.toFixed(4)}, Y: {lat.toFixed(4)}
                        </CoordinateText>
                        <RemoveButton
                          onClick={() => remove(index)}
                          type="button"
                        >
                          <FiX />
                        </RemoveButton>
                      </DraggableItem>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </DroppableContainer>
          )}
        </Droppable>
      </DragDropContext>
    </ListContainer>
  );
};
