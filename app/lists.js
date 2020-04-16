const mysql_db = require('./mysql_db')
const db = require('./db')
const cache = require('memory-cache')

const listCache = new cache.Cache()

const memoize = function(key, timeout, generator) {
  let res = listCache.get(key)
  if (res) {
    return res
  }
  res = generator()
  listCache.put(key, res, timeout)
  return res
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

module.exports = {
  bbList: () => memoize('bbList', 3600000, bbList),
  hsList: () => memoize('hsList', 3600000, hsList)
}
