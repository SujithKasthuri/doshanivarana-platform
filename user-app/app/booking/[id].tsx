import { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Calendar, Clock, User, Star, ChevronRight, X, MapPin } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/old_app/context/ThemeContext';
import { useLanguage } from '../../src/old_app/context/LanguageContext';

interface BookingFormData {
  selectedDate: string;
  selectedTime: string;
  devoteeNames: string;
  gothram: string;
  nakshatra: string;
  specialRequests: string;
}

export default function BookingFlow() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<BookingFormData>({
    selectedDate: '',
    selectedTime: '',
    devoteeNames: '',
    gothram: 'Bharadwaja',
    nakshatra: 'Shravana',
    specialRequests: '',
  });
  const [showNakshatraModal, setShowNakshatraModal] = useState(false);

  // Map search param id to translated pooja info
  const poojaId = id || '1';
  const poojaData = {
    title: t('poojaDb.' + poojaId + '.title'),
    temple: t('templeDb.rameshwaram.name'),
    deity: t('deity.shiva'),
    price: '₹1,200',
  };

  const availableDates = [
    { date: '2026-03-20', label: t('common.tomorrow'), day: t('home.thu') },
    { date: '2026-03-21', label: 'Mar 21', day: t('home.fri') },
    { date: '2026-03-22', label: 'Mar 22', day: t('home.sat') },
    { date: '2026-03-23', label: 'Mar 23', day: t('home.sun') },
    { date: '2026-03-24', label: 'Mar 24', day: t('home.mon') },
  ];

  const availableTimes = [
    '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM',
    '11:00 AM', '4:00 PM', '5:00 PM', '6:00 PM'
  ];

  const nakshatras = [
    'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya',
    'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati',
    'Vishakha', 'Anuradha', 'Jyeshtha', 'Moola', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana',
    'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
  ];

  const handleContinue = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      const bookingId = `DS${Date.now()}`;
      router.push(`/booking/confirmation?bookingId=${bookingId}` as any);
    }
  };

  const canContinue = () => {
    switch (step) {
      case 1:
        return formData.selectedDate !== '' && formData.selectedTime !== '';
      case 2:
        return formData.devoteeNames !== '' && formData.gothram !== '';
      case 3:
        return true;
      default:
        return false;
    }
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View 
        className="pb-4 bg-background/95 border-b border-border z-40 px-6"
        style={{ paddingTop: insets.top > 0 ? insets.top + 8 : 16 }}
      >
        <View className="flex-row items-center gap-4 mb-4">
          <Pressable
            onPress={() => step > 1 ? setStep(step - 1) : router.back()}
            className="w-10 h-10 rounded-xl items-center justify-center active:bg-muted/50"
          >
            <ArrowLeft size={20} color={theme === 'dark' ? '#F5F5F0' : '#1C1917'} />
          </Pressable>
          <View className="flex-1">
            <Text className="text-xl font-bold text-foreground" style={{ fontFamily: 'System' }}>
              {step === 1 && t('booking.selectDateTime')}
              {step === 2 && t('booking.yourDetails')}
              {step === 3 && t('booking.reviewConfirm')}
            </Text>
            <Text className="text-xs text-muted-foreground" style={{ fontFamily: 'System' }}>
              {t('booking.stepInfo').replace('{step}', step.toString())}
            </Text>
          </View>
        </View>
        
        {/* Progress Bar */}
        <View className="h-1 bg-muted rounded-full overflow-hidden">
          <View 
            className="h-full bg-primary"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 132 }}>
        {/* Pooja Summary Card */}
        <View className="bg-card border border-border rounded-2xl p-4 mb-6 flex-row gap-3">
          <View className="w-16 h-16 rounded-xl bg-primary/10 items-center justify-center">
            <Text className="text-2xl">🕉️</Text>
          </View>
          <View className="flex-1">
            <Text className="font-semibold text-foreground mb-1" style={{ fontFamily: 'System' }}>
              {poojaData.title}
            </Text>
            <Text className="text-sm text-muted-foreground mb-2" style={{ fontFamily: 'System' }}>
              {poojaData.temple} • {poojaData.deity}
            </Text>
            <Text className="text-primary font-semibold" style={{ fontFamily: 'System' }}>
              {poojaData.price}
            </Text>
          </View>
        </View>

        {/* Step Content */}
        {step === 1 && (
          <View className="space-y-6">
            {/* Date Selection */}
            <View>
              <Text className="text-sm font-semibold text-foreground mb-3" style={{ fontFamily: 'System' }}>
                {t('booking.selectDate')}
              </Text>
              <View className="flex-row flex-wrap justify-between">
                {availableDates.map((dateOption) => (
                  <Pressable
                    key={dateOption.date}
                    onPress={() => setFormData({ ...formData, selectedDate: dateOption.date })}
                    className={`w-[48%] p-4 rounded-xl border-2 mb-3 ${
                      formData.selectedDate === dateOption.date
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                    }`}
                  >
                    <View className="flex-row items-center gap-2 mb-1">
                      <Calendar size={16} color="#F97316" />
                      <Text className="font-semibold text-sm text-foreground" style={{ fontFamily: 'System' }}>
                        {dateOption.label}
                      </Text>
                    </View>
                    <Text className="text-xs text-muted-foreground" style={{ fontFamily: 'System' }}>
                      {dateOption.day}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Time Selection */}
            {formData.selectedDate !== '' && (
              <View className="mt-4">
                <Text className="text-sm font-semibold text-foreground mb-3" style={{ fontFamily: 'System' }}>
                  {t('booking.selectTime')}
                </Text>
                <View className="flex-row flex-wrap justify-between gap-y-2">
                  {availableTimes.map((time) => (
                    <Pressable
                      key={time}
                      onPress={() => setFormData({ ...formData, selectedTime: time })}
                      className={`w-[31%] p-3 rounded-xl border-2 items-center justify-center ${
                        formData.selectedTime === time
                          ? 'border-primary bg-primary/5'
                          : 'border-border'
                      }`}
                    >
                      <Text
                        className={`text-sm ${
                          formData.selectedTime === time
                            ? 'text-primary font-semibold'
                            : 'text-foreground'
                        }`}
                        style={{ fontFamily: 'System' }}
                      >
                        {time}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {step === 2 && (
          <View className="space-y-6">
            <View>
              <Text className="text-sm font-semibold text-foreground mb-1" style={{ fontFamily: 'System' }}>
                {t('booking.devoteeNames')}
              </Text>
              <Text className="text-xs text-muted-foreground mb-3" style={{ fontFamily: 'System' }}>
                {t('booking.devoteeNamesDesc')}
              </Text>
              <TextInput
                value={formData.devoteeNames}
                onChangeText={(text) => setFormData({ ...formData, devoteeNames: text })}
                placeholder={t('booking.devoteeNamesPlaceholder')}
                placeholderTextColor="hsl(var(--muted-foreground))"
                className="w-full px-4 py-3 bg-card border border-border rounded-xl text-foreground"
                style={{ fontFamily: 'System' }}
              />
            </View>

            <View className="mt-4">
              <Text className="text-sm font-semibold text-foreground mb-2" style={{ fontFamily: 'System' }}>
                {t('booking.gothram')}
              </Text>
              <TextInput
                value={formData.gothram}
                onChangeText={(text) => setFormData({ ...formData, gothram: text })}
                placeholder={t('booking.gothramPlaceholder')}
                placeholderTextColor="hsl(var(--muted-foreground))"
                className="w-full px-4 py-3 bg-card border border-border rounded-xl text-foreground"
                style={{ fontFamily: 'System' }}
              />
            </View>

            <View className="mt-4">
              <Text className="text-sm font-semibold text-foreground mb-2" style={{ fontFamily: 'System' }}>
                {t('booking.nakshatra')} ({t('common.optional')})
              </Text>
              <Pressable
                onPress={() => setShowNakshatraModal(true)}
                className="w-full px-4 py-3 bg-card border border-border rounded-xl flex-row items-center justify-between"
              >
                <Text className={formData.nakshatra ? 'text-foreground' : 'text-muted-foreground'} style={{ fontFamily: 'System' }}>
                  {formData.nakshatra || t('booking.nakshatraPlaceholder')}
                </Text>
                <ChevronRight size={16} color="#78716C" />
              </Pressable>
            </View>

            <View className="mt-4">
              <Text className="text-sm font-semibold text-foreground mb-2" style={{ fontFamily: 'System' }}>
                {t('booking.specialRequests')} ({t('common.optional')})
              </Text>
              <TextInput
                value={formData.specialRequests}
                onChangeText={(text) => setFormData({ ...formData, specialRequests: text })}
                placeholder={t('booking.specialRequestsPlaceholder')}
                placeholderTextColor="hsl(var(--muted-foreground))"
                multiline={true}
                numberOfLines={4}
                textAlignVertical="top"
                className="w-full px-4 py-3 bg-card border border-border rounded-xl text-foreground min-h-[100px]"
                style={{ fontFamily: 'System' }}
              />
            </View>
          </View>
        )}

        {step === 3 && (
          <View className="space-y-6">
            <View className="bg-card border border-border rounded-2xl overflow-hidden">
              <View className="p-4 border-b border-border">
                <Text className="font-semibold text-foreground" style={{ fontFamily: 'System' }}>
                  {t('booking.poojaDetails')}
                </Text>
              </View>
              <ReviewItem label={t('booking.selectDateTime')} value={`${availableDates.find(d => d.date === formData.selectedDate)?.label}, ${formData.selectedTime}`} />
              <ReviewItem label={t('booking.devoteeNames')} value={formData.devoteeNames} />
              <ReviewItem label={t('booking.gothram')} value={formData.gothram} />
              {formData.nakshatra !== '' && <ReviewItem label={t('booking.nakshatra')} value={formData.nakshatra} />}
              {formData.specialRequests !== '' && <ReviewItem label={t('booking.specialRequests')} value={formData.specialRequests} />}
            </View>

            <View className="bg-card border border-border rounded-2xl p-4 mt-6">
              <Text className="font-semibold text-foreground mb-3" style={{ fontFamily: 'System' }}>
                {t('booking.paymentSummary')}
              </Text>
              <View className="space-y-2">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-sm text-muted-foreground" style={{ fontFamily: 'System' }}>{t('booking.poojaAmount')}</Text>
                  <Text className="text-sm text-foreground" style={{ fontFamily: 'System' }}>₹1,200</Text>
                </View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-sm text-muted-foreground" style={{ fontFamily: 'System' }}>{t('booking.prasadDelivery')}</Text>
                  <Text className="text-sm text-primary font-semibold" style={{ fontFamily: 'System' }}>{t('common.free')}</Text>
                </View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-sm text-muted-foreground" style={{ fontFamily: 'System' }}>{t('booking.liveStream')}</Text>
                  <Text className="text-sm text-primary font-semibold" style={{ fontFamily: 'System' }}>{t('common.included')}</Text>
                </View>
                <View className="border-t border-border pt-3 mt-3">
                  <View className="flex-row justify-between">
                    <Text className="font-semibold text-lg text-foreground" style={{ fontFamily: 'System' }}>{t('booking.totalAmount')}</Text>
                    <Text className="text-primary font-semibold text-lg" style={{ fontFamily: 'System' }}>₹1,200</Text>
                  </View>
                </View>
              </View>
            </View>

            <View className="bg-primary/10 border border-primary/30 rounded-xl p-4 mt-6">
              <Text className="text-sm text-primary" style={{ fontFamily: 'System' }}>
                <Text className="font-bold">{t('booking.note')}:</Text> {t('booking.confirmationNote')}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Fixed Bottom CTA */}
      <View className="absolute bottom-0 left-0 right-0 bg-background border-t border-border p-4">
        <Pressable
          onPress={handleContinue}
          disabled={!canContinue()}
          className={`w-full py-4 rounded-xl items-center justify-center ${
            canContinue()
              ? 'bg-primary active:bg-[#E05C10]'
              : 'bg-muted'
          }`}
        >
          <Text
            className={`font-semibold text-base ${
              canContinue() ? 'text-[#1A0A00]' : 'text-muted-foreground'
            }`}
            style={{ fontFamily: 'System' }}
          >
            {step === 3 ? t('booking.proceedToPayment') : t('common.continue')}
          </Text>
        </Pressable>
      </View>

      {/* Nakshatra Selection Modal */}
      <Modal visible={showNakshatraModal} animationType="slide" transparent={true}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-background rounded-t-3xl h-[70%]">
            <View className="flex-row justify-between items-center p-4 border-b border-border">
              <Text className="font-semibold text-lg text-foreground" style={{ fontFamily: 'System' }}>{t('booking.nakshatraPlaceholder')}</Text>
              <Pressable onPress={() => setShowNakshatraModal(false)} className="p-2">
                <X size={24} color={theme === 'dark' ? '#F5F5F0' : '#1C1917'} />
              </Pressable>
            </View>
            <ScrollView>
              {nakshatras.map((nakshatra) => (
                <Pressable
                  key={nakshatra}
                  onPress={() => {
                    setFormData({ ...formData, nakshatra });
                    setShowNakshatraModal(false);
                  }}
                  className="p-4 border-b border-border active:bg-muted/50"
                >
                  <Text className="text-foreground" style={{ fontFamily: 'System' }}>{nakshatra}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <View className="p-4 border-b border-border">
      <Text className="text-xs text-muted-foreground mb-1" style={{ fontFamily: 'System' }}>
        {label}
      </Text>
      <Text className="font-medium text-foreground" style={{ fontFamily: 'System' }}>
        {value}
      </Text>
    </View>
  );
}
