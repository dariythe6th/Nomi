import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { MapPage } from '../pages/MapPage';
import { FriendsPage } from '../pages/FriendsPage';
import { ChatsPage } from '../pages/ChatsPage';
import { GamePage } from '../pages/GamePage';
import { ProfilePage } from '../pages/ProfilePage';
import { LoginPage } from '../pages/LoginPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <Navigate to="/map" replace /> },
      { path: 'map', element: <MapPage /> },
      { path: 'friends', element: <FriendsPage /> },
      { path: 'chats', element: <ChatsPage /> },
      { path: 'game', element: <GamePage /> },
      { path: 'profile', element: <ProfilePage /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/map" replace />,
  },
]);