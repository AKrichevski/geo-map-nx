import React, { useState, useEffect } from "react";
import { FiPlus } from "react-icons/fi";
import { FaTrash } from "react-icons/fa";
import { useLayers } from '../../../hooks';
import { Layer } from 'mapbox-gl';
import {
  AddLayerButton, DeleteLayerButton, LayerSelect,
  LayerSelectorActions,
  LayerSelectorContainer,
  LayerSelectorHeader
} from '../../styledComponents/Sidebar/LayerSelectorStyles';


export interface LayerSelectorProps {
  setShowAddLayerModal: (show: boolean) => void;
}

export interface LayerSelectorState {
  layers: Layer[];
  selectedLayerId: number | null;
  setSelectedLayerId: (id: number | null) => void;
  deleteLayer: (layerId: number) => Promise<void>;
  loadLayers: () => Promise<void>;
}

export const LayerSelector: React.FC<LayerSelectorProps> = ({
                                                              setShowAddLayerModal
                                                            }) => {
  const {
    layers,
    selectedLayerId,
    setSelectedLayerId,
    deleteLayer,
    loadLayers,
  } = useLayers();

  const [isDeleting, setIsDeleting] = useState(false);
  const [layersLoaded, setLayersLoaded] = useState(false);

  useEffect(() => {
    const loadAllLayers = async () => {
      if (!layersLoaded) {
        try {
          await loadLayers();
          setLayersLoaded(true);
        } catch (error) {
          console.error("Error loading layers:", error);
        }
      }
    };

    loadAllLayers();
  }, [loadLayers, layersLoaded, layers]);

  const handleDeleteLayer = async (layerId: number) => {
    if (!window.confirm('Are you sure you want to delete this layer? All polygons in this layer will also be deleted.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteLayer(layerId);
    } catch (error) {
      console.error('Error deleting layer:', error);
      alert('An error occurred while deleting the layer.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <LayerSelectorContainer>
      <LayerSelectorHeader>
        Layers ({layers?.length || 0})
      </LayerSelectorHeader>

      <LayerSelectorActions>
        <AddLayerButton onClick={() => setShowAddLayerModal(true)}>
          <FiPlus /> Add Layer
        </AddLayerButton>

        <LayerSelect
          value={selectedLayerId ?? ""}
          onChange={(e) => {
            const value = e.target.value;
            setSelectedLayerId(value ? parseInt(value) : null);
          }}
        >
          <option value="">-- Select Layer --</option>
          {layers && layers.length > 0 ? (
            layers.map((layer) => (
              <option key={layer.id} value={layer.id}>
                {layer.name || `Layer ${layer.id}`}
              </option>
            ))
          ) : (
            <option disabled>No layers available</option>
          )}
        </LayerSelect>

        <DeleteLayerButton
          onClick={() => selectedLayerId && handleDeleteLayer(selectedLayerId)}
          disabled={!selectedLayerId || isDeleting}
          $isDisabled={!selectedLayerId || isDeleting}
        >
          {isDeleting ? "..." : <FaTrash />}
        </DeleteLayerButton>
      </LayerSelectorActions>
    </LayerSelectorContainer>
  );
};

export default LayerSelector;
