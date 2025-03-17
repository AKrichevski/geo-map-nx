import React from 'react';
import { ModalHeader } from '../../../styledComponents/addLayerModalStyles';
import {
  ModalHeaderActions,
  ModalHeaderButton,
  ModalHeaderInput
} from '../../../styledComponents/polygonEditor/polygonCreateEditModalStyles';

export interface PolygonHeaderProps {
  editPolygonId?: number | null;
  name: string;
  color: string;
  isSaving: boolean;
  onNameChange: (name: string) => void;
  onColorChange: (color: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export const PolygonModalHeader: React.FC<PolygonHeaderProps> = ({
                                                                   editPolygonId,
                                                                   name,
                                                                   color,
                                                                   isSaving,
                                                                   onNameChange,
                                                                   onColorChange,
                                                                   onSave,
                                                                   onClose
                                                                 }) => {
  return (
    <ModalHeader className="popup-header">
      <h3 style={{ margin: 0 }}>
        {editPolygonId ? "Edit Polygon" : "Create Polygon"}
      </h3>
      <ModalHeaderActions>
        <ModalHeaderInput
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Polygon name"
          disabled={isSaving}
        />
        <ModalHeaderInput
          type="color"
          value={color}
          onChange={(e) => onColorChange(e.target.value)}
          disabled={isSaving}
        />
        <ModalHeaderButton
          onClick={onSave}
          $isDisabled={isSaving}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save"}
        </ModalHeaderButton>
        <ModalHeaderButton
          onClick={onClose}
          $isDisabled={isSaving}
          disabled={isSaving}
        >
          Cancel
        </ModalHeaderButton>
      </ModalHeaderActions>
    </ModalHeader>
  );
};
