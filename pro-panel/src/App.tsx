import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AuthProvider } from './contexts/AuthContext';
import { HeaderProvider } from './components/PageHeader';

export default function App() {
  return (
    <AuthProvider>
      <HeaderProvider>
        <RouterProvider router={router} />
      </HeaderProvider>
    </AuthProvider>
  );
}
