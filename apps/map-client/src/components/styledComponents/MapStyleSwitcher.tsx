import React from 'react';
import styled from 'styled-components';
import { FaMap } from 'react-icons/fa';
import colors from '../../consts/colors';
import { MAP_STYLES } from '../../config/config';

const MapStyleContainer = styled.div`
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 5;
    border-radius: 4px;
    overflow: hidden;
    background: transparent;
`;

const ButtonContainer = styled.div`
    position: relative;
    width: 36px;
    height: 36px;
`;

const StyleToggleButton = styled.button`
    position: absolute;
    top: 0;
    left: 0;
    background: ${colors.semiTransparentBlack};
    color: ${colors.white};
    border: 2px solid ${colors.white};
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background-color 0.2s;
    border-radius: 4px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);

    &:hover {
        background: ${colors.hoverBlue};
    }
`;

const IconWrapper = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    pointer-events: none;
`;

const StyleOptions = styled.div<{ $visible: boolean }>`
    display: ${props => props.$visible ? 'block' : 'none'};
    background: ${colors.white};
    border-top: 1px solid ${colors.borderGray};
`;

const StyleOption = styled.button<{ $isActive: boolean }>`
    display: block;
    width: 100%;
    padding: 8px 12px;
    text-align: left;
    background: ${props => props.$isActive ? colors.lightGray : colors.white};
    border: none;
    border-bottom: 1px solid ${colors.borderGray};
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.2s;

    &:hover {
        background: ${colors.lightGray};
    }

    &:last-child {
        border-bottom: none;
    }
`;

interface MapStyleSwitcherProps {
  currentStyle: string;
  onStyleChange: (style: string) => void;
}

export const MapStyleSwitcher: React.FC<MapStyleSwitcherProps> = ({
                                                                    currentStyle,
                                                                    onStyleChange
                                                                  }) => {
  const [showOptions, setShowOptions] = React.useState(false);

  const toggleOptions = () => {
    setShowOptions(!showOptions);
  };

  const handleStyleSelect = (style: string) => {
    onStyleChange(style);
    setShowOptions(false);
  };

  const getStyleName = (styleUrl: string) => {
    const styleEntries = Object.entries(MAP_STYLES);
    const entry = styleEntries.find(([_, url]) => url === styleUrl);
    if (entry) {
      return entry[0].split('_').map(word =>
        word.charAt(0) + word.slice(1).toLowerCase()
      ).join(' ');
    }
    return 'Custom';
  };

  return (
    <MapStyleContainer>
      <ButtonContainer>
        <StyleToggleButton
          onClick={toggleOptions}
          title="Change Map Style"
        />
        <IconWrapper>
          <FaMap size={20} color="white" />
        </IconWrapper>
      </ButtonContainer>

      <StyleOptions $visible={showOptions}>
        {Object.entries(MAP_STYLES).map(([key, style]) => (
          <StyleOption
            key={key}
            $isActive={currentStyle === style}
            onClick={() => handleStyleSelect(style)}
          >
            {getStyleName(style)}
          </StyleOption>
        ))}
      </StyleOptions>
    </MapStyleContainer>
  );
};

export default MapStyleSwitcher;
