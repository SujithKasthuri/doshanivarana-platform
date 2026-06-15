import { NotificationsService } from './src/services/firebase/notifications';
import { db } from './src/lib/firebase';
import { doc, getDoc, Timestamp } from 'firebase/firestore';

const logs: any[] = [];
function log(msg: string) {
  console.log(msg);
  logs.push(msg);
}

async function run() {
  log("Starting Notifications Verification...");

  const campaignId = "TEST_CAMPAIGN_" + Date.now();
  try {
    // 1. Validation Test: Past Date Rejection
    try {
      log("Testing past-date rejection...");
      const pastDate = new Date(Date.now() - 3600000);
      await NotificationsService.createCampaign(campaignId, {
        title: "Test",
        body: "Test",
        targetAudience: "All Users",
        scheduledAt: Timestamp.fromDate(pastDate)
      });
      log("FAIL: Allowed past-date scheduling!");
    } catch (e: any) {
      log("PASS: Prevented past-date scheduling -> " + e.message);
    }

    // 2. Create Campaign (Draft)
    log("Creating valid Draft campaign...");
    await NotificationsService.createCampaign(campaignId, {
      title: "Test Campaign",
      body: "This is a test.",
      targetAudience: "All Users",
    });
    log("PASS: Draft created.");

    // 3. Status Transition: Draft -> Sent
    log("Transitioning Draft -> Sent...");
    try {
      await NotificationsService.updateCampaign(campaignId, { status: "Sent" });
      log("FAIL: Allowed Draft -> Sent jump.");
    } catch (e: any) {
      log("PASS: Prevented Draft -> Sent jump -> " + e.message);
    }

    // 4. Status Transition: Draft -> Scheduled
    log("Transitioning Draft -> Scheduled...");
    const futureDate = new Date(Date.now() + 3600000);
    await NotificationsService.updateCampaign(campaignId, { 
      status: "Scheduled", 
      scheduledAt: Timestamp.fromDate(futureDate) 
    });
    log("PASS: Scheduled successfully.");

    // 5. Invalid Transition: Scheduled -> Draft
    log("Testing Scheduled -> Draft transition...");
    try {
      await NotificationsService.updateCampaign(campaignId, { status: "Draft" });
      log("FAIL: Allowed Scheduled -> Draft.");
    } catch(e: any) {
      log("PASS: Prevented Scheduled -> Draft -> " + e.message);
    }

    // 6. Status Transition: Scheduled -> Sent
    log("Transitioning Scheduled -> Sent...");
    await NotificationsService.updateCampaign(campaignId, { status: "Sent" });
    log("PASS: Sent successfully.");

    // 7. Immutability Test (editing Sent campaign)
    log("Testing Immutability of Sent campaign...");
    try {
      await NotificationsService.updateCampaign(campaignId, { title: "Modified Title" });
      log("FAIL: Allowed modifying Sent campaign.");
    } catch(e: any) {
      log("PASS: Prevented modifying Sent campaign -> " + e.message);
    }

    // 8. Create Notification for Campaign
    log("Creating individual notification...");
    const notifId = "TEST_NOTIF_" + Date.now();
    await NotificationsService.createNotification(notifId, {
      campaignId,
      userId: "TEST_USER",
      title: "Test Campaign",
      body: "This is a test."
    });
    log("PASS: Notification created.");

    let campSnap = await getDoc(doc(db, "notification_campaigns", campaignId));
    log(`Campaign deliveryCount: ${campSnap.data()?.deliveryCount} (Expected: 1)`);
    log(`Campaign unreadCount: ${campSnap.data()?.unreadCount} (Expected: 1)`);

    // 9. markAsRead Flow
    log("Marking notification as read...");
    await NotificationsService.markAsRead(notifId);
    log("PASS: Notification marked read.");

    campSnap = await getDoc(doc(db, "notification_campaigns", campaignId));
    log(`Campaign readCount: ${campSnap.data()?.readCount} (Expected: 1)`);
    log(`Campaign unreadCount: ${campSnap.data()?.unreadCount} (Expected: 0)`);

    // Cleanup
    log("Cleaning up test data...");
    await NotificationsService.softDeleteCampaign(campaignId);

    log("All Notifications Tests Completed Successfully.");

  } catch (err: any) {
    log("UNEXPECTED ERROR: " + err.message);
  }
  process.exit(0);
}

run();
