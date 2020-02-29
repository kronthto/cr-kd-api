require('dotenv').config()

const express = require('express')
const morgan = require('morgan')
const responseTime = require('response-time')
const cors = require('cors')
const { query } = require('express-validator')

const actions = require('./app/actions')

const PORT = process.env.PORT || 3001
const app = express()

app.enable('trust proxy')
app.set('trust proxy', 'loopback')
app.set('etag', false) // turn off

app.use(morgan('combined'))
app.use(responseTime())

const corsMw = cors({
  origin: '*',
  allowedHeaders: '*',
  credentials: false,
  maxAge: 86400,
  methods: 'GET'
})
app.use(corsMw)
app.options('*', corsMw)

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
  actions.killsViaTimeRange
)

app.listen(PORT, 'localhost', () => {
  console.log(`App listening on port ${PORT}!`)
})
app.on('error', onError)

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error
  }

  var bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges')
      process.exit(1)
      break
    case 'EADDRINUSE':
      console.error(bind + ' is already in use')
      process.exit(1)
      break
    default:
      throw error
  }
}
