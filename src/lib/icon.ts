// общие свойства svg иконок кнопок, 2.4 в сетке 24 дает 1.6px при иконке 16px
export const iconSvgProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.4,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const
