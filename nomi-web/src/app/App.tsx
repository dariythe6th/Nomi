import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from '../shared/theme/ThemeProvider';
import { LocationProvider } from '../features/location/LocationProvider';
import { router } from './router';

export function App() {
  return (
    <ThemeProvider>
      <LocationProvider>
        <RouterProvider router={router} />
      </LocationProvider>
    </ThemeProvider>
  );
}