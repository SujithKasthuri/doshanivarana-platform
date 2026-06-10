import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useLanguage } from '../src/old_app/context/LanguageContext';
import { useTheme } from '../src/old_app/context/ThemeContext';

const deities = [
  { id: 'ganesha', emoji: '🐘' },
  { id: 'lakshmi', emoji: '💰' },
  { id: 'shiva', emoji: '🔱' },
  { id: 'vishnu', emoji: '🦅' },
  { id: 'durga', emoji: '🦁' },
  { id: 'saraswati', emoji: '📿' },
  { id: 'hanuman', emoji: '🐵' },
  { id: 'murugan', emoji: '🦚' },
];

export default function ProfileSetup() {
  const [selected, setSelected] = useState<string[]>(['lakshmi', 'shiva']);
  const router = useRouter();
  const { t } = useLanguage();
  const { theme } = useTheme();

  const toggleDeity = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const handleContinue = () => {
    router.replace('/(tabs)');
  };

  const primaryForeground = theme === 'dark' ? '#1A0A00' : '#F5F5F0';

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 32 }}>
      {/* Progress Indicator */}
      <View className="flex-row items-center justify-center gap-2 mb-8">
        <View className="w-3 h-3 rounded-full bg-primary" />
        <View className="w-3 h-3 rounded-full bg-muted-foreground/30" />
      </View>

      {/* Heading */}
      <Text
        className="text-2xl font-bold mb-3 text-foreground"
        style={{ fontFamily: 'System' }}
      >
        {t('setup.title')}
      </Text>

      {/* Subtitle */}
      <Text
        className="text-sm mb-8"
        style={{ fontFamily: 'System', color: theme === 'dark' ? '#A8A29E' : '#78716C' }}
      >
        {t('setup.subtitle')}
      </Text>

      {/* Deity Grid */}
      <View className="flex-row flex-wrap justify-between mb-8">
        {deities.map((deity) => {
          const isSelected = selected.includes(deity.id);
          return (
            <Pressable
              key={deity.id}
              onPress={() => toggleDeity(deity.id)}
              className={`relative aspect-square w-[48%] rounded-xl p-6 mb-4 flex-col items-center justify-center ${
                isSelected
                  ? 'bg-card border-2 border-primary'
                  : 'bg-card border border-border'
              }`}
            >
              {/* Checkmark */}
              {isSelected && (
                <View className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Check size={16} color={primaryForeground} />
                </View>
              )}

              {/* Deity Illustration */}
              <Text className="text-5xl mb-3">{deity.emoji}</Text>

              {/* Deity Name */}
              <Text
                className="text-sm font-medium text-foreground"
                style={{ fontFamily: 'System' }}
              >
                {t('deity.' + deity.id)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* CTAs */}
      <View className="gap-y-4 pb-8">
        <Pressable
          onPress={handleContinue}
          disabled={selected.length === 0}
          className={`w-full py-4 rounded-xl items-center justify-center ${
            selected.length === 0
              ? 'bg-muted'
              : 'bg-primary active:bg-[#E05C10]'
          }`}
        >
          <Text
            className={`font-medium text-base ${
              selected.length === 0 ? '' : 'text-primary-foreground'
            }`}
            style={{ fontFamily: 'System', color: selected.length === 0 ? (theme === 'dark' ? '#A8A29E' : '#78716C') : undefined }}
          >
            {t('common.continue')}
          </Text>
        </Pressable>

        <Pressable
          onPress={handleContinue}
          className="w-full py-2 mt-2 items-center justify-center"
        >
          <Text
            className="text-sm"
            style={{ fontFamily: 'System', color: theme === 'dark' ? '#A8A29E' : '#78716C' }}
          >
            {t('setup.skip')}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
