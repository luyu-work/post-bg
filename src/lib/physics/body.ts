import type { Scene } from '../field'
import type { Params } from '../settings'
import { REACH, PINCH_PUSH, SPAWN_RADIUS, SPAWN_SPEED, EDGE_MARGIN, START_SPEED, SEEK_CHANCE, SEEK_AREA } from './constants'

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

export const rand = (spread: number) => (Math.random() - 0.5) * 2 * spread
export const between = ([lo, hi]: readonly [number, number]) => lo + Math.random() * (hi - lo)

export const mass = (b: Body) => b.r * b.r

export const bodyFromSeed = (scene: Scene, i: number, w: number, h: number, pal: number): Body => {
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

// ширина пятна на экране в долях меньшей стороны
export const extent = (b: Body, p: Params) => b.r * p.blobSize * 2 * REACH

// клеточное деление: две части с общей массой стартуют вплотную по линии деления и тихо расходятся,
// поле между ними тянется нитью, пока части не разойдутся
export const split = (world: World, b: Body, nx: number, ny: number): Body[] => {
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
      // деление идет спокойно, без встряски формы
      sv: 0,
      wander: Math.atan2(b.vy + ny * PINCH_PUSH * side, b.vx + nx * PINCH_PUSH * side),
      cool: 0.5,
      kin,
      seek: null,
    }
  })
}

// новое пятно появляется за случайным краем и плывет внутрь
export const spawn = (world: World): Body => {
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
export const gone = (b: Body, world: World, p: Params) => {
  const m = b.r * p.blobSize * EDGE_MARGIN
  return (
    b.entered &&
    ((b.x < -m && b.vx < 0) || (b.x > world.w + m && b.vx > 0) || (b.y < -m && b.vy < 0) || (b.y > world.h + m && b.vy > 0))
  )
}

export const merge = (a: Body, b: Body): Body => {
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
