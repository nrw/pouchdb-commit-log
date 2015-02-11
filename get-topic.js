var Q = require('bluebird')

module.exports = GetTopic

function GetTopic (db) {
  db.getTopic = db.getTopic || getTopic.bind(null, db)

  return db
}

function getTopic (db, topic, cb) {
  return Q.resolve().then(function () {
    return db.allDocs({
      startkey: topic,
      endkey: topic + '\xff',
      include_docs: true
    })
  }).nodeify(cb)
}
