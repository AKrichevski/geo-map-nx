import React, { useState } from "react";
import SidebarToggle from "./SidebarToggle";
import LayerSelector from "./LayerSelector";
import PolygonList from "./PolygonList";
import ActiveUsersList from "../../features/users/ActiveUsersList";

import {
  SidebarWrapper,
  SidebarContainer,
  SidebarSeparator
} from '../../styledComponents/Sidebar/SidebarStyles';

export interface SidebarProps {
  setEditPolygonId: (id: number | null) => void;
  setShowCreatePolygonModal: (show: boolean) => void;
  setShowAddLayerModal: (show: boolean) => void;
  setSelectedUserId: (userId: string | null) => void;
}


export const Sidebar: React.FC<SidebarProps> = ({
                                                  setEditPolygonId,
                                                  setShowCreatePolygonModal,
                                                  setShowAddLayerModal,
                                                  setSelectedUserId
                                                }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <SidebarWrapper>
      <SidebarToggle isOpen={isOpen} setIsOpen={setIsOpen} />
      <SidebarContainer $isOpen={isOpen}>
        <ActiveUsersList
          setEditPolygonId={setEditPolygonId}
          setShowCreatePolygonModal={setShowCreatePolygonModal}
          setSelectedUserId={setSelectedUserId}
        />

        <SidebarSeparator />

        <LayerSelector
          setShowAddLayerModal={setShowAddLayerModal}
        />

        <SidebarSeparator />

        <PolygonList
          setEditPolygonId={setEditPolygonId}
          setShowCreatePolygonModal={setShowCreatePolygonModal}
        />

        <SidebarSeparator />
      </SidebarContainer>
    </SidebarWrapper>
  );
};

export default Sidebar;
