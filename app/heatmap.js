const db = require('./db')
const fs = require('fs')
const jimp = require('jimp')
const mapinfo = require('./mapinfo')

const mapDir = './maps/'
const MAPSIZE = 10240

const red = 0xff000000
const redWithFullAlpha = red + 0xff

const mapKillImg = function(resp, next, from, to, map) {
  map = Number(map)

  let mapPath = mapDir + map + '.png'

  if (!fs.existsSync(mapPath)) {
    resp.status(404)
    resp.send('Map unavailable')
    return
  }

  Promise.all([db.mapKillPositions(from, to, map), jimp.read(mapPath)])
    .then(values => {
      const mapImgWidth = values[1].bitmap.width
      const scaleCoordRatio = mapImgWidth / MAPSIZE
      const xMirrorWidth = mapImgWidth - 1
      const pointsToPixels =
        values[0].rows.length / (mapImgWidth * values[1].bitmap.height)

      let startAlpha = 0.9
      if (pointsToPixels > 0.5) {
        startAlpha = 0.2
      } else if (pointsToPixels >= 0.33) {
        startAlpha = 0.5
      }

      let grouped = {}

      values[0].rows.forEach(row => {
        let x = xMirrorWidth - Math.floor(scaleCoordRatio * row.pos_x)
        let z = Math.floor(scaleCoordRatio * row.pos_z)
        if (!(x in grouped)) {
          grouped[x] = {}
        }
        if (!(z in grouped[x])) {
          grouped[x][z] = startAlpha
        }
        grouped[x][z] += 0.1
      })

      return new Promise((resolve, reject) => {
        new jimp(
          values[1].bitmap.width,
          values[1].bitmap.height,
          '#00000000',
          (err, image) => {
            if (err) {
              reject(err)
            } else {
              resolve({ image, grouped, mapImage: values[1] })
            }
          }
        )
      })
    })
    .then(data => {
      Object.keys(data.grouped).forEach(x => {
        Object.keys(data.grouped[x]).forEach(y => {
          let redWithAlpha =
            red + Math.min(255, Math.round(data.grouped[x][y] * 255))
          let drawX = Number(x)
          let drawY = Number(y)
          data.image.setPixelColor(redWithAlpha, drawX, drawY)
        })
      })

      return data.mapImage.blit(data.image, 0, 0)
    })
    .then(mergedImage => mergedImage.getBase64Async(jimp.MIME_PNG))
    .then(dataString => {
      // resp.send('<img src="'+dataString+'" />');
      resp.json({ mapname: mapinfo[map], heatmap: dataString })
    })
    .catch(e => next(e))
}

module.exports = {
  mapKillImg
}
