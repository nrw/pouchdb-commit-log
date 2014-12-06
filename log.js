var Time = require('monotonic-timestamp')

var sep = '\x00'

module.exports = CommitLog

function CommitLog (db, node) {
  if (!node) throw new Error('unique node id is required')

  db.append = append

  return db

  function append (topic, obj) {
    return db.put(obj, [topic, Time().toString(36), node].join(sep))
  }
}
