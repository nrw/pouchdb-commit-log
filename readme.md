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

`nodeid` must be unique within the cluster. Adds the following methods to the provided `db` instance:

- `append`
- `getTopic`
- `view`
- `materializedView`
- `watchView`

This will also add an event emitter at `db.topics`.

```js
db.topics.on('numbers', function (change) {
  // emitted any time a message is appended to the `numbers` topic
  // `change` is the pouchdb change that triggered the event
})
```

### db.append(topic, doc, callback)

Adds `doc` to the `topic` log. `callback` receives the error and/or response from the pouchdb insert operation. `doc` must be an object. It is a convention to only use topic names that match `/[a-zA-Z0-9-_\.]+/` and always start with an alphanumeric character.

### db.getTopic(topic, callback)

Get all messages that have been appended to this topic. `callback` receives the error and/or response from the pouchdb request.

### db.view(topics, transform, callback)

`topics` can be a single string name for a topic or an array of strings for multiple topics. For each topic, all messages will be passed as one argument to the `transform` function. `callback` receives any error that occurs and the value returned by the `transform` function.

```js
db.view(['numbers', 'letters'], function (numbers, letters) {
  return numbers.rows.reduce(function (acc, h) {
    return acc + parseInt(h.doc.name)
  }, 0) + letters.rows.reduce(function (acc, h) {
    return acc + h.doc.name
  })
}, function (err, res) {
  // previously, these messages were appended to the 'numbers' topic
  // {name: 1}, {name: 2}, {name: 3}
  //
  // and these messages were appended to the 'letters' topic
  // {name: 'a'}, {name: 'b'}, {name: 'c'}
  assert.notOk(err)
  assert.equal(res, '6abc')
})
```

### db.materializedView(name, topics, transform, callback)

Same behavior as `view` but instead of passing the result of `transform` to `callback`, it is saved with the `_id` `name` in the pouchdb database. `transform` must return a json object so the value can be saved. `name` must not fall within any `topic` lexographically. The convention is to prefix materialized view names with `-`.

```js
db.materializedView('-sum', 'numbers', function (numbers) {
  return {
    value: numbers.rows.reduce(function (acc, h) {
      return acc + parseInt(h.doc.name)
    }, 0)
  }
}, function (err, res) {
  // previously, these messages were appended to the 'numbers' topic
  // {name: 1}, {name: 2}, {name: 3}
  assert.notOk(err)
  assert.ok(res.ok)

  db.get('-sum', function (err, doc) {
    assert.equal(doc.value, 6)
  })
})
```

### db.watchView(name, topics, transform, options)

Same behavior as `materializedView` but the saved document is updated any time a message is appended to the a one of the required `topics`.

`options.throttle = 1000 // default` control the maximum frequency the materialized view will be saved.

```js
// `-sum` will be updated any time db.append('numbers', { ... }) is called
db.watchView('-sum', 'numbers', function (res) {
  return {
    value: res.rows.reduce(function (acc, h) {
      return acc + parseInt(h.doc.name)
    }, 0)
  }
})
```
