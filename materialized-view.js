var View = require('./view')

module.exports = MaterializedView

function MaterializedView (db) {
  View(db)

  db.materializedView = db.materializedView || materializedView.bind(null, db)

  return db
}

function materializedView (db, name, topics, fn, cb) {
  return db.view(topics, fn).then(save).nodeify(cb)

  function save (res) {
    return db.get(name).then(function (doc) {
      return db.put(res, name, doc._rev)
    }).catch(function (err) {
      if (err.status === 404) {
        return db.put(res, name)
      }
    }).catch(function (err) {
      if (err.status === 409) {
        return save(res)
      }
    })
  }
}
