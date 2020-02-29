const { query, validationResult } = require('express-validator')
const db = require('./db')

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

module.exports = routeRegistrar
