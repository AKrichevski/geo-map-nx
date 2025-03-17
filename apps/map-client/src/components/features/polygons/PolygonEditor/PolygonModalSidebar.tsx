import React from 'react';
import { CoordinateList } from './CoordinateList';
import { AreaDisplay } from './AreaDisplay';
import { MEASURE_NAMES } from '@geo-map-app/types';
import {
  CoordinatesHeader, GeoJsonDisplay,
  GeoJsonToggleButton, NoPointsMessage,
  SidebarSection
} from '../../../styledComponents/polygonEditor/polygonCreateEditModalStyles';
import { ErrorMessage } from '../../../styledComponents/addLayerModalStyles';

export interface PolygonSidebarProps {
  error: string | null;
  coordinates: [number, number][];
  showGeoJson: boolean;
  isSaving: boolean;
  estimatedAreaValue: number | null;
  estimatedAreaUnit: MEASURE_NAMES;
  isCalculatingArea: boolean;
  updatePoints: (newCoords: [number, number][]) => void;
  toggleGeoJson: () => void;
  getGeoJsonString: () => string;
}

export const PolygonModalSidebar: React.FC<PolygonSidebarProps> = ({
                                                                     error,
                                                                     coordinates,
                                                                     showGeoJson,
                                                                     isSaving,
                                                                     estimatedAreaValue,
                                                                     estimatedAreaUnit,
                                                                     isCalculatingArea,
                                                                     updatePoints,
                                                                     toggleGeoJson,
                                                                     getGeoJsonString
                                                                   }) => {
  return (
    <SidebarSection>
      {error && (
        <ErrorMessage>
          {error}
        </ErrorMessage>
      )}

      <CoordinatesHeader>
        <h4 style={{ margin: 0 }}>
          Coordinates ({coordinates.length} points)
        </h4>
        <GeoJsonToggleButton
          onClick={toggleGeoJson}
          disabled={isSaving}
        >
          {showGeoJson ? "Show List" : "Show GeoJSON"}
        </GeoJsonToggleButton>
      </CoordinatesHeader>

      {showGeoJson ? (
        <GeoJsonDisplay>
          {getGeoJsonString()}
        </GeoJsonDisplay>
      ) : (
        <CoordinateList
          coordinates={coordinates}
          updatePoints={updatePoints}
        />
      )}

      {coordinates.length >= 3 ? (
        <AreaDisplay
          areaValue={estimatedAreaValue}
          areaUnit={estimatedAreaUnit}
          loading={isCalculatingArea}
        />
      ) : (
        <NoPointsMessage>
          Add at least 3 points to calculate area
        </NoPointsMessage>
      )}
    </SidebarSection>
  );
};
