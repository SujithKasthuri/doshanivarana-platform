import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { useTheme } from '../src/old_app/context/ThemeContext';

export default function Index() {
  const router = useRouter();
  const { theme } = useTheme();

  useEffect(() => {
    // Redirection is deferred to the next tick after component mounts,
    // ensuring the Expo Router navigation context is fully initialized.
    const timer = setTimeout(() => {
      router.replace('/splash');
    }, 0);
    return () => clearTimeout(timer);
  }, [router]);

  return <View style={{ flex: 1, backgroundColor: theme === 'dark' ? '#1A0A00' : '#F5F5F0' }} />;
}


