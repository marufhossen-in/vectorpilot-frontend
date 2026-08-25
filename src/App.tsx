import { RouterProvider } from 'react-router-dom';

import { AppProviders } from '@/store/AppStores';
import { router } from '@/router';
import { ToastViewport } from '@/components/ui';

export default function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
      <ToastViewport />
    </AppProviders>
  );
}
