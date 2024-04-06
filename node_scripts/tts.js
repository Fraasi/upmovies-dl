#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'

const encoding = null

async function main() {
  // TODO: check for limit and send in piecesnew URLSearchParams(formObj).toString()
  const file = process.argv[2]
  const filename = path.basename(file)
  const text = fs.readFileSync(file, 'utf8') // 100kb limit
  const formObj = {
    key: process.env.VOICERSS_APIKEY,
    hl: 'en-us',
    v: 'Linda',
    src: text,
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
    if (res.ok) {
      const type =  res.arrayBuffer()
      return type
    }
    throw new Error(Buffer.from(res, 'binary').toString())
  }).then (buf => {
    return Buffer.from(buf, 'binary')
  })

  fs.writeFileSync(`/d/Radio/${filename}`, bin, { encoding: 'binary' }, (err) => {
    if (err) throw err;
    console.log('The file has been saved!');
  });

}

main().then(() => {
  console.log('done')
}).catch(err => {
  console.log(err)
  process.exit(1)
})
