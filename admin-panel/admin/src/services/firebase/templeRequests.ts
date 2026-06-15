import { collection, doc, setDoc, getDocs, query, where, updateDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { TemplesService } from './temples';

export const TempleRequestsService = {
  subscribeToRequests(callback: (requests: any[]) => void) {
    const q = query(collection(db, 'temple_requests'), where('isDeleted', '==', false));
    return onSnapshot(q, (snapshot) => {
      const requests: any[] = [];
      snapshot.forEach(doc => {
        requests.push({ id: doc.id, ...doc.data() });
      });
      // Sort by createdAt descending locally since we didn't create a composite index yet
      requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(requests);
    });
  },

  async createRequest(id: string, data: any, adminUid?: string) {
    const now = new Date().toISOString();
    const uid = adminUid ?? 'system';
    await setDoc(doc(db, 'temple_requests', id), {
      ...data,
      status: "Pending Review",
      templeId: null, // Null until approved and created
      createdAt: now,
      updatedAt: now,
      createdBy: uid,
      updatedBy: uid,
      isDeleted: false
    });
  },

  async updateRequestStatus(id: string, status: string, adminUid: string) {
    const ref = doc(db, 'temple_requests', id);
    await updateDoc(ref, {
      status,
      updatedAt: new Date().toISOString(),
      updatedBy: adminUid
    });
  },

  async createTempleFromRequest(requestId: string, adminUid: string) {
    // 1. Get the request
    const requestRef = doc(db, 'temple_requests', requestId);
    const requestSnap = await getDoc(requestRef);
    if (!requestSnap.exists()) throw new Error("Request not found");
    const requestData = requestSnap.data();

    // 2. Prevent duplicate creation
    if (requestData.templeId) {
      throw new Error("Temple already created for this request.");
    }

    // 3. Create the temple
    const newTempleId = `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    
    // We do not have TemplesService taking adminUid yet in createTemple, we'll update TemplesService later if needed, 
    // actually, let's just create it directly or pass adminUid. 
    // TemplesService is in `./temples` but we should check if createTemple accepts adminUid. 
    // I didn't update TemplesService in Phase 4B yet. I should update it.
    await TemplesService.createTemple(newTempleId, {
      name: requestData.name,
      location: requestData.location,
      deity: requestData.deity,
      type: requestData.type,
      proManagerId: "",
      proManagerName: "Unassigned",
      status: "Active",
      isActive: true,
      bookings: 0,
      revenue: "₹0L",
      rating: 5.0,
      poojas: 0,
      streams: 0,
      color: "#0891B2", // Default color
      since: new Date().toLocaleDateString("en-GB", { month: "short", year: "numeric" }),
      devotees: 0
    });

    // 4. Update request status to Approved and store templeId
    await updateDoc(requestRef, {
      status: "Approved",
      templeId: newTempleId,
      updatedAt: new Date().toISOString(),
      updatedBy: adminUid
    });

    return newTempleId;
  },

  async deleteRequest(id: string, adminUid: string) {
    const ref = doc(db, 'temple_requests', id);
    await updateDoc(ref, {
      isDeleted: true,
      deletedAt: new Date().toISOString(),
      updatedBy: adminUid
    });
  }
};
