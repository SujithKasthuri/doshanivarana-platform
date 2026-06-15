import { DeliveriesService } from './src/services/firebase/deliveries';
import { BookingsService } from './src/services/firebase/bookings';
import { SlotsService } from './src/services/firebase/slots';
import { db } from './src/lib/firebase';
import { doc, getDoc, Timestamp } from 'firebase/firestore';

const logs: any[] = [];
function log(msg: string) {
  console.log(msg);
  logs.push(msg);
}

async function run() {
  log("Starting Deliveries Verification...");

  const slotId = "TEST_SLOT_DELIVERIES";
  const bkIdConfirmed = "TEST_BK_DEL_CONF";
  const bkIdPending = "TEST_BK_DEL_PEND";
  const bkIdCancelled = "TEST_BK_DEL_CANC";
  const delId = "TEST_DEL_1";

  try {
    // Setup Mock Slot
    try { await SlotsService.softDeleteSlot(slotId); } catch(e){}
    const start = new Date(Date.now() + 3600000);
    const end = new Date(Date.now() + 7200000);
    await SlotsService.createSlot(slotId, {
      templeId: "T1", poojaId: "P1", priestId: "PR1", capacity: 10,
      startTime: Timestamp.fromDate(start), endTime: Timestamp.fromDate(end)
    });

    // Setup Bookings
    log("Creating test bookings...");
    try { await BookingsService.softDeleteBooking(bkIdConfirmed); } catch(e){}
    try { await BookingsService.softDeleteBooking(bkIdPending); } catch(e){}
    try { await BookingsService.softDeleteBooking(bkIdCancelled); } catch(e){}

    await BookingsService.createBooking(bkIdConfirmed, { slotId, bookingStatus: "Confirmed", devoteeName: "Test Devotee", templeName: "Test Temple", bookingNumber: "B1", templeId: "T1", userId: "U1" });
    await BookingsService.createBooking(bkIdPending, { slotId, bookingStatus: "Pending", devoteeName: "Test Devotee", templeName: "Test Temple", bookingNumber: "B2", templeId: "T1", userId: "U1" });
    await BookingsService.createBooking(bkIdCancelled, { slotId, bookingStatus: "Cancelled", devoteeName: "Test Devotee", templeName: "Test Temple", bookingNumber: "B3", templeId: "T1", userId: "U1" });
    log("PASS: Test bookings created.");

    // 1. Delivery against Pending booking
    try {
      await DeliveriesService.createDelivery("FAIL_DEL_1", { bookingId: bkIdPending });
      log("FAIL: Allowed creation on Pending booking.");
    } catch(e: any) {
      log("PASS: Prevented creation on Pending booking -> " + e.message);
    }

    // 2. Delivery against Cancelled booking
    try {
      await DeliveriesService.createDelivery("FAIL_DEL_2", { bookingId: bkIdCancelled });
      log("FAIL: Allowed creation on Cancelled booking.");
    } catch(e: any) {
      log("PASS: Prevented creation on Cancelled booking -> " + e.message);
    }

    // 3. Valid Delivery Creation
    try { await DeliveriesService.softDeleteDelivery(delId); } catch(e){}
    await DeliveriesService.createDelivery(delId, { bookingId: bkIdConfirmed });
    log("PASS: Valid Delivery created (Status: Processing).");

    // 4. Duplicate Delivery Prevention
    try {
      await DeliveriesService.createDelivery("FAIL_DEL_3", { bookingId: bkIdConfirmed });
      log("FAIL: Allowed duplicate delivery creation.");
    } catch(e: any) {
      log("PASS: Prevented duplicate delivery creation -> " + e.message);
    }

    // 5. Valid Transition Processing -> Packed
    await DeliveriesService.updateDeliveryStatus(delId, "Packed");
    log("PASS: Transition Processing -> Packed succeeded.");

    // 6. Invalid Transition Packed -> Delivered
    try {
      await DeliveriesService.updateDeliveryStatus(delId, "Delivered");
      log("FAIL: Allowed invalid transition Packed -> Delivered.");
    } catch(e: any) {
      log("PASS: Prevented Packed -> Delivered -> " + e.message);
    }

    // 7. Shipped without Tracking Number
    try {
      await DeliveriesService.updateDeliveryStatus(delId, "Shipped");
      log("FAIL: Allowed Shipped status without tracking number.");
    } catch(e: any) {
      log("PASS: Prevented Shipped without tracking number -> " + e.message);
    }

    // 8. Valid Transition Packed -> Shipped (with tracking)
    await DeliveriesService.updateDelivery(delId, { trackingNumber: "TRK123456" });
    await DeliveriesService.updateDeliveryStatus(delId, "Shipped");
    log("PASS: Transition Packed -> Shipped succeeded.");

    // 9. Valid Transition Shipped -> Out For Delivery -> Delivered
    await DeliveriesService.updateDeliveryStatus(delId, "Out For Delivery");
    await DeliveriesService.updateDeliveryStatus(delId, "Delivered");
    log("PASS: Transition Out For Delivery -> Delivered succeeded.");

    // Verify deliveredAt
    const delSnap = await getDoc(doc(db, "deliveries", delId));
    if (delSnap.data()?.deliveredAt) {
      log("PASS: deliveredAt timestamp was automatically populated.");
    } else {
      log("FAIL: deliveredAt timestamp missing.");
    }

    // Cleanup
    log("Cleaning up test data...");
    await DeliveriesService.softDeleteDelivery(delId);
    await BookingsService.softDeleteBooking(bkIdConfirmed);
    await BookingsService.softDeleteBooking(bkIdPending);
    await BookingsService.softDeleteBooking(bkIdCancelled);
    await SlotsService.softDeleteSlot(slotId);

    log("All Deliveries Tests Completed Successfully.");

  } catch (err: any) {
    log("UNEXPECTED ERROR: " + err.message);
  }
  process.exit(0);
}

run();
