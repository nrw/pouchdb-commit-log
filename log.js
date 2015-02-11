var Time = require('monotonic-timestamp')
var Q = require('bluebird')

var sep = '\x00'

module.exports = CommitLog

function CommitLog (db, node) {
  if (!node) throw new Error('unique node id is required')

  db.append = append

  return db

  function append (topic, obj, cb) {
    return Q.resolve().then(function () {
      return db.put(obj, [topic, Time().toString(36), node].join(sep))
    }).nodeify(cb)
  }
}
