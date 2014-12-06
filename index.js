var Log = require('./log')
var GetTopic = require('./get-topic')
var View = require('./view')
var WatchTopics = require('./watch-topics')
var MaterializedView = require('./materialized-view')
var WatchView = require('./watch-view')

module.exports = CommitLog

function CommitLog (db, nodeid, opts) {
  Log(db, nodeid)
  GetTopic(db)
  View(db)
  WatchTopics(db, opts)
  MaterializedView(db)
  WatchView(db)

  return db
}
