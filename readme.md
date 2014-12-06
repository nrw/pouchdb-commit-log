# pouchdb-commit-log [![build status](https://secure.travis-ci.org/nrw/pouchdb-commit-log.png)](http://travis-ci.org/nrw/pouchdb-commit-log)

cluster-friendly append-only topic-based commit log + materialized view implementation for pouchdb (inspired by apache kafka and samza)

## Example

```js
var Pouch = require('pouchdb')
var CommitLog = require('pouchdb-commit-log')
var assert = require('assert')

var db = new Pouch('testdb', {db: require('memdown')})

CommitLog(db, 'a')

db1.append('letters', {name: 'a'}).then(function () {
  return db1.append('letters', {name: 'b'})
}).then(function () {
  return db1.append('letters', {name: 'c'})
}).then(function () {
  return db1.getTopic('letters')
}).then(function (res) {
  var values = res.rows.map(function (row) { return row.doc.name })
  assert.deepEqual(values, ['a', 'b', 'c'])
})
```

## Method

Messages appended to the log are sorted by topic, then `monotonic-timestamp`,
then `nodeid`. This method provides reasonably accurate insert order provided
that the clocks on all nodes in a cluster are set correctly.

## Usage

### CommitLog(db, nodeid)

Adds `.append` method to the provided `db` instance. `nodeid` must be unique
within the cluster.

### db.append(topic, doc)

Adds `doc` to the `topic` log.

### TODO

- nodeify api
- docs for
  - get topic
  - view
  - materialized view
  - watch topic
  - watch view
