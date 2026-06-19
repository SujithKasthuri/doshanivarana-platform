import { BookingsService } from './bookings';
import { DeliveriesService } from './deliveries';
import { LiveStreamsService } from './liveStreams';
import { RecordingsService } from './recordings';
import { NotificationsService } from './notifications';
import { PoojasService } from './poojas';

export const DashboardService = {
  async getDashboardData(userId: string) {
    const [
      upcomingBookings,
      deliveries,
      liveStreams,
      recordings,
      notifications,
      recommendedPoojas
    ] = await Promise.all([
      BookingsService.getUpcomingBookings(userId),
      DeliveriesService.getUserDeliveries(userId),
      LiveStreamsService.getUserLiveStreams(userId),
      RecordingsService.getUserRecordings(userId),
      NotificationsService.getNotifications(userId),
      PoojasService.getPoojas()
    ]);

    const activeDeliveries = deliveries.filter((d: any) => d.status !== 'DELIVERED');
    const unreadNotifications = notifications.filter((n: any) => !n.isRead);

    return {
      upcomingBookings,
      activeDeliveries,
      liveStreams,
      recentRecordings: recordings.slice(0, 5),
      unreadNotifications,
      recommendedPoojas: recommendedPoojas.slice(0, 5) // Mock logic for recommendations
    };
  }
};
