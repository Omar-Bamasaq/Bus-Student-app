const DB_NAME = 'bus-students-offline'
const DB_VERSION = 3

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      const stores = ['students', 'assignments', 'attendances', 'pending', 'sync', 'returnQueue', 'activeBuses', 'busLoads', 'operations', 'operationsBuses']
      for (const name of stores) {
        if (!db.objectStoreNames.contains(name))
          db.createObjectStore(name, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export const offline = {
  async save(store, data) {
    const db = await openDB()
    const tx = db.transaction(store, 'readwrite')
    const items = Array.isArray(data) ? data : [data]
    for (const item of items) {
      tx.objectStore(store).put(item)
    }
    await new Promise((resolve) => { tx.oncomplete = resolve })
    db.close()
  },

  async getAll(store) {
    const db = await openDB()
    return new Promise((resolve) => {
      const result = []
      const tx = db.transaction(store, 'readonly')
      const cursor = tx.objectStore(store).openCursor()
      cursor.onsuccess = () => {
        const c = cursor.result
        if (c) { result.push(c.value); c.continue() }
        else resolve(result)
      }
      cursor.onerror = () => resolve(result)
    })
  },

  async get(store, id) {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(store, 'readonly')
      const req = tx.objectStore(store).get(id)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => resolve(null)
    })
  },

  async remove(store, id) {
    const db = await openDB()
    const tx = db.transaction(store, 'readwrite')
    tx.objectStore(store).delete(id)
    await new Promise((resolve) => { tx.oncomplete = resolve })
    db.close()
  },

  async clear(store) {
    const db = await openDB()
    const tx = db.transaction(store, 'readwrite')
    tx.objectStore(store).clear()
    await new Promise((resolve) => { tx.oncomplete = resolve })
    db.close()
  },

  async addPending(data) {
    const db = await openDB()
    const tx = db.transaction('pending', 'readwrite')
    const req = tx.objectStore('pending').add({ ...data, _ts: Date.now() })
    return new Promise((resolve) => {
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => null
    })
  },

  async getPending() {
    const db = await openDB()
    return new Promise((resolve) => {
      const result = []
      const tx = db.transaction('pending', 'readonly')
      const cursor = tx.objectStore('pending').openCursor()
      cursor.onsuccess = () => {
        const c = cursor.result
        if (c) { result.push(c.value); c.continue() }
        else resolve(result)
      }
      cursor.onerror = () => resolve([])
    })
  },

  async removePending(id) {
    const db = await openDB()
    const tx = db.transaction('pending', 'readwrite')
    tx.objectStore('pending').delete(id)
    await new Promise((resolve) => { tx.oncomplete = resolve })
    db.close()
  },
}
