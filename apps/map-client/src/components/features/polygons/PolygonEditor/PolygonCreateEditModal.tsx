import React, { useState, useEffect, useCallback, useRef } from "react";
import { DraggableModal } from "../../../common/Modal/DraggableModal";
import { ManualPolygonMap } from "./ManualPolygonMap";
import { PolygonModalHeader } from "./PolygonModalHeader";
import { PolygonModalSidebar } from "./PolygonModalSidebar";
import { useLayers, useSocket } from '../../../../hooks';
import socketService from "../../../../services/socket";
import colors from '../../../../consts/colors';
import { MEASURE_NAMES } from '../../../../consts/strings';
import {
  ModalContainer,
  MapSection
} from '../../../styledComponents/polygonEditor/polygonCreateEditModalStyles';

export interface PolygonCreateEditModalProps {
  onClose: () => void;
  editPolygonId?: number | null;
  initialCenter?: [number, number] | null;
}

export const PolygonCreateEditModal: React.FC<PolygonCreateEditModalProps> = ({
                                                                                onClose,
                                                                                editPolygonId = null,
                                                                                initialCenter = null
                                                                              }) => {
  const { selectedLayerId, createPolygon, updatePolygon, polygons } = useLayers();
  const { socket } = useSocket();
  const [name, setName] = useState<string>("");
  const [color, setColor] = useState<string>(colors.black);
  const [coordinates, setCoordinates] = useState<[number, number][]>([]);
  const [showGeoJson, setShowGeoJson] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [estimatedAreaValue, setEstimatedAreaValue] = useState<number | null>(null);
  const [estimatedAreaUnit, setEstimatedAreaUnit] = useState<MEASURE_NAMES>(MEASURE_NAMES.SQUARE_KILOMETER);
  const [isCalculatingArea, setIsCalculatingArea] = useState<boolean>(false);
  const initialCenterRef = useRef<[number, number] | null>(null);

  console.log("render PolygonCreateEditModal ", editPolygonId ? "editing" : "creating")

  useEffect(() => {
    return () => {
        socketService.clearDrawing();

        if (editPolygonId) {
          socket?.emit('editing-polygon', {
            polygonId: editPolygonId,
            action: 'end'
          });
        }

        socketService.setUserActivity(null);
    };
  }, []);

  useEffect(() => {
    initialCenterRef.current = initialCenter;
  }, [initialCenter]);


  useEffect(() => {
    if (editPolygonId) {
      socket?.emit('editing-polygon', {
        polygonId: editPolygonId,
        action: 'start',
        coordinates: coordinates.length > 0 ? coordinates[0] : undefined
      });

      socketService.setUserActivity({
        type: 'editing',
        polygonId: editPolygonId,
        coordinates: coordinates.length > 0 ? coordinates[0] : undefined
      });
    }
  }, [coordinates]);

  useEffect(() => {
    if (editPolygonId) {
      const polygonToEdit = polygons.find((p) => p.id === editPolygonId);
      if (polygonToEdit) {
        setName(polygonToEdit.name || "");
        setColor(polygonToEdit.color || colors.black);

        const polygonCoords = polygonToEdit.coordinates;
        if (Array.isArray(polygonCoords) && polygonCoords.length > 0) {
          const coords = Array.isArray(polygonCoords[0]) && polygonCoords[0].length === 2
            ? polygonCoords as [number, number][]
            : polygonCoords[0] as [number, number][];

          setCoordinates(coords);

          if (polygonToEdit.sizeKm2) {
            if (polygonToEdit.sizeKm2 < 0.1) {
              setEstimatedAreaValue(Math.round(polygonToEdit.sizeKm2 * 1000000));
              setEstimatedAreaUnit(MEASURE_NAMES.SQUARE_METER);
            } else {
              setEstimatedAreaValue(polygonToEdit.sizeKm2);
              setEstimatedAreaUnit(MEASURE_NAMES.SQUARE_KILOMETER);
            }
          } else {
            setEstimatedAreaValue(null);
          }
        } else {
          setCoordinates([]);
          setEstimatedAreaValue(null);
        }
      }
    }
  }, [polygons]);

  useEffect(() => {
    if (coordinates.length >= 3 && socket) {
      setIsCalculatingArea(true);
      socket.emit('calculate-area', { coordinates }, (response) => {
        setIsCalculatingArea(false);
        if (response && response.areaValue !== undefined) {
          setEstimatedAreaValue(response.areaValue);
          setEstimatedAreaUnit(response.areaUnit || MEASURE_NAMES.SQUARE_KILOMETER);
        } else if (response && response.sizeKm2 !== undefined) {
          if (response.sizeKm2 < 0.1) {
            setEstimatedAreaValue(Math.round(response.sizeKm2 * 1000000));
            setEstimatedAreaUnit(MEASURE_NAMES.SQUARE_METER);
          } else {
            setEstimatedAreaValue(response.sizeKm2);
            setEstimatedAreaUnit(MEASURE_NAMES.SQUARE_KILOMETER);
          }
        } else if (response && response.error) {
          setEstimatedAreaValue(null);
          setEstimatedAreaUnit(MEASURE_NAMES.SQUARE_KILOMETER);
        }
      });
    } else {
      setEstimatedAreaValue(null);
      setIsCalculatingArea(false);
    }
  }, [coordinates]);

  const handleNewPoint = useCallback((newPoints: [number, number][]) => {
    if (Array.isArray(newPoints) && newPoints.length > 0) {
      const point = newPoints[0];
      if (Array.isArray(point) && point.length === 2 &&
        typeof point[0] === 'number' && typeof point[1] === 'number') {

        setCoordinates(prev => [...prev, point]);

        if (editPolygonId) {
          socketService.setUserActivity({
            type: 'editing',
            polygonId: editPolygonId,
            coordinates: point
          });
        } else {
          socketService.setUserActivity({
            type: 'drawing',
            coordinates: point
          });
        }

        if (!editPolygonId) {
          socket?.emit('drawing-update', {
            points: [...coordinates, point],
            isCompleted: false
          });
        } else {
          socket?.emit('polygon-coordinates-update', {
            polygonId: editPolygonId,
            coordinates: [...coordinates, point]
          });
        }
      } else {
        console.warn("Invalid point format:", point);
      }
    }
  }, [coordinates]);

  const updatePoints = useCallback((newCoords: [number, number][]) => {
    if (!Array.isArray(newCoords)) {
      return;
    }
    setCoordinates(newCoords);

    if (editPolygonId && socket) {
      socket.emit('polygon-coordinates-update', {
        polygonId: editPolygonId,
        coordinates: newCoords
      });

      if (newCoords.length > 0) {
        const lastPoint = newCoords[newCoords.length - 1];
        socketService.setUserActivity({
          type: 'editing',
          polygonId: editPolygonId,
          coordinates: lastPoint
        });
      }
    } else if (!editPolygonId && socket) {
      if (newCoords.length > 0) {
        const lastPoint = newCoords[newCoords.length - 1];
        socketService.setUserActivity({
          type: 'drawing',
          coordinates: lastPoint
        });
      }

      socket.emit('drawing-update', {
        points: newCoords,
        isCompleted: false
      });
    }
  }, [editPolygonId]);

  const handleSave = useCallback(() => {
    setError(null);

    if (!name.trim()) {
      setError("Please enter a polygon name");
      return;
    }

    if (coordinates.length < 3) {
      setError("Please add at least 3 points to create a polygon");
      return;
    }

    setIsSaving(true);

    if (editPolygonId) {
      handleEditPolygon(editPolygonId, name, color, coordinates);
    } else {
      handleCreatePolygon(name, color, coordinates);
    }
  }, [name, coordinates, color]);

  const handleCreatePolygon = useCallback(async (name: string, color: string, coords: [number, number][]) => {
    if (!selectedLayerId) {
      setError("No layer selected");
      setIsSaving(false);
      return;
    }

    try {
      let sizeKm2: number | undefined = undefined;
      if (estimatedAreaValue !== null) {
        sizeKm2 = estimatedAreaUnit === MEASURE_NAMES.SQUARE_METER
          ? estimatedAreaValue / 1000000
          : estimatedAreaValue;
      }

      if (socket) {
        socket.emit('drawing-update', {
          points: coords,
          isCompleted: true
        });
      }

      await createPolygon({
        layerId: selectedLayerId,
        name,
        color,
        coordinates: coords,
        sizeKm2: sizeKm2
      });

      setIsSaving(false);
      onClose()
    } catch (error) {
      setIsSaving(false);
      setError(`Failed to create polygon: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [createPolygon, selectedLayerId, estimatedAreaValue, estimatedAreaUnit]);

  const handleEditPolygon = useCallback(async (polygonId: number, name: string, color: string, coords: [number, number][]) => {
    if (!selectedLayerId) {
      setError("No layer selected");
      setIsSaving(false);
      return;
    }

    try {
      const polygonToEdit = polygons.find((p) => p.id === polygonId);
      if (!polygonToEdit) {
        setError("Polygon not found");
        setIsSaving(false);
        return;
      }

      let sizeKm2: number | undefined = undefined;
      if (estimatedAreaValue !== null) {
        sizeKm2 = estimatedAreaUnit === MEASURE_NAMES.SQUARE_METER
          ? estimatedAreaValue / 1000000
          : estimatedAreaValue;
      }

      await updatePolygon(polygonId, {
        id: polygonToEdit.id,
        layerId: selectedLayerId,
        name,
        color,
        coordinates: coords,
        sizeKm2: sizeKm2
      });

      setIsSaving(false);
      onClose()
    } catch (error) {
      setIsSaving(false);
      setError(`Failed to update polygon: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [updatePolygon, polygons, selectedLayerId, estimatedAreaValue, estimatedAreaUnit]);

  const getGeoJsonString = useCallback(() => {
    if (coordinates.length === 0) return "";

    const closedCoords = [...coordinates];
    if (coordinates.length >= 3 &&
      (coordinates[0][0] !== coordinates[coordinates.length - 1][0] ||
        coordinates[0][1] !== coordinates[coordinates.length - 1][1])) {
      closedCoords.push(coordinates[0]);
    }

    const areaProperty = estimatedAreaValue !== null ? {
      area: estimatedAreaValue,
      areaUnit: estimatedAreaUnit
    } : {};

    const geoJson = {
      type: "Feature",
      properties: {
        name: name || "Unnamed Polygon",
        color: color,
        ...areaProperty
      },
      geometry: {
        type: "Polygon",
        coordinates: [closedCoords]
      }
    };

    return JSON.stringify(geoJson, null, 2);
  }, [coordinates, name, color, estimatedAreaValue, estimatedAreaUnit]);


  if (!selectedLayerId) {
    return (
      <DraggableModal isResizable={false}>
        <div style={{ padding: "20px", textAlign: "center" }}>
          <h3>Please select a layer first</h3>
          <button onClick={onClose} style={{ marginTop: "10px" }}>Close</button>
        </div>
      </DraggableModal>
    );
  }

  return (
    <DraggableModal isResizable>
      <PolygonModalHeader
        editPolygonId={editPolygonId}
        name={name}
        color={color}
        isSaving={isSaving}
        onNameChange={setName}
        onColorChange={setColor}
        onSave={handleSave}
        onClose={onClose}
      />

      <ModalContainer>
        <MapSection>
          <ManualPolygonMap
            points={coordinates}
            onPointsChange={handleNewPoint}
            updatePoints={updatePoints}
            strokeColor={color}
            initialCenter={initialCenterRef.current}
          />
        </MapSection>

        <PolygonModalSidebar
          error={error}
          coordinates={coordinates}
          showGeoJson={showGeoJson}
          isSaving={isSaving}
          estimatedAreaValue={estimatedAreaValue}
          estimatedAreaUnit={estimatedAreaUnit}
          isCalculatingArea={isCalculatingArea}
          updatePoints={updatePoints}
          toggleGeoJson={() => setShowGeoJson(!showGeoJson)}
          getGeoJsonString={getGeoJsonString}
        />
      </ModalContainer>
    </DraggableModal>
  );
};
