import type { Scene } from './field'
import type { Params } from './settings'

// пятна как в лавовой лампе: медленно плывут, упруго пружинят формой, мягко сливаются при касании и сами отрываются
// друг от друга, когда вырастают, новые заплывают из-за края экрана, ушедшие за него пропадают
// единицы длины это меньшая сторона сетки, время в секундах

const REACH = 0.75 // доля радиуса, на которой пятна считаются касающимися
const MAX_EXTENT = 0.95 // пятно шире этой доли меньшей стороны экрана само разрывается
const MIN_RADIUS = 0.13 // меньше этого капля впитывается в то, чего касается

const MERGE_DEPTH = 0.85 // во сколько раз ближе суммы радиусов центры должны сойтись, чтобы капли слились
const REPEL = 0.05 // мягкое выталкивание касающихся капель, пока они не могут слиться
const MAX_SPEED = 0.1
const DRAG = 0.1 // трение, 1/с, гасит толчки, а крейсерская скорость его перекрывает
const HEADING_DRIFT = 0.5 // как быстро курс случайно уходит в сторону, рад/с, капли плывут по плавной дуге, а не по прямой

// деление как у клетки: большая капля вытягивается в перемычку и делится на две почти равные части,
// пока они расходятся, между ними тянется нить
const PINCH_RADIUS = 0.5
const PINCH_RATE = 0.06 // делений в секунду на подходящую каплю
const PINCH_PUSH = 0.02 // скорость, с которой части расходятся
const THREAD_BREAK = 1.3 // во сколько раз суммы радиусов должны разойтись части, чтобы нить оборвалась и они стали обычными каплями

// форма как пружина: после слияния или деления капля пульсирует, как желе, и успокаивается
const SPRING = 18
const DAMPING = 1.4
const STRETCH_MIN = -0.25
const STRETCH_MAX = 0.3

// появление новых пятен из-за края экрана
const SPAWN_EVERY = [3, 8] as const // секунд между появлениями
const SPAWN_URGENT = [0.8, 1.8] as const // секунд, если пятен меньше заданного числа
const SPAWN_RADIUS = [0.3, 0.6] as const
const SPAWN_SPEED = [0.035, 0.06] as const
const EDGE_MARGIN = 1.3 // насколько радиусов от края пятно считается ушедшим за экран
const START_SPEED = 0.02

// куда плывут новые пятна: с этой вероятностью цель случайная точка в центральной половине экрана, иначе просто внутрь
const SEEK_CHANCE = 0.6
const SEEK_AREA = 0.5 // доля ширины и высоты экрана вокруг центра
const STEER = 0.6 // как быстро скорость подстраивается под путь к цели, 1/с
const ARRIVED = 0.12 // на таком расстоянии от цели пятно перестает ее искать и плывет дальше по инерции

const SUBSTEP = 1 / 60

type Target = { x: number; y: number }

export type Body = {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  // радиус и отношение осей из случайной части пятна
  r: number
  aspect: number
  rot: number
  // фазы края и непрозрачность
  p1: number
  p2: number
  p3: number
  a: number
  // номер палитры, дробный после слияния разных
  pal: number
  // форма как пружина: растяжение вдоль оси пятна и его скорость
  stretch: number
  sv: number
  // курс, по которому пятно плывет, когда у него нет цели, он плавно уходит в сторону
  wander: number
  cool: number
  // побывало внутри экрана, до этого уход за край не считается, иначе заплывающее пятно исчезло бы сразу
  entered: boolean
  // общий номер у двух частей одного деления, пока между ними тянется нить, они не сливаются обратно, 0 если нити нет
  kin: number
  // куда пятно хочет попасть, null когда цели нет или она достигнута
  seek: Target | null
  // скорость, с которой оно к ней плывет
  cruise: number
}

export type World = {
  bodies: Body[]
  first: 0 | 1
  w: number
  h: number
  target: number
  nextId: number
  // секунд до появления следующего пятна
  spawnIn: number
}

const rand = (spread: number) => (Math.random() - 0.5) * 2 * spread
const between = ([lo, hi]: readonly [number, number]) => lo + Math.random() * (hi - lo)

const mass = (b: Body) => b.r * b.r

const bodyFromSeed = (scene: Scene, i: number, w: number, h: number, pal: number): Body => {
  const s = scene.blobs[i]
  return {
    id: i,
    x: s.x * w,
    y: s.y * h,
    // направление из фаз пятна, поэтому раскладка воспроизводима
    vx: Math.cos(s.p3) * START_SPEED,
    vy: Math.sin(s.p3) * START_SPEED,
    r: s.kx,
    aspect: s.ky / s.kx,
    rot: s.rot,
    p1: s.p1,
    p2: s.p2,
    p3: s.p3,
    a: s.a,
    pal,
    stretch: 0,
    sv: 0,
    wander: s.p3,
    cool: 0,
    entered: true,
    kin: 0,
    seek: null,
    cruise: START_SPEED,
  }
}

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

// ширина пятна на экране в долях меньшей стороны
const extent = (b: Body, p: Params) => b.r * p.blobSize * 2 * REACH

// клеточное деление: две части с общей массой стартуют вплотную по линии деления и тихо расходятся,
// поле между ними тянется нитью, пока части не разойдутся
const split = (world: World, b: Body, nx: number, ny: number): Body[] => {
  const share = 0.4 + Math.random() * 0.2
  const kin = world.nextId++
  return [share, 1 - share].map((f, k) => {
    const side = k ? -1 : 1
    const r = b.r * Math.sqrt(f)
    return {
      ...b,
      id: world.nextId++,
      r,
      x: b.x + nx * r * REACH * side * 0.5,
      y: b.y + ny * r * REACH * side * 0.5,
      vx: b.vx + nx * PINCH_PUSH * side,
      vy: b.vy + ny * PINCH_PUSH * side,
      p1: b.p1 + rand(0.3),
      p2: b.p2 + rand(0.3),
      aspect: Math.min(1, Math.max(0.5, b.aspect + rand(0.1))),
      // деление встряхивает форму, дальше каждая часть плывет сама
      sv: 0.8 + Math.random() * 0.8,
      wander: Math.atan2(b.vy + ny * PINCH_PUSH * side, b.vx + nx * PINCH_PUSH * side),
      cool: 0.5,
      kin,
      seek: null,
    }
  })
}

// новое пятно появляется за случайным краем и плывет внутрь
const spawn = (world: World): Body => {
  const r = between(SPAWN_RADIUS)
  const margin = r * EDGE_MARGIN * 1.1
  const speed = between(SPAWN_SPEED)
  // край выбирается пропорционально длине, чтобы у широкого экрана верх и низ были чаще боков
  const side = Math.random() * (world.w + world.h)
  const horizontal = side < world.w
  const fromStart = Math.random() < 0.5
  const along = Math.random()
  const x = horizontal ? along * world.w : fromStart ? -margin : world.w + margin
  const y = horizontal ? (fromStart ? -margin : world.h + margin) : along * world.h

  // с вероятностью SEEK_CHANCE пятно нацелено в центральную часть экрана, иначе плывет внутрь с разбросом по углу
  const seek =
    Math.random() < SEEK_CHANCE
      ? { x: world.w * (0.5 + rand(SEEK_AREA / 2)), y: world.h * (0.5 + rand(SEEK_AREA / 2)) }
      : null
  const inward = horizontal ? (fromStart ? Math.PI / 2 : -Math.PI / 2) : fromStart ? 0 : Math.PI
  const angle = seek ? Math.atan2(seek.y - y, seek.x - x) : inward + rand(0.6)

  return {
    id: world.nextId++,
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    r,
    aspect: between([0.6, 0.95]),
    rot: Math.random() * Math.PI,
    p1: Math.random() * 6.28,
    p2: Math.random() * 6.28,
    p3: Math.random() * 6.28,
    a: between([0.75, 1]),
    pal: Math.random() < 0.5 ? 0 : 1,
    stretch: 0,
    sv: 0,
    wander: angle,
    cool: 0,
    entered: false,
    kin: 0,
    seek,
    cruise: speed,
  }
}

// пятно ушло за экран целиком и плывет дальше от него
const gone = (b: Body, world: World, p: Params) => {
  const m = b.r * p.blobSize * EDGE_MARGIN
  return (
    b.entered &&
    ((b.x < -m && b.vx < 0) || (b.x > world.w + m && b.vx > 0) || (b.y < -m && b.vy < 0) || (b.y > world.h + m && b.vy > 0))
  )
}

const merge = (a: Body, b: Body): Body => {
  const ma = mass(a)
  const mb = mass(b)
  const m = ma + mb
  const big = ma >= mb ? a : b
  return {
    ...big,
    x: (a.x * ma + b.x * mb) / m,
    y: (a.y * ma + b.y * mb) / m,
    vx: (a.vx * ma + b.vx * mb) / m,
    vy: (a.vy * ma + b.vy * mb) / m,
    r: Math.sqrt(m),
    aspect: (a.aspect * ma + b.aspect * mb) / m,
    pal: (a.pal * ma + b.pal * mb) / m,
    // слияние встряхивает форму, дальше она пружинит сама
    sv: 1.6,
    cool: 0.5,
    entered: a.entered || b.entered,
    kin: 0,
  }
}

const substep = (world: World, dt: number, p: Params) => {
  const bs = world.bodies
  const size = p.blobSize
  const dead = new Set<number>()
  const born: Body[] = []

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
    b.sv += (-SPRING * b.stretch - DAMPING * b.sv) * dt
    b.stretch = Math.min(Math.max(b.stretch + b.sv * dt, STRETCH_MIN), STRETCH_MAX)
  }
}

export const stepWorld = (world: World, scene: Scene, dt: number, p: Params) => {
  syncCount(world, scene, p.blobs)
  for (let left = dt; left > 0; left -= SUBSTEP) substep(world, Math.min(left, SUBSTEP), p)
}
