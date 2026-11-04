import type { Scene } from '../field'
import type { Params } from '../settings'
import { between, bodyFromSeed, extent, gone, mass, merge, rand, spawn, split, type Body, type World } from './body'
import { REACH, MAX_EXTENT, MIN_RADIUS, MERGE_DEPTH, REPEL, MAX_SPEED, DRAG, HEADING_DRIFT, PINCH_RADIUS, PINCH_RATE, THREAD_BREAK, SPRING, DAMPING, COLLIDE_SQUASH, COLLIDE_MAX, STRETCH_MIN, STRETCH_MAX, SPAWN_EVERY, SPAWN_URGENT, STEER, ARRIVED, SUBSTEP } from './constants'

export const createWorld = (scene: Scene, cols: number, rows: number, count: number): World => {
  const m = Math.min(cols, rows)
  const world: World = {
    bodies: [],
    first: scene.first,
    w: cols / m,
    h: rows / m,
    target: 0,
    nextId: scene.blobs.length,
    spawnIn: between(SPAWN_URGENT),
  }
  syncCount(world, scene, count)
  return world
}

// слайдер количества пятен: недостающие берутся из случайной части сцены, лишние убираются с самых маленьких
export const syncCount = (world: World, scene: Scene, count: number) => {
  const n = Math.round(count)
  if (world.target === n) return
  world.target = n
  const used = new Set(world.bodies.map((b) => b.id))
  for (let i = 0; i < scene.blobs.length && world.bodies.length < n; i++) {
    if (used.has(i)) continue
    world.bodies.push(bodyFromSeed(scene, i, world.w, world.h, (world.first + i) % 2))
  }
  while (world.bodies.length > n) {
    let k = 0
    for (let i = 1; i < world.bodies.length; i++) if (mass(world.bodies[i]) < mass(world.bodies[k])) k = i
    world.bodies.splice(k, 1)
  }
}

const substep = (world: World, dt: number, p: Params) => {
  const bs = world.bodies
  const size = p.blobSize
  const dead = new Set<number>()
  const born: Body[] = []
  // насколько сильно каждое пятно прижато соседями в этом шаге, сплющивание следует за прижимом и уходит вместе с ним
  const pressed = new Map<Body, number>()

  for (let i = 0; i < bs.length; i++) {
    for (let j = i + 1; j < bs.length; j++) {
      if (dead.has(j) || dead.has(i)) continue
      const a = bs[i]
      const b = bs[j]
      const dx = b.x - a.x
      const dy = b.y - a.y
      const d = Math.sqrt(dx * dx + dy * dy) || 1e-4
      const contact = (a.r + b.r) * size * REACH

      // части одного деления связаны нитью: не сливаются и не отталкиваются, пока не разошлись достаточно
      if (a.kin && a.kin === b.kin) {
        if (d > contact * THREAD_BREAK) a.kin = b.kin = 0
        continue
      }
      if (d >= contact) continue

      // касаются: сливаются, когда сошлись достаточно близко, или впитывают совсем мелкую каплю
      const ready = a.cool <= 0 && b.cool <= 0
      if ((ready && d < contact * MERGE_DEPTH) || Math.min(a.r, b.r) < MIN_RADIUS) {
        dead.add(i)
        dead.add(j)
        born.push(merge(a, b))
        continue
      }

      // иначе мягко расходятся, пока не отплыли
      const nx = dx / d
      const ny = dy / d
      const ma = mass(a)
      const mb = mass(b)
      const push = (REPEL * (contact - d)) / contact
      // касание мягко сплющивает обе капли, пока они давят друг на друга
      const depth = Math.min((contact - d) / contact, COLLIDE_MAX)
      pressed.set(a, Math.max(pressed.get(a) ?? 0, depth))
      pressed.set(b, Math.max(pressed.get(b) ?? 0, depth))
      a.vx -= nx * push * (mb / (ma + mb))
      a.vy -= ny * push * (mb / (ma + mb))
      b.vx += nx * push * (ma / (ma + mb))
      b.vy += ny * push * (ma / (ma + mb))
    }
  }

  const next = bs.filter((_, i) => !dead.has(i))
  next.push(...born)

  // большая капля время от времени перетягивается и делится, слишком большая делится сразу
  for (let i = next.length - 1; i >= 0; i--) {
    const b = next[i]
    // пятен не может стать больше заданного слайдером числа, делиться можно только при свободном месте
    if (next.length >= world.target) break
    const oversize = extent(b, p) > MAX_EXTENT * Math.min(world.w, world.h)
    if (oversize || (b.r > PINCH_RADIUS && b.cool <= 0 && !b.kin && Math.random() < PINCH_RATE * dt)) {
      const a = Math.random() * Math.PI
      next.splice(i, 1, ...split(world, b, Math.cos(a), Math.sin(a)))
    }
  }

  // новые пятна появляются из-за края только пока их меньше заданного числа, чаще, если не хватает
  world.spawnIn -= dt
  if (world.spawnIn <= 0) {
    if (next.length < world.target) next.push(spawn(world))
    world.spawnIn = between(next.length < world.target ? SPAWN_URGENT : SPAWN_EVERY)
  }
  world.bodies = next.filter((b) => !gone(b, world, p))

  for (const b of world.bodies) {
    // курс: к цели, пока она есть, у цели пятно отпускается и плывет дальше тем же курсом, без цели курс плавно блуждает
    let heading = b.wander
    if (b.seek) {
      const tx = b.seek.x - b.x
      const ty = b.seek.y - b.y
      if (Math.hypot(tx, ty) < ARRIVED) {
        b.wander = Math.atan2(b.vy, b.vx)
        b.seek = null
      } else heading = Math.atan2(ty, tx)
    } else b.wander += rand(HEADING_DRIFT) * dt
    // скорость плавно подстраивается под курс, поэтому пятна не замирают и не разгоняются
    b.vx += (Math.cos(heading) * b.cruise - b.vx) * STEER * dt
    b.vy += (Math.sin(heading) * b.cruise - b.vy) * STEER * dt
    const v = Math.hypot(b.vx, b.vy)
    if (v > MAX_SPEED) {
      b.vx *= MAX_SPEED / v
      b.vy *= MAX_SPEED / v
    }
    const drag = Math.exp(-DRAG * dt)
    b.vx *= drag
    b.vy *= drag
    b.x += b.vx * dt
    b.y += b.vy * dt

    b.cool = Math.max(0, b.cool - dt)
    if (!b.entered && b.x > 0 && b.x < world.w && b.y > 0 && b.y < world.h) b.entered = true

    // в покое пятно неподвижно по форме, пружину раскачивают только слияние и деление, потом пульсация затухает
    const rest = -COLLIDE_SQUASH * (pressed.get(b) ?? 0)
    b.sv += (-SPRING * (b.stretch - rest) - DAMPING * b.sv) * dt
    b.stretch = Math.min(Math.max(b.stretch + b.sv * dt, STRETCH_MIN), STRETCH_MAX)
  }
}

export const stepWorld = (world: World, scene: Scene, dt: number, p: Params) => {
  syncCount(world, scene, p.blobs)
  for (let left = dt; left > 0; left -= SUBSTEP) substep(world, Math.min(left, SUBSTEP), p)
}
