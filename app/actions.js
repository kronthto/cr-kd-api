const { query, validationResult } = require('express-validator')
const db = require('./db')
const mapinfo = require('./mapinfo')
const listService = require('./lists')

const validate = function(req, res, next) {
  const errors = validationResult(req)
  if (errors.isEmpty()) {
    return next()
  }
  return res.status(422).json({ errors: errors.array() })
}

const routeRegistrar = function(app) {
  app.get(
    '/q/killsViaTimeRange',
    [
      query('from').isISO8601(),
      query('to')
        .optional()
        .isISO8601(),
      query('group')
        .optional()
        .isInt({ min: 30, max: 3600 })
    ],
    validate,
    killsViaTimeRange
  )
  app.get('/q/latestKillDate', latestKillDate)
  app.get(
    '/q/killsBetween',
    [query('from').isISO8601(), query('to').isISO8601()],
    validate,
    killsBetween
  )
  app.get(
    '/q/nationKillsBetween',
    [query('from').isISO8601(), query('to').isISO8601()],
    validate,
    nationKillsBetween
  )
  app.get(
    '/q/mapKillsBetween',
    [query('from').isISO8601(), query('to').isISO8601()],
    validate,
    mapKillsBetween
  )
  app.get(
    '/q/gearDeathsBetween',
    [query('from').isISO8601(), query('to').isISO8601()],
    validate,
    gearDeathsBetween
  )
  app.get('/q/lists/bb', bbList)
  app.get('/q/lists/hs', hsList)
}

const GEARMAP = {
  1: 'B',
  16: 'M',
  256: 'A',
  4096: 'I'
}
const NATIONMAP = {
  2: 'BCU',
  4: 'ANI'
}

const killsViaTimeRange = function(req, res, next) {
  db.killsViaTimeRangeQuery(req.query.from, req.query.to, req.query.group || 60)
    .then(dbRes => {
      res.json(
        dbRes.rows.map(row => {
          row.killcount = Number(row.killcount)
          return row
        })
      )
    })
    .catch(e => next(e))
}
const latestKillDate = function(req, res, next) {
  db.latestKillDate()
    .then(dbRes => {
      res.json(dbRes.rows[0].time)
    })
    .catch(e => next(e))
}
const killsBetween = function(req, res, next) {
  db.killsBetween(req.query.from, req.query.to)
    .then(dbRes => {
      let byGear = { I: 0, M: 0, B: 0, A: 0 }
      let counts = {
        BCU: { I: 0, M: 0, B: 0, A: 0 },
        ANI: { I: 0, M: 0, B: 0, A: 0 }
      }
      let data = dbRes.rows.map(row => {
        let rowFormatted = {
          player: row.player
            ? {
                name: row.player.name,
                nation: NATIONMAP[row.player.nation],
                gear: GEARMAP[row.player.gear],
                brigade: row.player.brigade
              }
            : null,
          killcount: Number(row.killcount)
        }
        if (rowFormatted.player && rowFormatted.player.nation) {
          byGear[rowFormatted.player.gear] += rowFormatted.killcount
          counts[rowFormatted.player.nation][rowFormatted.player.gear]++
        }
        return rowFormatted
      })
      res.json({
        stats: {
          byGear,
          counts
        },
        data: data
          .slice(0, 1000)
          .filter((el, idx) => idx < 100 || el.killcount >= 10)
      })
    })
    .catch(e => next(e))
}
const nationKillsBetween = function(req, res, next) {
  db.nationKillsBetween(req.query.from, req.query.to)
    .then(dbRes => {
      res.json(
        dbRes.rows.map(row => {
          return {
            nation: NATIONMAP[row.influence],
            killcount: Number(row.killcount)
          }
        })
      )
    })
    .catch(e => next(e))
}
const mapKillsBetween = function(req, res, next) {
  db.mapKillsBetween(req.query.from, req.query.to)
    .then(dbRes => {
      res.json(
        dbRes.rows.map(row => {
          return {
            map: mapinfo[row.mapindex] || row.mapindex,
            killcount: Number(row.killcount)
          }
        })
      )
    })
    .catch(e => next(e))
}
const gearDeathsBetween = function(req, res, next) {
  db.gearDeathsBetween(req.query.from, req.query.to)
    .then(dbRes => {
      res.json(
        dbRes.rows.map(row => {
          row.deathcount = Number(row.deathcount)
          return row
        })
      )
    })
    .catch(e => next(e))
}

const bbList = function(req, res, next) {
  listService
    .bbList()
    .then(dbRes => {
      res.json(dbRes)
    })
    .catch(e => next(e))
}
const hsList = function(req, res, next) {
  listService
    .hsList()
    .then(dbRes => {
      res.json(dbRes)
    })
    .catch(e => next(e))
}

module.exports = routeRegistrar
