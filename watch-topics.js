var Emitter = require('eventemitter2').EventEmitter2

var sep = '\x00'

module.exports = WatchTopics

function WatchTopics (db, opts) {
  db.topics = db.topics || watchTopics(db, opts)

  return db
}

function watchTopics (db, opts) {
  opts = opts || {live: true, since: 0}

  var emitter = new Emitter()

  db.changes(opts).on('change', function (change) {
    var topic = change.id.split(sep)[0]
    emitter.emit(topic)
  })

  return emitter
}
