import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '..', 'public', 'icons')
mkdirSync(outDir, { recursive: true })

function crcTable() {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
}
const CRC = crcTable()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type)
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const crcBuf = Buffer.alloc(4)
  const crc = crc32(Buffer.concat([typeBuf, data]))
  crcBuf.writeUInt32BE(crc)
  return Buffer.concat([len, typeBuf, data, crcBuf])
}

function writePng(size, path) {
  const raw = Buffer.alloc((size * 4 + 1) * size)
  for (let y = 0; y < size; y++) {
    const row = y * (size * 4 + 1)
    raw[row] = 0
    for (let x = 0; x < size; x++) {
      const i = row + 1 + x * 4
      const nx = (x + 0.5) / size - 0.5
      const ny = (y + 0.5) / size - 0.5
      const r = Math.hypot(nx, ny)
      let R = 78, G = 198, B = 245, A = 255
      if (r < 0.48) {
        const t = r / 0.48
        R = Math.round(226 - t * 80)
        G = Math.round(58 - t * 20)
        B = Math.round(84 - t * 30)
      }
      if (r < 0.34) {
        R = 20; G = 48; B = 26
      }
      if (r < 0.26) {
        R = 243; G = 234; B = 216
      }
      if (r < 0.14) {
        R = 232; G = 93; B = 76
      }
      const sx = nx * 6
      const sy = ny * 6
      if (r > 0.28 && r < 0.33 && ((Math.floor(sx * 3) + Math.floor(sy * 3)) % 5 === 0)) {
        R = 90; G = 50; B = 20
      }
      if (r > 0.48) { R = 78; G = 198; B = 245; A = 255 }
      raw[i] = R
      raw[i + 1] = G
      raw[i + 2] = B
      raw[i + 3] = A
    }
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
  writeFileSync(path, png)
}

writePng(192, join(outDir, 'icon-192.png'))
writePng(512, join(outDir, 'icon-512.png'))
