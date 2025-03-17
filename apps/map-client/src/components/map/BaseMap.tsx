import React from 'react';

interface BaseMapProps {
    mapContainerRef: React.RefObject<HTMLDivElement>;
    children?: React.ReactNode;
}

export const BaseMap: React.FC<BaseMapProps> = ({ mapContainerRef, children }) => {
    return (
        <div style={{
            position: "absolute",
            inset: 0,
            overflow: 'hidden'
        }}>
            <div
                ref={mapContainerRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: '#e3e3e3'
                }}
            />
            {children}
        </div>
    );
};
