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

const latestKillDate = function() {
  return pool.query({
    name: 'latestKillDateQuery',
    text: 'select time from crkills order by time desc limit 1;'
  })
}
const killsBetween = function(from, to) {
  return pool.query({
    name: 'killsBetweenQuery',
    text:
      'select killCount,(select data from players where characteruniquenumber=sub.characteruniquenumber) as player from (select characteruniquenumber, count(*) as killCount from crkills where time >= $1 and time <= $2 group by characteruniquenumber) sub order by killCount desc;',
    values: [from, to]
  })
}
const nationKillsBetween = function(from, to) {
  return pool.query({
    name: 'nationKillsBetweenQuery',
    text:
      'select influence, count(*) as killCount from crkills where time >= $1 and time <= $2 group by influence;',
    values: [from, to]
  })
}
const mapKillsBetween = function(from, to) {
  return pool.query({
    name: 'mapKillsBetweenQuery',
    text:
      'select mapindex, count(*) as killCount from crkills where time >= $1 and time <= $2 group by mapindex order by killCount desc;',
    values: [from, to]
  })
}
const gearDeathsBetween = function(from, to) {
  return pool.query({
    name: 'gearDeathsBetweenQuery',
    text:
      'select gear, count(*) as deathCount from crkills inner join players on (players.characteruniquenumber = crkills.param1) where time >= $1 and time <= $2 group by gear;',
    values: [from, to]
  })
}

module.exports = {
  killsViaTimeRangeQuery,
  latestKillDate,
  killsBetween,
  nationKillsBetween,
  mapKillsBetween,
  gearDeathsBetween
}
