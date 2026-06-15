import { serverTimestamp, Timestamp } from 'firebase/firestore';
import { auth } from '../../lib/firebase';

export function withAudit(data: any, isUpdate = false) {
  const now = serverTimestamp();
  const userId = auth.currentUser?.uid || 'system';
  
  const auditData = {
    ...data,
    updatedAt: now,
    updatedBy: userId,
  };

  if (!isUpdate) {
    auditData.createdAt = now;
    auditData.createdBy = userId;
    auditData.isDeleted = false;
  }

  return auditData;
}

export function softDelete() {
  return {
    isDeleted: true,
    deletedAt: serverTimestamp(),
    deletedBy: auth.currentUser?.uid || 'system',
    updatedAt: serverTimestamp(),
    updatedBy: auth.currentUser?.uid || 'system',
  };
}

export function formatTimestamp(ts: any, format: "shortMonthYear" | "fullDate" = "fullDate"): string {
  if (!ts) return '';
  let date: Date;
  if (ts instanceof Timestamp || (ts.seconds !== undefined && ts.nanoseconds !== undefined)) {
    date = new Date(ts.seconds * 1000);
  } else if (ts instanceof Date) {
    date = ts;
  } else {
    return String(ts);
  }

  if (format === "shortMonthYear") {
    return date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  }
  
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function toDateObj(ts: any): Date | null {
  if (!ts) return null;
  if (ts.toDate) return ts.toDate();
  if (ts.seconds !== undefined) return new Date(ts.seconds * 1000);
  if (ts instanceof Date) return ts;
  return new Date(ts);
}
