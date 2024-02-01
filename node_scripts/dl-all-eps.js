#!/usr/bin/env node

import os from 'node:os'
import fs from 'node:fs'
import url from 'node:url'
import path from 'node:path'
import cheerio from 'cheerio'

const tempFile = path.join(os.tmpdir(), 'dl-all-eps.tmp')
const filename = path.basename(url.fileURLToPath(import.meta.url))
const link = process.argv[2]

if (!link) {
  console.log(`Usage: ${filename} <upm-link>`)
  process.exit(1)
}

async function main() {
  const epLinks = []

  await fetch(link).then(res => res.text()).then(html => {
    const $ = cheerio.load(html)
    $('a.episode_series_link').each((i, el) => {
      const href = $(el).attr('href')
      epLinks.push(href)
    })
  })

  const vidUrls = []

  for (const epLink of epLinks) {
    await fetch(epLink).then(res => res.text()).then(html => {
      const $1 = cheerio.load(html)
      const src = Buffer.from(($1('.player-iframe').text()).match(/\".*\"/)[0], 'base64')
      const $2 = cheerio.load(src)
      const iframeLink = $2('iframe').attr('src')

      const series = epLink.split('/')[4].split('-').slice(1).join('_').replace('season_', 'S')
      const episode = epLink.split('/')[5].split('.')[0].replace('episode-', 'E')

      const ytLink = `"${iframeLink}" -o "${series}${episode}"`
      vidUrls.push(ytLink)
      console.log(`yt-dlp ${ytLink}`)
    })
  }
  fs.writeFileSync(tempFile, vidUrls.join('\n'))
}

main().then(() => {
  console.log(`All lines written to ${tempFile}`)
  console.log(`\nUse 'xargs -tL 1 -a ${tempFile} yt-dlp' to download all, or`)
  console.log(`Use 'sed -n "1,22p" ${tempFile} | xargs -tl yt-dlp' to download files between 1-22`)
}).catch(err => {
  console.log(err)
  process.exit(1)
})

