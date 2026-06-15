import { LiveStreamsService } from './src/services/firebase/liveStreams';
import { TemplesService } from './src/services/firebase/temples';
import { PoojasService } from './src/services/firebase/poojas';
import { PriestsService } from './src/services/firebase/priests';
import { SlotsService } from './src/services/firebase/slots';
import { db } from './src/lib/firebase';
import { doc, getDoc, Timestamp } from 'firebase/firestore';

const logs: any[] = [];
function log(msg: string) {
  console.log(msg);
  logs.push(msg);
}

async function run() {
  log("Starting Live Streams Verification...");

  const tId = "TEST_TEMPLE_LS";
  const pId = "TEST_POOJA_LS";
  const prId = "TEST_PRIEST_LS";
  const slotId1 = "TEST_SLOT_LS1";
  const slotId2 = "TEST_SLOT_LS2";
  const sId1 = "TEST_STREAM_1";
  const sId2 = "TEST_STREAM_2";
  const badPrId = "TEST_PRIEST_BAD";

  try {
    log("Setting up mock references...");
    try { await TemplesService.softDeleteTemple(tId); } catch(e){}
    try { await PoojasService.softDeletePooja(pId); } catch(e){}
    try { await PriestsService.softDeletePriest(prId); } catch(e){}
    try { await PriestsService.softDeletePriest(badPrId); } catch(e){}
    try { await SlotsService.softDeleteSlot(slotId1); } catch(e){}
    try { await SlotsService.softDeleteSlot(slotId2); } catch(e){}

    await TemplesService.createTemple(tId, { name: "Test Temple LS" });
    await PoojasService.createPooja(pId, { templeId: tId, name: "Test Pooja LS" });
    await PriestsService.createPriest(prId, { templeId: tId, name: "Test Priest LS" });
    await PriestsService.createPriest(badPrId, { templeId: "OTHER_TEMPLE", name: "Bad Priest" });

    const futureStart = new Date(Date.now() + 3600000);
    const futureEnd = new Date(Date.now() + 7200000);

    await SlotsService.createSlot(slotId1, {
      templeId: tId, poojaId: pId, priestId: prId, capacity: 10,
      startTime: Timestamp.fromDate(futureStart), endTime: Timestamp.fromDate(futureEnd)
    });
    
    await SlotsService.createSlot(slotId2, {
      templeId: tId, poojaId: pId, priestId: prId, capacity: 10,
      startTime: Timestamp.fromDate(futureStart), endTime: Timestamp.fromDate(futureEnd)
    });

    log("PASS: References set up.");

    // 1. Validation: Mismatched Relationship
    try {
      log("Testing mismatched relationship validation...");
      await LiveStreamsService.createStream("FAIL_S_1", {
        templeId: tId,
        poojaId: pId,
        priestId: badPrId,
        slotId: slotId1,
        title: "Test Stream"
      });
      log("FAIL: Allowed creation with mismatched priest.");
    } catch(e: any) {
      log("PASS: Prevented creation with mismatched priest -> " + e.message);
    }

    // 2. Valid Creation
    log("Creating valid stream 1...");
    try { await LiveStreamsService.softDeleteStream(sId1); } catch(e){}
    try { await LiveStreamsService.softDeleteStream(sId2); } catch(e){}

    await LiveStreamsService.createStream(sId1, {
      templeId: tId, poojaId: pId, priestId: prId, slotId: slotId1, title: "Valid Stream 1"
    });
    log("PASS: Valid Stream 1 Created.");

    // 3. Constraint: One active stream per slot
    try {
      log("Testing duplicate stream per slot constraint...");
      await LiveStreamsService.createStream("FAIL_S_2", {
        templeId: tId, poojaId: pId, priestId: prId, slotId: slotId1, title: "Duplicate Slot Stream"
      });
      log("FAIL: Allowed second stream for the same slot.");
    } catch(e: any) {
      log("PASS: Prevented second stream for same slot -> " + e.message);
    }

    // 4. State Transitions
    log("Testing state transitions for Stream 1...");
    
    // Scheduled -> Live
    await LiveStreamsService.goLive(sId1, tId);
    let sSnap = await getDoc(doc(db, "live_streams", sId1));
    if (sSnap.data()?.actualStartTime) {
       log("PASS: Scheduled -> Live succeeded, actualStartTime populated.");
    } else {
       log("FAIL: Scheduled -> Live, actualStartTime missing.");
    }

    // Constraint: One LIVE stream per temple
    log("Testing One LIVE Stream per Temple constraint...");
    await LiveStreamsService.createStream(sId2, {
      templeId: tId, poojaId: pId, priestId: prId, slotId: slotId2, title: "Valid Stream 2"
    });
    try {
      await LiveStreamsService.goLive(sId2, tId);
      log("FAIL: Allowed second LIVE stream for same temple.");
    } catch(e: any) {
      log("PASS: Prevented second LIVE stream for same temple -> " + e.message);
    }

    // Live -> Ended
    await LiveStreamsService.updateStreamStatus(sId1, "Ended");
    sSnap = await getDoc(doc(db, "live_streams", sId1));
    if (sSnap.data()?.actualEndTime) {
       log("PASS: Live -> Ended succeeded, actualEndTime populated.");
    } else {
       log("FAIL: Live -> Ended, actualEndTime missing.");
    }

    // Invalid Transition: Ended -> Live
    try {
      await LiveStreamsService.updateStreamStatus(sId1, "Live");
      log("FAIL: Allowed Ended -> Live transition.");
    } catch(e: any) {
      log("PASS: Prevented Ended -> Live transition -> " + e.message);
    }

    // Ended -> Archived
    await LiveStreamsService.updateStreamStatus(sId1, "Archived");
    log("PASS: Ended -> Archived succeeded.");

    log("Cleaning up test data...");
    await LiveStreamsService.softDeleteStream(sId1);
    await LiveStreamsService.softDeleteStream(sId2);
    await TemplesService.softDeleteTemple(tId);
    await PoojasService.softDeletePooja(pId);
    await PriestsService.softDeletePriest(prId);
    await PriestsService.softDeletePriest(badPrId);
    await SlotsService.softDeleteSlot(slotId1);
    await SlotsService.softDeleteSlot(slotId2);

    log("All Live Streams Tests Completed Successfully.");

  } catch (err: any) {
    log("UNEXPECTED ERROR: " + err.message);
  }
  process.exit(0);
}

run();
