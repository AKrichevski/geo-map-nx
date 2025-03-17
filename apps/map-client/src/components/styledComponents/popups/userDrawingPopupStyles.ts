import styled from 'styled-components';
import colors from '../../../consts/colors';

export const PopupHeader = styled.div`
    padding: 10px;
    background: #eee;
    cursor: move;
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

export const HeaderTitle = styled.h3`
    margin: 0;
    flex: 1;
`;

export const CloseButton = styled.button`
    background: ${colors.dangerRed};
    color: ${colors.white};
    border: none;
    border-radius: 4px;
    padding: 5px 10px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
`;

export const MapContainer = styled.div`
    position: relative;
    width: 100%;
    height: calc(100% - 44px);
`;

export const MapCanvas = styled.canvas`
    position: absolute;
    inset: 0;
    pointer-events: none;
    width: 100%;
    height: 100%;
`;

export const NoDataOverlay = styled.div`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: ${colors.semiTransparentBlack};
    color: ${colors.white};
    padding: 15px;
    border-radius: 5px;
    text-align: center;
`;

export const DrawingInfoOverlay = styled.div`
    position: absolute;
    bottom: 10px;
    left: 10px;
    background: ${colors.semiTransparentBlack};
    color: ${colors.white};
    padding: 8px;
    border-radius: 4px;
    font-size: 12px;
`;
