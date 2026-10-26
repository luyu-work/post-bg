// общие свойства svg иконок кнопок, 2 в сетке 24 дает около 1.7px при иконке 20px
export const iconSvgProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const
