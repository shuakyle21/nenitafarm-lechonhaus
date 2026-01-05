import { useState, useEffect, useCallback } from 'react';
import { PaperPosRecord } from '@/types';
import { paperPosImportService } from '@/services/paperPosImportService';

export function usePaperPosImport(isAuthenticated: boolean) {
  const [records, setRecords] = useState<PaperPosRecord[]>([]);
  const [unsyncedRecords, setUnsyncedRecords] = useState<PaperPosRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchRecords = useCallback(async () => {
    try {
      const [allRecords, unsynced] = await Promise.all([
        paperPosImportService.getPaperPosRecords(),
        paperPosImportService.getUnsyncedRecords(),
      ]);
      setRecords(allRecords);
      setUnsyncedRecords(unsynced);
    } catch (error) {
      console.error('Error fetching paper POS records:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      void fetchRecords();
    }
  }, [isAuthenticated, fetchRecords]);

  const importRecord = async (record: Omit<PaperPosRecord, 'id' | 'imported_at'>) => {
    try {
      const newRecord = await paperPosImportService.importRecord(record);
      setRecords((prev) => [newRecord, ...prev]);
      setUnsyncedRecords((prev) => [newRecord, ...prev]);
      return newRecord;
    } catch (error) {
      console.error('Error importing record:', error);
      throw error;
    }
  };

  const importRecords = async (newRecords: Omit<PaperPosRecord, 'id' | 'imported_at'>[]) => {
    try {
      const imported = await paperPosImportService.importRecords(newRecords);
      setRecords((prev) => [...imported, ...prev]);
      setUnsyncedRecords((prev) => [...imported, ...prev]);
      return imported;
    } catch (error) {
      console.error('Error importing records:', error);
      throw error;
    }
  };

  const syncRecord = async (recordId: string) => {
    try {
      setSyncing(true);
      await paperPosImportService.syncRecordToOrder(recordId);
      await fetchRecords(); // Refresh data
    } catch (error) {
      console.error('Error syncing record:', error);
      throw error;
    } finally {
      setSyncing(false);
    }
  };

  const syncAllRecords = async () => {
    try {
      setSyncing(true);
      const results = await paperPosImportService.syncAllRecords();
      await fetchRecords(); // Refresh data
      return results;
    } catch (error) {
      console.error('Error syncing all records:', error);
      throw error;
    } finally {
      setSyncing(false);
    }
  };

  const deleteRecord = async (id: string) => {
    try {
      await paperPosImportService.deleteRecord(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
      setUnsyncedRecords((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      console.error('Error deleting record:', error);
      throw error;
    }
  };

  return {
    records,
    unsyncedRecords,
    loading,
    syncing,
    importRecord,
    importRecords,
    syncRecord,
    syncAllRecords,
    deleteRecord,
    refreshRecords: fetchRecords,
  };
}
