import React, { useState, useEffect } from 'react';
import { FiUser, FiMapPin, FiEye } from 'react-icons/fi';
import { useSocket } from '../../../hooks';
import { useMapContext } from '../../../contexts/MapContext';
import { ActiveUser } from '@geo-map-app/types';
import { UserDrawingPopup } from './UserDrawingPopup';
import colors from '../../../consts/colors';
import {
  ActionButton,
  ActionButtonsContainer,
  ActiveUsersContainer,
  ActiveUsersListContainer,
  NoUsersMessage, UserActivityStatus, UserDetailsContainer, UserInfoContainer,
  UserItemContainer, Username
} from '../../styledComponents/activeUsersStyles';

interface ActiveUsersListProps {
  className?: string;
  setEditPolygonId: (id: number | null) => void;
  setShowCreatePolygonModal: (show: boolean) => void;
  setSelectedUserId: (userId: string | null) => void;
}

const ActiveUsersList: React.FC<ActiveUsersListProps> = ({
                                                           className,
                                                           setEditPolygonId,
                                                           setShowCreatePolygonModal,
                                                           setSelectedUserId
                                                         }) => {
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [viewingUser, setViewingUser] = useState<ActiveUser | null>(null);
  const { isConnected, subscribe } = useSocket();
  const { jumpToLocation } = useMapContext();

  useEffect(() => {
    if (!isConnected) return;

    const usersUnsubscribe = subscribe<ActiveUser[]>('users-updated', (users) => {
      setActiveUsers(users || []);
    });

    const activityUnsubscribe = subscribe<{
      userId: string;
      activity: {
        type: 'drawing' | 'editing';
        polygonId?: number;
        coordinates?: [number, number];
      };
    }>('user-activity', (data) => {
      if (!data) return;

      setActiveUsers((prevUsers) => {
        return prevUsers.map((user) => {
          if (user.id === data.userId) {
            return {
              ...user,
              activity: data.activity,
            };
          }
          return user;
        });
      });

      if (viewingUser && viewingUser.id === data.userId) {
        setViewingUser(prev => prev ? {...prev, activity: data.activity} : null);
      }
    });

    return () => {
      usersUnsubscribe();
      activityUnsubscribe();
    };
  }, [isConnected, subscribe, viewingUser]);

  useEffect(() => {
    setSelectedUserId(viewingUser?.id || null);

    return () => {
      setSelectedUserId(null);
    };
  }, [viewingUser, setSelectedUserId]);

  const handleJumpAndOpenModal = (user: ActiveUser, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!user.activity?.coordinates) return;

    jumpToLocation(user.activity.coordinates, 13);

    setTimeout(() => {
      if (user.activity?.type === 'editing' && user.activity.polygonId) {
        setEditPolygonId(user.activity.polygonId);
      } else if (user.activity?.type === 'drawing') {
        setShowCreatePolygonModal(true);
      }
    }, 200);
  };

  const handleViewDrawing = (user: ActiveUser, e: React.MouseEvent) => {
    e.stopPropagation();
    setViewingUser(user);
  };

  return (
    <ActiveUsersContainer className={className}>
      <h4>Active Users ({activeUsers.length})</h4>
      <ActiveUsersListContainer>
        {activeUsers.length === 0 ? (
          <NoUsersMessage>
            No other users are currently online.
          </NoUsersMessage>
        ) : (
          activeUsers.map((user) => (
            <UserItemContainer key={user.id} $hasActivity={!!user.activity}>
              <UserInfoContainer>
                <FiUser
                  size={16}
                  style={{
                    marginRight: 8,
                    color: user.isOnline ? colors.successGreen : colors.disabledGray,
                  }}
                />
                <UserDetailsContainer>
                  <Username>{user.username}</Username>
                  {user.activity && (
                    <UserActivityStatus>
                      {user.activity.type === 'drawing'
                        ? 'Drawing new polygon'
                        : `Editing polygon #${user.activity.polygonId}`}
                    </UserActivityStatus>
                  )}
                </UserDetailsContainer>
              </UserInfoContainer>
              <ActionButtonsContainer>
                {user.activity && (
                  <ActionButton
                    onClick={(e) => handleViewDrawing(user, e)}
                    title={`View ${user.username}'s drawing`}
                    $isActive={user.id === viewingUser?.id}
                  >
                    <FiEye />
                  </ActionButton>
                )}
              </ActionButtonsContainer>
            </UserItemContainer>
          ))
        )}
      </ActiveUsersListContainer>
      {viewingUser && (
        <UserDrawingPopup
          user={viewingUser}
          isOpen={true}
          onClose={() => setViewingUser(null)}
        />
      )}
    </ActiveUsersContainer>
  );
};

export default ActiveUsersList;
