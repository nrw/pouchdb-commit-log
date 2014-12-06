var WatchTopics = require('./watch-topics')
var MaterializedView = require('./materialized-view')
var throttle = require('lodash.throttle')

module.exports = WatchView

function WatchView (db, opts) {
  WatchTopics(db)
  MaterializedView(db)

  db.watchView = db.watchView || watchView.bind(null, db)

  return db
}

function watchView (db, name, topics, fn, opts) {
  opts = opts || {}
  opts.throttle = opts.throttle || 1000

  if (!Array.isArray(topics)) {
    topics = [topics]
  }
  var method = throttle(build, opts.throttle)

  for (var i = 0; i < topics.length; i++) {
    db.topics.on(topics[i], method)
  }

  function build () {
    db.materializedView(name, topics, fn)
  }
}
