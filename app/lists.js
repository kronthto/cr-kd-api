const mysql_db = require('./mysql_db')
const db = require('./db')

const keepalive = function() {
  return mysql_db.keepalive().then(res => {
    return res[0]['CONNECTION_ID()']
  })
}

const bbList = function() {
  return mysql_db
    .fetchActiveCrDates()
    .then(crdates => db.bbList(crdates))
    .then(dbRes =>
      dbRes.rows.map(row => {
        row.cnt = Number(row.cnt)
        return row
      })
    )
}
const hsList = function() {
  return mysql_db
    .fetchActiveCrDates()
    .then(crdates => db.hsList(crdates))
    .then(dbRes =>
      dbRes.rows.map(row => {
        row.cnt = Number(row.cnt)
        return row
      })
    )
}

const lists = {}
const manageListCache = function(name, generator, lifetime) {
  lists[name] = generator()
  setInterval(() => {
    const generatorPromise = generator()
    generatorPromise.then(() => {
      lists[name] = generatorPromise
    })
  }, lifetime)
}

manageListCache('bbList', bbList, 3600000)
manageListCache('hsList', hsList, 3600000)
manageListCache('keepalive', keepalive, 60000)

module.exports = lists
