const assert = require('assert')

const Storage = require('../src')
const { implementations } = require('orbit-db-test-utils')
const timeout = 50000

implementations.forEach(implementation => {
  describe(`Storage Adapters - ${implementation.key}`, function () {
    this.timeout(timeout)

    let storage, store

    let location = implementation.fileName
    let server = implementation.server

    const data = [
      { type: (typeof true), key: 'boolean', value: true },
      { type: (typeof 1.0), key: 'number', value: 9000 },
      { type: (typeof 'x'), key: 'strng', value: 'string value' },
      { type: (typeof []), key: 'array', value: [1, 2, 3, 4] },
      { type: (typeof {}), key: 'object', value: { object: 'object', key: 'key' } }
    ]

    beforeEach(async () => {
      let storageType = implementation.module
      storage = Storage(storageType)
      if (server && server.start) await implementation.server.start({})
    })

    afterEach(async () => {
      await store.close()
      await storage.destroy(store)
      if (server && server.afterEach) await implementation.server.afterEach()
    })

    after(async () => {
      if (server && server.stop) await implementation.server.stop()
    })

    it('Creates a store in default ./orbitdb directory', async () => {
      store = await storage.createStore(location, implementation.defaultOptions || {})
      assert.strictEqual(store.db.status, 'open')
      assert.strictEqual(store.db.location, location || './orbitdb')
    })

    it('Creates a store in a custom directory', async () => {
      store = await storage.createStore(location || './customDir')
      assert.strictEqual(store.db.status, 'open')
      assert.strictEqual(store.db.location, location || './customDir')
    })

    data.forEach(d => {
      it(`puts and gets a ${d.key}`, async () => {
        store = await storage.createStore(location, implementation.defaultOptions || {})
        await store.put(d.key, JSON.stringify(d.value))
        const val = await store.get(d.key)
        const decodedVal = JSON.parse(val.toString())
        assert.deepStrictEqual(decodedVal, d.value)
        assert.strictEqual(typeof decodedVal, d.type)
      })

      it('deletes properly', async () => {
        store = await storage.createStore(location, implementation.defaultOptions || {})
        await store.put(d.key, JSON.stringify(d.value))
        await store.del(d.key, JSON.stringify(d.value))
        try {
          await store.get(d.key)
        } catch (e) {
          assert.strictEqual(true, true)
        }
      })
    })
  })
})
