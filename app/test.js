run();

async function run() {
const { Client } = require('pg')
const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DB,
  password: process.env.DB_PASS,
  port: 5432,
})
await client.connect()
const res = await client.query('SELECT $1::text as message', ['Hello world!'])
console.log(res.rows[0].message) // Hello world!

const query = {
  // give the query a unique name
   name: 'fetch-player-killcount',
  text: 'SELECT count(*) FROM crkills WHERE characteruniquenumber = $1',
  values: [2386],
}
client
  .query(query)
  .then(res => console.log(res.rows[0]))
  .catch(e => console.error(e.stack))
}

