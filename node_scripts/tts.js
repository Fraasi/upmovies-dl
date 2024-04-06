#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'

const encoding = null

async function main() {
  // TODO: check for limit and send in piecesnew URLSearchParams(formObj).toString()
  const file = process.argv[2]
  const ext = path.extname(file)
  const filename = path.basename(file, ext)
  try {
    const stats = fs.statSync(file)
    console.log(`The file ${file} has a size of ${stats.size} bytes`)
  } catch (err) {
    throw err
  }
  const text = fs.readFileSync(file, 'utf8')
  const formObj = {
    key: process.env.VOICERSS_APIKEY,
    hl: 'en-us',
    v: 'Linda',
    src: text, // 100KB limit
    r: 0,
    c: 'mp3',
    f: '44khz_16bit_stereo',
    b64: false,
  }

  const form = new URLSearchParams(formObj).toString()

  const bin = await fetch('https://api.voicerss.org/', {
    method: 'POST',
    headers:{ 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
    body: new URLSearchParams(formObj).toString()
  }).then( res => {
    console.log(res)
    if (res.status == 200) return res.arrayBuffer()
    throw new Error(Buffer.from(res, 'binary').toString())
  }).then (buf => {
    return Buffer.from(buf, 'binary')
  })

  if (bin.toString().startsWith('ERROR') || bin.toString().length == 0) {
    throw new Error(bin)
  }

  try {
    fs.writeFileSync(`/d/Radio/${filename}.mp3`, bin, { encoding: 'binary' })
    console.log('The file has been saved!')
  } catch (err) {
    throw err
  }

}

main().then(() => {
  console.log('All done')
}).catch(err => {
  console.log(err)
  process.exit(1)
})
