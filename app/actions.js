const { query, validationResult } = require('express-validator')
const db = require('./db')
const mapinfo = require('./mapinfo')
const listService = require('./lists')
const heatmapService = require('./heatmap')

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
    [
      query('from').isISO8601(),
      query('to').isISO8601(),
      query('map')
        .optional()
        .isInt({ min: 1 })
    ],
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
  app.get(
    '/q/brigActivity',
    [query('name').isLength({ min: 2 }), query('from').isISO8601()],
    validate,
    brigActivity
  )
  app.get(
    '/q/topbrigActivity',
    [
      query('from').isISO8601(),
      query('fromHour').isInt({ min: 0, max: 23 }),
      query('toHour').isInt({ min: 0, max: 23 })
    ],
    validate,
    topbrigActivity
  )
  app.get(
    '/q/heatmap/mapkills',
    [
      query('from').isISO8601(),
      query('to').isISO8601(),
      query('map').isInt({ min: 1 })
    ],
    validate,
    mapKillsHeatmap
  )
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
  db.killsBetween(req.query.from, req.query.to, req.query.map)
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
            id: row.mapindex,
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
  listService.bbList
    .then(dbRes => {
      res.json(dbRes)
    })
    .catch(e => next(e))
}
const hsList = function(req, res, next) {
  listService.hsList
    .then(dbRes => {
      res.json(dbRes)
    })
    .catch(e => next(e))
}

const mapKillsHeatmap = function(req, res, next) {
  heatmapService.mapKillImg(
    res,
    next,
    req.query.from,
    req.query.to,
    req.query.map
  )
}

const average = arr => arr.reduce((p, c) => p + c, 0) / arr.length
const brigActivity = function(req, res, next) {
  db.brigActivity(req.query.name, req.query.from)
    .then(serviceRes => {
      if (serviceRes.rows.length === 0) {
        res.status(404)
        res.send('No data found')
        return
      }
      let playersMap = {}
      let killsMap = {}
      serviceRes.rows.forEach(row => {
        let ts = row.timebucket.getTime()
        if (!(ts in playersMap)) {
          playersMap[ts] = 0
          killsMap[ts] = 0
        }
        playersMap[ts]++
        killsMap[ts] += Number(row.killcount)
      })

      const now = new Date()
      now.setHours(now.getHours() - 1)
      let from = new Date(req.query.from)
      from.setHours(from.getHours() + 1)
      from.setMinutes(0)
      from.setSeconds(0)

      let playersPerHour = {}
      let killsPerHour = {}

      while (from < now) {
        let hour = from.getHours()
        if (!(hour in playersPerHour)) {
          playersPerHour[hour] = []
          killsPerHour[hour] = []
        }
        let ts = from.getTime()
        playersPerHour[hour].push(playersMap[ts] ? playersMap[ts] : 0)
        killsPerHour[hour].push(killsMap[ts] ? killsMap[ts] : 0)
        from.setHours(from.getHours() + 1)
      }

      const aggregateResult = map => {
        let aggObj = {}
        for (let i = 0; i < 24; i++) {
          aggObj[i] = i in map ? average(map[i]) : 0
        }
        return aggObj
      }

      res.json({
        players: aggregateResult(playersPerHour),
        kills: aggregateResult(killsPerHour)
      })
    })
    .catch(e => next(e))
}
const topbrigActivity = function(req, res, next) {
  const fromDateStr = req.query.from
  const fromHour = Number(req.query.fromHour)
  const toHour = Number(req.query.toHour)

  db.topBrigsInHours(fromDateStr)
    .then(serviceRes => {
      let brigMap = {}
      serviceRes.rows.forEach(row => {
        if (!row.brigade) {
          return
        }
        let hour = row.timebucket.getHours()
        if (hour < fromHour || hour > toHour) {
          return
        }
        let brigade = row.brigade
        let ts = row.timebucket.getTime()
        if (!(brigade in brigMap)) {
          brigMap[brigade] = {}
        }
        brigMap[brigade][ts] = Number(row.playercount)
      })
      serviceRes = null

      const now = new Date()
      now.setHours(now.getHours() - 1)
      let from = new Date(fromDateStr)
      from.setHours(from.getHours() + 1)
      from.setMinutes(0)
      from.setSeconds(0)

      let playersPerHour = {}

      while (from < now) {
        let hour = from.getHours()
        let ts = from.getTime()

        Object.keys(brigMap).forEach(brig => {
          if (!(brig in playersPerHour)) {
            playersPerHour[brig] = {}
          }
          if (!(hour in playersPerHour[brig])) {
            playersPerHour[brig][hour] = []
          }
          playersPerHour[brig][hour].push(
            brigMap[brig][ts] ? brigMap[brig][ts] : 0
          )
        })

        from.setHours(from.getHours() + 1)
      }

      brigMap = null

      const aggregateResult = (map, brig) => {
        let aggObj = { brig }
        let sum = 0
        for (let i = fromHour; i <= toHour; i++) {
          aggObj[i] = i in map ? average(map[i]) : 0
          sum += aggObj[i]
        }
        aggObj['sum'] = sum
        return aggObj
      }

      let brigsAggregated = Object.keys(playersPerHour).map(brig =>
        aggregateResult(playersPerHour[brig], brig)
      )

      playersPerHour = null

      brigsAggregated.sort((a, b) => b.sum - a.sum)

      res.json(brigsAggregated.slice(0, 25))
    })
    .catch(e => next(e))
}

module.exports = routeRegistrar
