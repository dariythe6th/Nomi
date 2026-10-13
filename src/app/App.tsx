import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from '../shared/theme/ThemeProvider';
import { AuthProvider } from '../features/auth/AuthProvider';
import { LocationProvider } from '../features/location/LocationProvider';
import { BotsProvider } from '../features/simulation/BotsProvider';
import { router } from './router';

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LocationProvider>
          <BotsProvider>
            <RouterProvider router={router} />
          </BotsProvider>
        </LocationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}