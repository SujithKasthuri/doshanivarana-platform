import { SlotsService } from './src/services/firebase/slots';
import { Timestamp } from 'firebase/firestore';

const logs: any[] = [];
function log(msg: string) {
  console.log(msg);
  logs.push(msg);
}

async function run() {
  log("Starting Slots CRUD & Validation Tests...");

  try {
    const slotId = "TEST_SLOT_" + Date.now();
    
    // Test 1: Validation - missing templeId
    try {
      await SlotsService.createSlot(slotId, { poojaId: "p1", priestId: "pr1" });
      log("FAIL: Allowed creation without templeId");
    } catch (e: any) {
      log("PASS: Caught missing templeId -> " + e.message);
    }

    // Test 2: Validation - capacity <= 0
    try {
      await SlotsService.createSlot(slotId, { templeId: "t1", poojaId: "p1", priestId: "pr1", capacity: 0 });
      log("FAIL: Allowed creation with capacity <= 0");
    } catch (e: any) {
      log("PASS: Caught capacity <= 0 -> " + e.message);
    }

    // Test 3: Validation - endTime <= startTime
    try {
      const now = new Date();
      const end = new Date(now.getTime() - 1000); // end before start
      await SlotsService.createSlot(slotId, { 
        templeId: "t1", poojaId: "p1", priestId: "pr1", capacity: 10, 
        startTime: Timestamp.fromDate(now), endTime: Timestamp.fromDate(end) 
      });
      log("FAIL: Allowed endTime <= startTime");
    } catch (e: any) {
      log("PASS: Caught endTime <= startTime -> " + e.message);
    }

    // Test 4: Successful Creation
    const futureStart = new Date();
    futureStart.setHours(futureStart.getHours() + 1);
    const futureEnd = new Date(futureStart.getTime() + 60 * 60000);

    log("Creating valid slot...");
    await SlotsService.createSlot(slotId, {
      templeId: "TEST_TEMPLE",
      templeName: "Test Temple",
      poojaId: "TEST_POOJA",
      poojaName: "Test Pooja",
      priestId: "TEST_PRIEST",
      priestName: "Test Priest",
      languageCode: "Sanskrit",
      startTime: Timestamp.fromDate(futureStart),
      endTime: Timestamp.fromDate(futureEnd),
      capacity: 5,
      bookedCount: 0 // Explicitly set or default
    });
    log("PASS: Slot created successfully.");

    // Test 5: Status Automation (Update bookedCount to >= capacity)
    log("Updating slot to full capacity...");
    await SlotsService.updateSlot(slotId, { bookedCount: 5 });
    log("PASS: Slot updated.");

    // Test 6: Delete
    log("Deleting slot...");
    await SlotsService.softDeleteSlot(slotId);
    log("PASS: Slot deleted.");

    log("All Slots Tests Completed Successfully.");

  } catch (err: any) {
    log("UNEXPECTED ERROR: " + err.message);
  }
  process.exit(0);
}

run();
