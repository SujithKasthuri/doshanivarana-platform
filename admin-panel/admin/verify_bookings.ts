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
  log("Starting Bookings Verification...");

  const slotId = "TEST_SLOT_BOOKINGS";
  try {
    // 1. Setup a test slot with capacity 2
    log("Creating test slot with capacity 2...");
    const futureStart = new Date(Date.now() + 3600000);
    const futureEnd = new Date(futureStart.getTime() + 3600000);
    
    // Make sure we delete any old one
    try { await SlotsService.softDeleteSlot(slotId); } catch(e){}

    await SlotsService.createSlot(slotId, {
      templeId: "T1", poojaId: "P1", priestId: "PR1", capacity: 2, bookedCount: 0,
      startTime: Timestamp.fromDate(futureStart), endTime: Timestamp.fromDate(futureEnd)
    });
    log("PASS: Slot created.");

    // 2. Create Booking 1 (Test Sequence Generation)
    const b1Id = "TEST_BK_1";
    await BookingsService.createBooking(b1Id, { slotId });
    log("PASS: Booking 1 created.");

    // Verify counter & slot
    let b1Snap = await getDoc(doc(db, "bookings", b1Id));
    let slotSnap = await getDoc(doc(db, "slots", slotId));
    log(`Booking 1 Number: ${b1Snap.data()?.bookingNumber}`);
    log(`Slot Booked Count: ${slotSnap.data()?.bookedCount}`);

    // 3. Create Booking 2
    const b2Id = "TEST_BK_2";
    await BookingsService.createBooking(b2Id, { slotId });
    log("PASS: Booking 2 created.");
    
    let b2Snap = await getDoc(doc(db, "bookings", b2Id));
    slotSnap = await getDoc(doc(db, "slots", slotId));
    log(`Booking 2 Number: ${b2Snap.data()?.bookingNumber}`);
    log(`Slot Booked Count: ${slotSnap.data()?.bookedCount} (Expected: 2)`);
    log(`Slot Status: ${slotSnap.data()?.status} (Expected: Full)`);

    // 4. Test Capacity Stress (Booking 3 should fail)
    try {
      log("Attempting Booking 3 on Full Slot...");
      await BookingsService.createBooking("TEST_BK_3", { slotId });
      log("FAIL: Allowed overbooking!");
    } catch (e: any) {
      log("PASS: Prevented overbooking -> " + e.message);
    }

    // 5. Test Transition Validation
    log("Testing status transitions...");
    try {
      await BookingsService.updateBookingStatus(b1Id, "Completed");
      log("FAIL: Allowed Pending -> Completed");
    } catch (e: any) {
      log("PASS: Prevented Pending -> Completed -> " + e.message);
    }

    // 6. Test Capacity Release on Cancel
    log("Cancelling Booking 1...");
    await BookingsService.updateBookingStatus(b1Id, "Cancelled");
    
    slotSnap = await getDoc(doc(db, "slots", slotId));
    log(`Slot Booked Count: ${slotSnap.data()?.bookedCount} (Expected: 1)`);
    log(`Slot Status: ${slotSnap.data()?.status} (Expected: Available)`);

    // 7. Booking 3 should now succeed
    log("Attempting Booking 3 again...");
    await BookingsService.createBooking("TEST_BK_3", { slotId });
    log("PASS: Booking 3 succeeded after capacity release.");

    // Cleanup
    await BookingsService.softDeleteBooking(b1Id);
    await BookingsService.softDeleteBooking(b2Id);
    await BookingsService.softDeleteBooking("TEST_BK_3");
    await SlotsService.softDeleteSlot(slotId);

    log("All Bookings Tests Completed Successfully.");

  } catch (err: any) {
    log("UNEXPECTED ERROR: " + err.message);
  }
  process.exit(0);
}

run();
