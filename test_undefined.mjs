import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import fs from "fs";

const serviceAccount = JSON.parse(fs.readFileSync('./serviceAccountKey.json', 'utf8'));
const app = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app);

async function runTest() {
  const bookingId = "TEST_BOOKING_" + Date.now();
  const activeStreamId = "stream_" + Date.now();
  const templeId = "TEST_TEMPLE";

  // Mock booking
  const booking = {
    id: bookingId,
    templeId: "TEST_TEMPLE",
    poojaId: "TEST_POOJA",
    // intentionally omit userId, templeName, etc to test undefined behavior
  };

  try {
    // 1. Update stream status
    await db.collection('liveStreams').doc(activeStreamId).set({
      status: 'ENDED',
      endedAt: FieldValue.serverTimestamp()
    });

    // 2. Update booking status
    await db.collection('bookings').doc(booking.id).set({
      status: 'COMPLETED',
      streamStatus: 'ENDED',
      recordingStatus: 'Available'
    });

    // 3. Auto-generate Recording for Demo
    const recId = `rec_${Date.now()}`;
    await db.collection('recordings').doc(recId).set({
      templeId: booking.templeId || templeId,
      templeName: booking.templeName || 'Unknown Temple',
      poojaId: booking.poojaId || '',
      poojaName: booking.poojaName || 'Unknown Pooja',
      priestId: booking.priestId || null,
      priestName: booking.priestName || null,
      bookingId: booking.id,
      streamId: activeStreamId,
      status: 'READY',
      duration: '1h 02m',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      slotDate: booking.scheduledDate || booking.dateTime || new Date().toISOString().split('T')[0]
    });

    // 4. Generate System Event
    await db.collection('systemEvents').doc().set({
      eventType: 'stream.ended',
      entityId: activeStreamId,
      entityType: 'stream',
      payload: {
        streamId: activeStreamId,
        bookingId: booking.id,
        templeId: booking.templeId,
        userId: booking.userId
      },
      status: 'PENDING',
      createdAt: FieldValue.serverTimestamp()
    });

    // 5. Audit Log
    await db.collection('auditLogs').doc().set({
      action: 'STREAM_ENDED',
      entityId: activeStreamId,
      entityType: 'stream',
      performedBy: templeId,
      timestamp: FieldValue.serverTimestamp(),
      details: `Stream ${activeStreamId} ended for booking ${booking.id}`
    });

    console.log("SUCCESS!");
  } catch (e) {
    console.error("CRASHED:", e.message);
  }
  process.exit(0);
}

runTest();
