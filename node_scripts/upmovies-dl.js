#!/usr/bin/env node

import os from 'node:os'
import fs from 'node:fs'
import url from 'node:url'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import * as readline from 'node:readline/promises'
import cheerio from 'cheerio'

const tempFile = path.join(os.tmpdir(), 'upmovies.tmp')
const filename = path.basename(url.fileURLToPath(import.meta.url))
const searchTerm = process.argv.slice(2).join('+')

if (!searchTerm) {
  console.log(`Usage: ${filename} <search term>`)
  process.exit(1)
}

const search = async () => {
  const searchUrl = 'https://upmovies.net/search-movies/'

  const $ = await fetch(searchUrl + searchTerm + '.html')
    .then(res => res.text())
    .then(html => cheerio.load(html))

  const results = $('.itemInfo')
  if (results.length === 0) {
    console.log('[info] Nothing found, try another search term')
    process.exit(0)
  }

  let urls = ''
  results.each((i, el) => {
    const href = $(el).find('.title > a').attr('href')
    urls += href + '\n'
  })

  const fzf = spawnSync(`echo "${urls}" | fzf`, {
    // stdout has to be pipe here
    stdio: ['inherit', 'pipe', 'inherit'],
    shell: true,
    encoding: 'utf-8'
  })

  return fzf.stdout.replace(/\n$/, '')
}

async function main() {

  const chosenLink = await search()
  if (!chosenLink) process.exit(1)

  const downLinks = []
  const isSeries = chosenLink.includes('season')

  if (isSeries) {
    await fetch(chosenLink).then(res => res.text()).then(html => {
      const $ = cheerio.load(html)
      $('a.episode_series_link').each((i, el) => {
        const href = $(el).attr('href')
        downLinks.push(href)
      })
    })
  } else {
    downLinks.push(chosenLink)
  }

  const vidUrls = []

  for (const downLink of downLinks) {
    await fetch(downLink).then(res => res.text()).then(html => {
      const $1 = cheerio.load(html)
      const src = Buffer.from(($1('.player-iframe').text()).match(/\".*\"/)[0], 'base64')
      const $2 = cheerio.load(src)
      const iframeLink = $2('iframe').attr('src')

      if (isSeries) {
        const title = downLink.split('/')[4].split('-').slice(1).join('_').replace('season_', 'S')
        const episode = downLink.split('/')[5].split('.')[0].replace('episode-', 'E')
        const ytLink = `"${iframeLink}" -o "${title}${episode}.mp4"`
        vidUrls.push(ytLink)
      } else {
        const title = downLink.split('/')[4].split('-').slice(1).join('_').replace('.html', '')
        const download = spawnSync(`yt-dlp "${iframeLink}" -o "${title}.mp4"`, {
          // stdout has to be inherit here
          stdio: ['inherit', 'inherit', 'inherit'],
          shell: true,
          eletncoding: 'utf-8'
        })
      }
    })
  }
  if (isSeries) {
    fs.writeFileSync(tempFile, vidUrls.join('\n'))
    console.log(`[info] ${vidUrls.length} episodes in this season`)
    console.log(`[info] Use 'sed' like selection to choose episodes to download: (eg. "4p;5p;10,22p" to download files 1,5 and 10-22`)
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })
    let chosenEps =  `1,${vidUrls.length}p`
    const question =  '[????]'
    const answer = await rl.question(`${question} (press enter to choose all) > `)
    rl.close()
    if (answer) chosenEps = answer
    const download = spawnSync(`sed -n "${chosenEps}" ${tempFile} | xargs -tl yt-dlp`, {
      stdio: ['inherit', 'inherit', 'inherit'],
      shell: true,
      encoding: 'utf-8'
    })
  }
}

main().catch(err => {
  console.log(err)
  process.exit(1)
})

