import React, { useState } from "react";
import { FiCheck, FiX } from "react-icons/fi";
import { DraggableModal } from "../../common/Modal/DraggableModal";
import { useLayers } from '../../../hooks';
import {
  ButtonContainer,
  CancelButton, ErrorMessage, FormContainer, InputLabel, LayerInput,
  ModalHeader,
  ModalTitle,
  SaveButton
} from '../../styledComponents/addLayerModalStyles';

interface AddLayerModalProps {
  onClose: () => void;
}

export const AddLayerModal: React.FC<AddLayerModalProps> = ({
                                                              onClose,
                                                            }) => {
  const [layerName, setLayerName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { createLayer } = useLayers();

  const handleSave = async () => {
    if (!layerName.trim()) {
      setError("Please enter a layer name.");
      return;
    }

    setError(null);
    setIsCreating(true);

    try {
      await createLayer(layerName);
      setLayerName("");
      onClose();
    } catch (err) {
      setError("Failed to create layer. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <DraggableModal
      isResizable={false}
      defaultWidth="400px"
      defaultHeight="auto"
    >
      <div style={{padding: 20}}>
        <ModalHeader>
          <ModalTitle>Add Layer</ModalTitle>
          <ButtonContainer>
            <SaveButton
              onClick={handleSave}
              disabled={isCreating}
              $isCreating={isCreating}
              title="Save"
            >
              <FiCheck size={18}/>
              {isCreating ? 'Saving...' : 'Save'}
            </SaveButton>
            <CancelButton
              onClick={onClose}
              disabled={isCreating}
              $isCreating={isCreating}
              title="Cancel"
            >
              <FiX size={18}/>
              Cancel
            </CancelButton>
          </ButtonContainer>
        </ModalHeader>
        <FormContainer>
          <InputLabel>Layer Name:</InputLabel>
          <LayerInput
            type="text"
            value={layerName}
            onChange={(e) => setLayerName(e.target.value)}
            placeholder="Enter layer name..."
            disabled={isCreating}
            $hasError={!!error}
            $isCreating={isCreating}
          />

          {error && (
            <ErrorMessage>
              {error}
            </ErrorMessage>
          )}
        </FormContainer>
      </div>
    </DraggableModal>
  );
};
