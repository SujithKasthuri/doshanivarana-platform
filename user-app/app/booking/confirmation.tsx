import { View, Text, Pressable } from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';
import { Bell, Share2 } from 'lucide-react-native';
import { useLanguage } from '../../src/old_app/context/LanguageContext';

export default function BookingConfirmation() {
  const { bookingId } = useLocalSearchParams();
  const { t } = useLanguage();
  const displayId = bookingId || 'BKG-20260415-00001';

  return (
    <View className="flex-1 bg-[#1A0A00] px-6 py-12 flex-col items-center justify-center">
      {/* Diya Animation Placeholder */}
      <View className="mb-8 relative items-center justify-center">
        <Text className="text-8xl">🪔</Text>
        <View
          className="absolute inset-0 opacity-30 rounded-full"
          style={{
            backgroundColor: '#F97316',
            transform: [{ scale: 1.5 }],
            zIndex: -1
          }}
        />
      </View>

      {/* Headline */}
      <Text
        className="text-3xl font-bold text-center mb-4 text-[#F5F5F0]"
        style={{ fontFamily: 'System' }}
      >
        {t('bookingConfirmation.title')}
      </Text>

      {/* Subtitle */}
      <Text
        className="text-center text-sm mb-8 max-w-md text-[#78716C]"
        style={{ fontFamily: 'System' }}
      >
        {t('bookingConfirmation.subtitle')}
      </Text>

      {/* Booking ID Card */}
      <View
        className="w-full max-w-md rounded-xl p-5 mb-6"
        style={{ backgroundColor: '#2D0A2E', borderColor: '#F97316', borderWidth: 1 }}
      >
        {/* Top Row */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-xs font-bold text-primary" style={{ fontFamily: 'System' }}>
            DOSHANIVARANA
          </Text>
          <Text className="text-xs text-[#78716C]" style={{ fontFamily: 'System' }}>
            {t('bookingConfirmation.bookingConfirmed')}
          </Text>
        </View>

        {/* Divider */}
        <View className="border-t border-dashed border-primary mb-4" />

        {/* Pooja Details */}
        <Text
          className="text-xl font-bold mb-2 text-[#F5F5F0]"
          style={{ fontFamily: 'System' }}
        >
          {t('poojaDb.1.title')}
        </Text>
        <Text className="text-xs mb-1 text-[#78716C]" style={{ fontFamily: 'System' }}>
          {t('templeDb.rameshwaram.name')}, {t('templeDb.rameshwaram.location')}
        </Text>
        <Text className="text-xs mb-4 text-[#78716C]" style={{ fontFamily: 'System' }}>
          15 {t('calendar.april')} 2026 — 9:00 AM
        </Text>

        {/* Divider */}
        <View className="border-t border-dashed border-border mb-4" />

        {/* Booking ID */}
        <View>
          <Text className="text-xs mb-1 text-[#78716C]" style={{ fontFamily: 'System' }}>
            {t('bookingConfirmation.bookingId')}
          </Text>
          <Text
            className="text-sm text-primary font-bold"
            style={{ fontFamily: 'System' }}
          >
            {displayId}
          </Text>
        </View>
      </View>

      {/* CTAs */}
      <View className="w-full max-w-md space-y-3 mb-8">
        <Pressable className="w-full py-3 rounded-xl bg-primary items-center justify-center flex-row gap-2 active:bg-[#E05C10] mb-3">
          <Bell size={20} color="#1A0A00" />
          <Text className="text-primary-foreground font-medium" style={{ fontFamily: 'System' }}>
            {t('bookingConfirmation.setReminder')}
          </Text>
        </Pressable>

        <Pressable className="w-full py-3 rounded-xl border-2 border-primary bg-transparent items-center justify-center flex-row gap-2 active:bg-primary/5">
          <Share2 size={20} color="#F97316" />
          <Text className="text-primary font-medium" style={{ fontFamily: 'System' }}>
            {t('bookingConfirmation.shareBlessing')}
          </Text>
        </Pressable>
      </View>

      {/* Journey Preview */}
      <View className="w-full max-w-md mb-6">
        <View className="flex-row items-center justify-center gap-3">
          <View className="flex-row items-center gap-2">
            <View className="w-6 h-6 rounded-full bg-primary items-center justify-center">
              <Text className="text-xs text-primary-foreground font-bold">✓</Text>
            </View>
            <Text className="text-xs text-[#78716C]" style={{ fontFamily: 'System' }}>
              {t('journey.sevaOffered')}
            </Text>
          </View>
          <View className="w-8 h-0.5 bg-border" />
          <View className="flex-row items-center gap-2">
            <View className="w-6 h-6 rounded-full border border-border" />
            <Text className="text-xs text-muted-foreground" style={{ fontFamily: 'System' }}>
              {t('journey.pujariAssigned')}
            </Text>
          </View>
          <View className="w-8 h-0.5 bg-border" />
          <View className="flex-row items-center gap-2">
            <View className="w-6 h-6 rounded-full border border-border" />
            <Text className="text-xs text-muted-foreground" style={{ fontFamily: 'System' }}>
              {t('journey.poojaScheduled')}
            </Text>
          </View>
        </View>
      </View>

      {/* View Bookings Link */}
      <Link href="/(tabs)/bookings" asChild>
        <Pressable className="p-2">
          <Text className="text-primary text-sm font-medium" style={{ fontFamily: 'System' }}>
            {t('bookingConfirmation.viewJourney')}
          </Text>
        </Pressable>
      </Link>
    </View>
  );
}
