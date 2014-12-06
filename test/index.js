var test = require('tape')
var Pouch = require('pouchdb')
var CommitLog = require('../log')
var GetTopic = require('../get-topic')
var View = require('../view')
var MaterializedView = require('../materialized-view')
var WatchView = require('../watch-view')

var db1 = new Pouch('testdb', {db: require('memdown')})
var db2 = new Pouch('testdb2', {db: require('memdown')})

CommitLog(db1, 'a')
CommitLog(db2, 'b')

function names (rows) {
  return rows.map(function (row) { return row.doc.name })
}

test('appends', function (t) {
  db1.append('letters', {name: 'a'}).then(function () {
    return db1.append('letters', {name: 'b'})
  }).then(function () {
    return db1.append('letters', {name: 'c'})
  }).then(function () {
    return db1.allDocs({include_docs: true})
  }).then(function (res) {
    t.same(names(res.rows), ['a', 'b', 'c'])
    t.end()
  })
})

test('replicated append', function (t) {
  db1.append('letters', {name: 'd'}).then(function () {
    return db2.append('letters', {name: 'e'})
  }).then(function () {
    return db1.append('letters', {name: 'f'})
  }).then(function () {
    return db2.append('letters', {name: 'g'})
  }).then(function () {
    return db1.sync(db2)
  }).then(function () {
    return db1.allDocs({include_docs: true})
  }).then(function (res) {
    t.same(names(res.rows), ['a','b','c','d','e','f','g'])
    return db2.allDocs({include_docs: true})
  }).then(function (res) {
    t.same(names(res.rows), ['a','b','c','d','e','f','g'])
    t.end()
  })
})

test('get topic', function (t) {
  GetTopic(db1)

  db1.append('numbers', {name: '1'}).then(function () {
    return db1.append('numbers', {name: '2'})
  }).then(function () {
    return db1.getTopic('letters')
  }).then(function (res) {
    t.same(names(res.rows), ['a','b','c','d','e','f','g'])
    return db1.getTopic('numbers')
  }).then(function (res) {
    t.same(names(res.rows), ['1','2'])
    t.end()
  })
})

test('single view', function (t) {
  View(db1)

  db1.view('numbers', function (res) {
    return res.rows.reduce(function (acc, h) {
      return acc + parseInt(h.doc.name)
    }, 0)
  }).then(function (res) {
    t.equal(res, 3)
    t.end()
  })
})

test('multi view', function (t) {
  View(db1)

  db1.view(['numbers', 'letters'], function (numbers, letters) {
    return '' + numbers.rows.reduce(function (acc, h) {
      return acc + parseInt(h.doc.name)
    }, 0) + letters.rows.map(function (h) {
      return h.doc.name
    }).join('')
  }).then(function (res) {
    t.equal(res, '3abcdefg')
    t.end()
  })
})

test('materialized view', function (t) {
  MaterializedView(db1)

  db1.materializedView('-sum', 'numbers', function (res) {
    return {
      value: res.rows.reduce(function (acc, h) {
        return acc + parseInt(h.doc.name)
      }, 0)
    }
  }).then(function () {
    return db1.get('-sum')
  }).then(function (res) {
    t.equal(res.value, 3)
    t.end()
  })
})

test('watch view', function (t) {
  WatchView(db1)

  var called = 0
  var cancel = db1.changes({
    live: true,
    doc_ids: ['-sum'],
    include_docs: true,
    since: 'now'
  }).on('change', function (change) {
    t.ok(change.doc.value === 3 || change.doc.value === 13)
    called++
    if (called === 3) t.end()
  })

  db1.watchView('-sum', 'numbers', function (res) {
    return {
      value: res.rows.reduce(function (acc, h) {
        return acc + parseInt(h.doc.name)
      }, 0)
    }
  })

  db1.append('numbers', {name: '10'})
})
