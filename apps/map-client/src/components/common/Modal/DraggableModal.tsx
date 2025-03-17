import React from 'react';
import { Rnd } from 'react-rnd';
import colors from '../../../consts/colors';

interface DraggableModalProps {
    isOpen: boolean;
    children: React.ReactNode;
    isResizable?: boolean;
    defaultWidth?: string | number;
    defaultHeight?: string | number;
}

export const DraggableModal: React.FC<DraggableModalProps> = ({
                                                                  isOpen,
                                                                  children,
                                                                  isResizable = false,
                                                                  defaultWidth = '50%',
                                                                  defaultHeight = '50%'
                                                              }) => {
    if (!isOpen) return null;

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.3)',
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            <Rnd
                default={{
                    x: window.innerWidth * 0.25,
                    y: window.innerHeight * 0.25,
                    width: defaultWidth,
                    height: defaultHeight
                }}
                minWidth="30%"
                minHeight="30%"
                dragHandleClassName="popup-header"
                enableResizing={isResizable}
                bounds="parent"
                style={{
                    background: colors.white,
                    border: `1px solid ${colors.borderGray}`,
                    borderRadius: 6,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {children}
                </div>
            </Rnd>
        </div>
    );
};
