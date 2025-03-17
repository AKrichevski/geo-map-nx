import React from 'react';
import {
  AreaInfo,
  ColorIndicator, CreatedInfo, LayerInfo,
  NameSpan,
  StyledTooltip,
  TooltipHeader
} from '../../styledComponents/toolTips/polygonTooltipStyles';

interface PolygonTooltipProps {
  polygonId: string;
  data: {
    name: string;
    color: string;
    areaValue: number;
    areaUnit: string;
    layerId?: number;
    createdAt?: string;
  };
}

export const PolygonTooltip: React.FC<PolygonTooltipProps> = ({ polygonId, data }) => {
  const formattedDate = data.createdAt
    ? new Date(data.createdAt).toLocaleDateString()
    : 'Unknown';

  return (
    <StyledTooltip
      id={`polygon-tooltip-${polygonId}`}
      place="top"
      delayShow={300}
    >
      <div>
        <TooltipHeader>
          <ColorIndicator $color={data.color} />
          <NameSpan>{data.name}</NameSpan>
        </TooltipHeader>
        <AreaInfo>
          <strong>Area:</strong> {data.areaValue.toLocaleString()} {data.areaUnit}
        </AreaInfo>
        {data.layerId && (
          <LayerInfo>
            <strong>Layer ID:</strong> {data.layerId}
          </LayerInfo>
        )}
        <CreatedInfo>
          <strong>Created:</strong> {formattedDate}
        </CreatedInfo>
      </div>
    </StyledTooltip>
  );
};

export default PolygonTooltip;
