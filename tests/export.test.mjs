import { test } from 'node:test'
import assert from 'node:assert/strict'
import { drawFrame, fitExportAxis } from '../src/lib/export.ts'
import { createScene } from '../src/lib/field.ts'
import { createWorld } from '../src/lib/physics/index.ts'
import { SLIDERS } from '../src/lib/settings.ts'
import { getPalettes } from '../src/lib/palettes.ts'
import { emptyExportErrors, updateExportError, clearExportErrors } from '../src/lib/exportErrors.ts'

function snapshot() {
  const scene = createScene(96, 54)
  return { scene, world: createWorld(scene, 96, 54, 3), time: 0,
    params: Object.fromEntries(SLIDERS.map(s => [s.key, s.def])), alpha: 1,
    palettes: getPalettes('green'), layout: { width: 18, height: 18, gap: 2, cols: 96, rows: 54, offX: 0, offY: 0 },
    viewport: { width: 1920, height: 1080 } }
}
for (const [width, height] of [[1, 1], [32, 18], [1080, 1080], [1920, 1080], [1, 8192], [8192, 1]]) {
  test(`drawFrame ${width}x${height}: visible cells and unchanged scene`, () => {
    const s = snapshot(), before = structuredClone(s)
    let colored = 0
    const ctx = { fillStyle: '', fillRect(x,y,w,h) { if (this.fillStyle !== '#080808') { assert.ok(w > 0 && h > 0); colored++ } },
      beginPath() {}, roundRect(x,y,w,h) { assert.ok(w > 0 && h > 0); colored++ }, fill() {} }
    drawFrame(ctx, s, width, height)
    assert.ok(colored > 0)
    assert.deepEqual(s, before)
  })
}
test('all formats fit whole cells to output size without cropping', () => {
  const s = snapshot(), before = structuredClone(s)
  const counts = []
  for (const [width, height] of [[1, 1], [32, 18], [1080, 1080], [1920, 1080], [3840, 2160]]) {
    const cells = []
    const ctx = { fillRect() {}, beginPath() {}, fill() {}, roundRect(x, y, w, h) {
      assert.ok(x >= 0 && y >= 0 && x + w <= width && y + h <= height)
      assert.ok(w >= 1 && h >= 1)
      cells.push({ x, y, w, h })
    } }
    drawFrame(ctx, s, width, height)
    assert.ok(cells.some(c => c.x < width && c.x + c.w > 0 && c.y < height && c.y + c.h > 0))
    assert.equal(cells[0].x, 0)
    assert.equal(cells[0].y, 0)
    const last = cells.at(-1)
    assert.equal(last.x + last.w, width)
    assert.equal(last.y + last.h, height)
    counts.push(cells.length)
  }
  assert.equal(counts[1], 2)
  assert.ok(counts[2] < counts[3] && counts[3] < counts[4])
  assert.deepEqual(s, before)
})

test('fitted axes keep positive cells, exact bounds and uniform gaps', () => {
  for (const total of [1, 2, 3, 18, 32, 101, 1080, 1920, 8192]) {
    for (const cell of [1, 2.5, 18, 100]) {
      for (const gap of [0, .5, 2, 50]) {
        const axis = fitExportAxis(total, cell, gap)
        assert.equal(axis.start(0), 0)
        const sizes = []
        for (let i = 0; i < axis.count; i++) {
          const size = axis.size(i)
          assert.ok(size >= 1)
          sizes.push(size)
          if (i) assert.equal(axis.start(i) - axis.start(i - 1) - axis.size(i - 1), Math.min(Math.round(gap), total - 1))
        }
        assert.equal(axis.start(axis.count - 1) + axis.size(axis.count - 1), total)
        assert.ok(Math.max(...sizes) - Math.min(...sizes) <= 1)
      }
    }
  }
})

test('format errors stay isolated; success clears only its format', () => {
  let errors = updateExportError(emptyExportErrors, 'png', 'png failed')
  errors = updateExportError(errors, 'gif', 'gif failed')
  errors = updateExportError(errors, 'video', 'video failed')
  assert.equal(errors.png, 'png failed')
  errors = updateExportError(errors, 'gif', '')
  assert.deepEqual(errors, { png: 'png failed', gif: '', video: 'video failed' })
  assert.deepEqual(emptyExportErrors, { png: '', gif: '', video: '' })
})
test('parameter changes clear only the corresponding group', () => {
  const errors = { png: 'png', gif: 'gif', video: 'video' }
  assert.deepEqual(clearExportErrors(errors, ['png']), { png: '', gif: 'gif', video: 'video' })
  assert.deepEqual(clearExportErrors(errors, ['gif','video']), { png: 'png', gif: '', video: '' })
  assert.deepEqual(errors, { png: 'png', gif: 'gif', video: 'video' })
})
