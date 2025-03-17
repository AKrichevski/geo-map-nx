import React from 'react';
import { MEASURE_NAMES } from '../../../../consts/strings';
import {
  AreaContainer,
  AreaHeader,
  AreaInfoSection,
  AreaValue, InfoIcon,
  InfoParagraph
} from '../../../styledComponents/areaDisplayStyles';

interface AreaDisplayProps {
  areaValue: number | null;
  areaUnit?: MEASURE_NAMES.SQUARE_KILOMETER | MEASURE_NAMES.SQUARE_METER | null;
  loading?: boolean;
}

export const AreaDisplay: React.FC<AreaDisplayProps> = ({
                                                          areaValue,
                                                          areaUnit = MEASURE_NAMES.SQUARE_METER,
                                                          loading = false
                                                        }) => {
  if (areaValue === null || areaValue === 0) {
    return null;
  }

  const formattedArea = loading
    ? "Calculating..."
    : `${areaValue !== undefined && areaValue !== null ? areaValue.toLocaleString() : '0'} ${areaUnit || 'km²'}`;

  return (
    <AreaContainer>
      <AreaHeader>
        <strong>Area:</strong>
        <AreaValue>{formattedArea}</AreaValue>
      </AreaHeader>

      <AreaInfoSection>
        <InfoParagraph>
          <InfoIcon>ℹ️</InfoIcon> Area is calculated using Turf.js, the industry standard for geospatial calculations.
        </InfoParagraph>
        <InfoParagraph>
          <InfoIcon>💡</InfoIcon> This provides high-precision measurements using geodesic calculations that account for Earth's ellipsoidal shape.
        </InfoParagraph>
      </AreaInfoSection>
    </AreaContainer>
  );
};

export default AreaDisplay;
