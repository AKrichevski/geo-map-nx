import React, { useState, useEffect } from "react";
import { FiPlus, FiEdit, FiMapPin } from "react-icons/fi";
import { FaTrash } from "react-icons/fa";
import { useLayers, useSocket } from '../../../hooks';
import { useMapContext } from '../../../contexts/MapContext';
import { Polygon } from '@geo-map-app/types';

import {
  PolygonListContainer,
  PolygonListHeader,
  PolygonListTitle,
  AddPolygonButton,
  PolygonListContent,
  EmptyLayerMessage,
  PolygonItemContainer,
  PolygonInfoContainer,
  PolygonColorIndicator,
  PolygonDetailsContainer,
  PolygonName,
  PolygonArea,
  PolygonEditingStatus,
  PolygonActionsContainer,
  ActionButton
} from '../../styledComponents/Sidebar/PolygonListStyles';

export interface PolygonListProps {
  setEditPolygonId: (id: number | null) => void;
  setShowCreatePolygonModal: (show: boolean) => void;
}

export interface PolygonItemProps {
  polygon: Polygon;
  isEditing: boolean;
  onEdit: (polygonId: number) => void;
  onDelete: (polygonId: number) => void;
  onJumpToPolygon: (polygon: Polygon) => void;
}

export interface AreaFormatResult {
  formattedValue: string;
  isSmall: boolean;
}

const formatAreaSize = (sizeKm2: number | undefined): AreaFormatResult => {
  if (sizeKm2 === undefined || sizeKm2 === null) {
    return { formattedValue: 'N/A', isSmall: false };
  }

  if (sizeKm2 < 0.1) {
    const sizeM2 = Math.round(sizeKm2 * 1000000);
    return {
      formattedValue: `${sizeM2.toLocaleString()} m²`,
      isSmall: true
    };
  }

  return {
    formattedValue: `${sizeKm2.toFixed(2)} km²`,
    isSmall: false
  };
};

const PolygonItem: React.FC<PolygonItemProps> = ({
                                                   polygon,
                                                   isEditing,
                                                   onEdit,
                                                   onDelete,
                                                   onJumpToPolygon
                                                 }) => {
  const { formattedValue, isSmall } = formatAreaSize(polygon.sizeKm2);

  return (
    <PolygonItemContainer $isEditing={isEditing}>
      <PolygonInfoContainer
        title={`${polygon.name} (${formattedValue}) - Click to locate on map`}
        onClick={() => onJumpToPolygon(polygon)}
      >
        <PolygonColorIndicator $color={polygon.color} />
        <PolygonDetailsContainer>
          <PolygonName>{polygon.name}</PolygonName>
          <PolygonArea $isSmall={isSmall}>
            {formattedValue}
          </PolygonArea>
          {isEditing && (
            <PolygonEditingStatus>
              (editing by someone)
            </PolygonEditingStatus>
          )}
        </PolygonDetailsContainer>
      </PolygonInfoContainer>

      <PolygonActionsContainer>
        <ActionButton
          onClick={() => onJumpToPolygon(polygon)}
          title="Jump to polygon on map"
        >
          <FiMapPin />
        </ActionButton>

        <ActionButton
          onClick={() => onEdit(polygon.id)}
          $isDisabled={isEditing}
          disabled={isEditing}
          color="green"
          title="Edit polygon"
        >
          <FiEdit />
        </ActionButton>

        <ActionButton
          onClick={() => onDelete(polygon.id)}
          $isDisabled={isEditing}
          disabled={isEditing}
          color="red"
          title="Delete polygon"
        >
          <FaTrash />
        </ActionButton>
      </PolygonActionsContainer>
    </PolygonItemContainer>
  );
};

export const PolygonList: React.FC<PolygonListProps> = ({
                                                          setEditPolygonId,
                                                          setShowCreatePolygonModal
                                                        }) => {
  const {
    polygons,
    selectedLayerId,
    deletePolygon,
  } = useLayers();
  const { mapInstance, jumpToPolygon } = useMapContext();
  const [editingPolygons, setEditingPolygons] = useState<Record<number, string>>({});
  const { isConnected, subscribe } = useSocket();

  useEffect(() => {
    if (!isConnected) return;

    const handlePolygonEditing = (data: {
      polygonId: number;
      username: string;
      action: 'start' | 'end'
    }) => {
      if (data.action === 'start') {
        setEditingPolygons(prev => ({
          ...prev,
          [data.polygonId]: data.username
        }));
      } else {
        setEditingPolygons(prev => {
          const newEditing = { ...prev };
          delete newEditing[data.polygonId];
          return newEditing;
        });
      }
    };

    const unsubscribe = subscribe('polygon-editing', handlePolygonEditing);

    return unsubscribe;
  }, [isConnected, subscribe]);

  const handleEditPolygon = (polygonId: number) => {
    if (editingPolygons[polygonId]) {
      alert(`This polygon is currently being edited by ${editingPolygons[polygonId]}`);
      return;
    }

    setEditPolygonId(polygonId);
  };

  const handleDeletePolygon = (polygonId: number) => {
    if (editingPolygons[polygonId]) {
      alert(`Cannot delete: this polygon is currently being edited by ${editingPolygons[polygonId]}`);
      return;
    }

    if (window.confirm('Are you sure you want to delete this polygon?')) {
      deletePolygon(polygonId);
    }
  };

  const handleJumpToPolygon = (polygon: Polygon) => {
    if (!mapInstance || !jumpToPolygon) {
      console.error("Map instance or jump function not available");
      return;
    }

    try {
      let polygonCoords = polygon.coordinates;
      if (Array.isArray(polygonCoords[0]) && Array.isArray(polygonCoords[0][0])) {
        polygonCoords = polygonCoords[0];
      }

      const success = jumpToPolygon(polygonCoords);

      if (!success) {
        console.error(`Failed to jump to polygon: ${polygon.name}`);
      }
    } catch (error) {
      console.error("Error jumping to polygon:", error);
    }
  };

  return (
    <PolygonListContainer>
      <PolygonListHeader>
        <PolygonListTitle>Polygons</PolygonListTitle>
        {selectedLayerId && (
          <AddPolygonButton onClick={() => setShowCreatePolygonModal(true)}>
            <FiPlus />
          </AddPolygonButton>
        )}
      </PolygonListHeader>

      <PolygonListContent>
        {polygons.length === 0 ? (
          <EmptyLayerMessage>
            {selectedLayerId
              ? "No polygons in this layer. Click the + button to create one."
              : "Select a layer to view polygons."}
          </EmptyLayerMessage>
        ) : (
          polygons.map((p) => (
            <PolygonItem
              key={p.id}
              polygon={p}
              isEditing={!!editingPolygons[p.id]}
              onEdit={handleEditPolygon}
              onDelete={handleDeletePolygon}
              onJumpToPolygon={handleJumpToPolygon}
            />
          ))
        )}
      </PolygonListContent>
    </PolygonListContainer>
  );
};

export default PolygonList;
