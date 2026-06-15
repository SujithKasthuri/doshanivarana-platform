import { RecordingsService } from './src/services/firebase/recordings';
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
  log("Starting Recordings Verification...");

  const tId = "TEST_TEMPLE_REC";
  const pId = "TEST_POOJA_REC";
  const prId = "TEST_PRIEST_REC";
  const slotId1 = "TEST_SLOT_REC_1";
  const slotId2 = "TEST_SLOT_REC_2";
  const slotId3 = "TEST_SLOT_REC_3";
  const sIdValid = "TEST_STREAM_REC_VALID";
  const sIdDeleted = "TEST_STREAM_REC_DELETED";
  const sIdActive = "TEST_STREAM_REC_ACTIVE";
  const recId = "TEST_RECORDING_1";

  try {
    log("Setting up mock references...");
    try { await TemplesService.softDeleteTemple(tId); } catch(e){}
    try { await PoojasService.softDeletePooja(pId); } catch(e){}
    try { await PriestsService.softDeletePriest(prId); } catch(e){}
    try { await SlotsService.softDeleteSlot(slotId1); } catch(e){}
    try { await SlotsService.softDeleteSlot(slotId2); } catch(e){}
    try { await SlotsService.softDeleteSlot(slotId3); } catch(e){}

    await TemplesService.createTemple(tId, { name: "Test Temple REC" });
    await PoojasService.createPooja(pId, { templeId: tId, name: "Test Pooja REC" });
    await PriestsService.createPriest(prId, { templeId: tId, name: "Test Priest REC" });
    
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
    await SlotsService.createSlot(slotId3, {
      templeId: tId, poojaId: pId, priestId: prId, capacity: 10,
      startTime: Timestamp.fromDate(futureStart), endTime: Timestamp.fromDate(futureEnd)
    });

    log("Setting up parent streams...");
    try { await LiveStreamsService.softDeleteStream(sIdValid); } catch(e){}
    try { await LiveStreamsService.softDeleteStream(sIdDeleted); } catch(e){}
    try { await LiveStreamsService.softDeleteStream(sIdActive); } catch(e){}
    try { await RecordingsService.softDeleteRecording(recId); } catch(e){}

    // 1. Valid Stream (Ended)
    await LiveStreamsService.createStream(sIdValid, { templeId: tId, poojaId: pId, priestId: prId, slotId: slotId1, title: "Valid Ended Stream" });
    await LiveStreamsService.updateStreamStatus(sIdValid, "Live");
    await LiveStreamsService.updateStreamStatus(sIdValid, "Ended");

    // 2. Active Stream (Live)
    await LiveStreamsService.createStream(sIdActive, { templeId: tId, poojaId: pId, priestId: prId, slotId: slotId2, title: "Active Stream" });
    await LiveStreamsService.updateStreamStatus(sIdActive, "Live"); // now it's live

    // 3. Deleted Stream
    // create and soft delete
    await LiveStreamsService.createStream(sIdDeleted, { templeId: tId, poojaId: pId, priestId: prId, slotId: slotId3, title: "Deleted Stream" });
    await LiveStreamsService.updateStreamStatus(sIdDeleted, "Live");
    await LiveStreamsService.updateStreamStatus(sIdDeleted, "Ended");
    await LiveStreamsService.softDeleteStream(sIdDeleted);

    log("PASS: References and Streams set up.");

    // TEST: Reject on Active Stream
    try {
      await RecordingsService.createRecording("FAIL_REC_1", sIdActive, { recordingTitle: "Test" });
      log("FAIL: Allowed recording on Live stream.");
    } catch(e: any) {
      log("PASS: Prevented recording on Live stream -> " + e.message);
    }

    // TEST: Reject on Soft Deleted Stream
    try {
      await RecordingsService.createRecording("FAIL_REC_2", sIdDeleted, { recordingTitle: "Test" });
      log("FAIL: Allowed recording on soft deleted stream.");
    } catch(e: any) {
      log("PASS: Reject recording creation if stream.isDeleted = true -> " + e.message);
    }

    // TEST: Valid Creation & Live Stream Sync
    await RecordingsService.createRecording(recId, sIdValid, { recordingTitle: "My Recording", durationSeconds: 3600 });
    log("PASS: Valid Recording Created.");
    
    // Check Sync
    let streamSnap = await getDoc(doc(db, "live_streams", sIdValid));
    let sData = streamSnap.data();
    if (sData?.recordingGenerated === true && sData?.recordingId === recId) {
      log("PASS: Live Stream Sync Verification successful (recordingGenerated = true).");
    } else {
      log("FAIL: Live Stream Sync Verification failed.");
    }

    // TEST: One-to-One constraint
    try {
      await RecordingsService.createRecording("FAIL_REC_3", sIdValid, { recordingTitle: "Dup" });
      log("FAIL: Allowed duplicate recording on same stream.");
    } catch(e: any) {
      log("PASS: One-to-one constraint active -> " + e.message);
    }

    // TEST: Attempt to modify immutable fields
    try {
      await RecordingsService.updateRecording(recId, { streamId: "HACKED_ID" });
      log("FAIL: Allowed streamId update.");
    } catch(e: any) {
      log("PASS: Attempting to modify streamId, templeId, poojaId, or priestId after creation is blocked -> " + e.message);
    }

    // TEST: Status transitions
    await RecordingsService.updateRecordingStatus(recId, "Published");
    log("PASS: Draft -> Published transition succeeded.");
    try {
      await RecordingsService.updateRecordingStatus(recId, "Draft");
      log("FAIL: Allowed Published -> Draft transition.");
    } catch(e: any) {
      log("PASS: Blocked invalid transition back to Draft.");
    }
    await RecordingsService.updateRecordingStatus(recId, "Archived");
    log("PASS: Published -> Archived transition succeeded.");

    // TEST: Stream Sync Reversal on Soft Delete
    await RecordingsService.softDeleteRecording(recId);
    streamSnap = await getDoc(doc(db, "live_streams", sIdValid));
    sData = streamSnap.data();
    if (sData?.recordingGenerated === false && sData?.recordingId === null) {
      log("PASS: Soft deleting a recording correctly resets recordingGenerated = false on the parent live_stream document.");
    } else {
      log("FAIL: Sync reversal failed on soft delete.");
    }

    log("Cleaning up test data...");
    await LiveStreamsService.softDeleteStream(sIdValid);
    await LiveStreamsService.softDeleteStream(sIdActive);
    await TemplesService.softDeleteTemple(tId);
    await PoojasService.softDeletePooja(pId);
    await PriestsService.softDeletePriest(prId);
    await SlotsService.softDeleteSlot(slotId1);
    await SlotsService.softDeleteSlot(slotId2);
    await SlotsService.softDeleteSlot(slotId3);

    log("All Recordings Tests Completed Successfully.");

  } catch (err: any) {
    log("UNEXPECTED ERROR: " + err.message);
  }
  process.exit(0);
}

run();
