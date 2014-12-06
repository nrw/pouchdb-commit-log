var View = require('./view')

module.exports = MaterializedView

function MaterializedView (db) {
  View(db)

  db.materializedView = db.materializedView || materializedView.bind(null, db)

  return db
}

function materializedView (db, name, topics, fn) {
  return db.view(topics, fn).then(save)

  function save (res) {
    return db.get(name).then(function (doc) {
      return db.put(res, name, doc._rev)
    }).catch(function (err) {
      if (err.status === 404) {
        return db.put(res, name)
      } else if (err.status === 409) {
        return save(res)
      } else {
        throw err
      }
    })
  }
}
