const { Pool } = require('pg')
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DB,
  password: process.env.DB_PASS,
  port: 5432,
  connectionTimeoutMillis: 2000
})
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err)
  process.exit(-1)
})

const killsViaTimeRangeQuery = function(from, to, groupSeconds) {
  let bucketInterval = `${groupSeconds} seconds`
  if (to) {
    return pool.query({
      name: 'killsViaTimeRangeQuery',
      text:
        'select time_bucket($1, time) as timeBucket, count(*) as killCount from crkills where time >= $2 and time <= $3 group by timeBucket order by timeBucket asc;',
      values: [bucketInterval, from, to]
    })
  }
  return pool.query({
    name: 'killsViaTimeRangeQuery_NoEnd',
    text:
      'select time_bucket($1, time) as timeBucket, count(*) as killCount from crkills where time >= $2 group by timeBucket order by timeBucket asc;',
    values: [bucketInterval, from]
  })
}

module.exports = { killsViaTimeRangeQuery }
