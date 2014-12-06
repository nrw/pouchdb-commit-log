var Promise = require('bluebird')
var GetTopic = require('./get-topic')

module.exports = View

function View (db) {
  GetTopic(db)

  db.view = db.view || view.bind(null, db)

  return db
}

function view (db, topics, fn, cb) {
  if (!Array.isArray(topics)) {
    topics = [topics]
  }

  return Promise.resolve().then(function () {
    return topics.map(db.getTopic)
  }).spread(fn).nodeify(cb)
}
