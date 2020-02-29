const express = require('express')
const morgan = require('morgan')
const responseTime = require('response-time')

const PORT = process.env.PORT || 3001

const app = express()

app.enable('trust proxy');
app.set('trust proxy', 'loopback');
app.use(morgan('combined'))
app.use(responseTime())

app.get('/test', function (req, res) {
	  res.json({msg:'Hello World!'});
});

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

