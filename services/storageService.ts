
export const DB_NAME = 'polyglot_spec_db';
export const STORE_NAME = 'specs';
export const REF_KEY = 'spec_reference_map';

class StorageService {
    private openDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            if (typeof indexedDB === 'undefined') {
                reject(new Error("IndexedDB not supported"));
                return;
            }
            const request = indexedDB.open(DB_NAME, 2);
            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    public async saveSpecs(value: Record<string, string>): Promise<void> {
        try {
            // Backup to LocalStorage (Legacy/Fallback)
            try {
                localStorage.setItem(REF_KEY, JSON.stringify(value));
            } catch(e) { console.warn("LS Save failed", e); }

            const db = await this.openDB();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, 'readwrite');
                const store = tx.objectStore(STORE_NAME);
                const req = store.put(value, REF_KEY);
                
                req.onsuccess = () => resolve();
                req.onerror = () => reject(req.error);
                
                // Transaction complete is also a success indicator
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            });
        } catch (e) {
            console.error("StorageService Save Error:", e);
        }
    }

    public async loadSpecs(): Promise<Record<string, string> | null> {
        try {
            const db = await this.openDB();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, 'readonly');
                const request = tx.objectStore(STORE_NAME).get(REF_KEY);
                
                request.onsuccess = () => {
                    if (request.result) {
                        resolve(request.result);
                    } else {
                        // Fallback to LocalStorage
                        const ls = localStorage.getItem(REF_KEY);
                        if (ls) {
                            try {
                                resolve(JSON.parse(ls));
                            } catch(e) { resolve(null); }
                        } else {
                            resolve(null);
                        }
                    }
                };
                request.onerror = () => reject(request.error);
            });
        } catch (e) {
            console.error("StorageService Load Error:", e);
            return null;
        }
    }
}

export const storageService = new StorageService();
