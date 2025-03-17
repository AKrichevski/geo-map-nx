import { useContext } from 'react';
import {LayersContext} from "../contexts/LayersContext.tsx";


export function useLayers() {
    const context = useContext(LayersContext);
    if (!context) {
        throw new Error('useLayers must be used within a LayersProvider');
    }

    return context;
}
