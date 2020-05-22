const mysql = require('mysql')
const connection = mysql.createConnection({
  user: process.env.MYSQL_USER,
  host: process.env.MYSQL_HOST,
  database: process.env.MYSQL_DB,
  password: process.env.MYSQL_PASS,
  port: process.env.MYSQL_PORT || 3306
})

connection.connect()

const promiseQuery = function(query) {
  return new Promise((resolve, reject) => {
    connection.query(query, function(error, results, fields) {
      if (error) throw error
      resolve(results)
    })
  })
}

const fetchActiveCrDates = function() {
  var now = new Date()
  now.setHours(now.getHours() - 12)
  return promiseQuery(
    'SELECT uniq FROM cr_players WHERE `timestamp_last` > "' +
      now.toISOString() +
      '"'
  ).then(result => result.map(row => row.uniq))
}

const keepalive = function() {
  return promiseQuery('SELECT CONNECTION_ID();')
}

module.exports = {
  fetchActiveCrDates,
  keepalive
}
