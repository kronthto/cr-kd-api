const { validationResult } = require('express-validator')
const db = require('./db')

const killsViaTimeRange = function(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() })
  }

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

module.exports = { killsViaTimeRange }
