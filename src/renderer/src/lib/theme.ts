export type ThemeConfig = {
  baseColor: string
}

const DEFAULT_THEME_BASE_COLOR = '#0ea5e9'

type RgbColor = {
  r: number
  g: number
  b: number
}

type HslColor = {
  h: number
  s: number
  l: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function normalizeHexColor(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? ''
  const match = trimmed.match(/^#?([0-9a-f]{6})$/i)
  return match ? `#${match[1].toLowerCase()}` : DEFAULT_THEME_BASE_COLOR
}

function hexToRgb(hex: string): RgbColor {
  const normalized = normalizeHexColor(hex).slice(1)
  const value = Number.parseInt(normalized, 16)

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255
  }
}

function rgbToHsl({ r, g, b }: RgbColor): HslColor {
  const red = r / 255
  const green = g / 255
  const blue = b / 255
  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)
  const delta = max - min
  const lightness = (max + min) / 2

  if (delta === 0) {
    return { h: 0, s: 0, l: lightness * 100 }
  }

  const saturation =
    lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min)

  let hue = 0
  switch (max) {
    case red:
      hue = (green - blue) / delta + (green < blue ? 6 : 0)
      break
    case green:
      hue = (blue - red) / delta + 2
      break
    default:
      hue = (red - green) / delta + 4
      break
  }

  return {
    h: hue * 60,
    s: saturation * 100,
    l: lightness * 100
  }
}

function hslToRgb(color: HslColor): RgbColor {
  const hue = ((color.h % 360) + 360) % 360
  const saturation = clamp(color.s, 0, 100) / 100
  const lightness = clamp(color.l, 0, 100) / 100
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation
  const section = hue / 60
  const x = chroma * (1 - Math.abs((section % 2) - 1))

  let red = 0
  let green = 0
  let blue = 0

  if (section >= 0 && section < 1) {
    red = chroma
    green = x
  } else if (section < 2) {
    red = x
    green = chroma
  } else if (section < 3) {
    green = chroma
    blue = x
  } else if (section < 4) {
    green = x
    blue = chroma
  } else if (section < 5) {
    red = x
    blue = chroma
  } else {
    red = chroma
    blue = x
  }

  const match = lightness - chroma / 2

  return {
    r: Math.round((red + match) * 255),
    g: Math.round((green + match) * 255),
    b: Math.round((blue + match) * 255)
  }
}

function hslTriplet(color: HslColor): string {
  return `${Math.round(color.h)} ${Math.round(color.s)}% ${Math.round(color.l)}%`
}

function rgbValue(color: RgbColor): string {
  return `${color.r}, ${color.g}, ${color.b}`
}

function tint(base: HslColor, overrides: Partial<HslColor>): HslColor {
  return {
    h: ((overrides.h ?? base.h) + 360) % 360,
    s: clamp(overrides.s ?? base.s, 0, 100),
    l: clamp(overrides.l ?? base.l, 0, 100)
  }
}

export function createThemeVariables(baseColor: string): Record<string, string> {
  const normalizedBaseColor = normalizeHexColor(baseColor)
  const accentBase = rgbToHsl(hexToRgb(normalizedBaseColor))

  const primaryDark = tint(accentBase, {
    s: clamp(Math.max(accentBase.s, 60), 54, 84),
    l: clamp(Math.max(accentBase.l, 52), 48, 60)
  })
  const primaryLight = tint(accentBase, {
    s: clamp(Math.max(accentBase.s, 48), 42, 74),
    l: clamp(accentBase.l, 34, 44)
  })
  const glowDark = tint(primaryDark, {
    s: clamp(primaryDark.s - 6, 46, 78),
    l: clamp(primaryDark.l + 10, 56, 72)
  })
  const glowLight = tint(primaryLight, {
    s: clamp(primaryLight.s + 6, 48, 80),
    l: clamp(primaryLight.l + 18, 52, 68)
  })
  const deepAccent = tint(accentBase, {
    s: clamp(Math.max(accentBase.s, 40), 36, 72),
    l: clamp(accentBase.l - 8, 22, 30)
  })
  const inkLight = tint(accentBase, {
    s: clamp(accentBase.s, 18, 42),
    l: 18
  })

  const darkPanel = tint(accentBase, { s: 26, l: 14 })
  const darkPanelInner = tint(accentBase, { s: 22, l: 10 })
  const lightPanel = tint(accentBase, { s: 44, l: 95 })
  const lightPanelInner = tint(accentBase, { s: 20, l: 100 })

  const primaryDarkRgb = rgbValue(hslToRgb(primaryDark))
  const primaryLightRgb = rgbValue(hslToRgb(primaryLight))
  const glowDarkRgb = rgbValue(hslToRgb(glowDark))
  const glowLightRgb = rgbValue(hslToRgb(glowLight))
  const deepAccentRgb = rgbValue(hslToRgb(deepAccent))

  return {
    '--theme-base-color': normalizedBaseColor,
    '--theme-background-dark': hslTriplet(tint(accentBase, { s: 24, l: 8 })),
    '--theme-card-dark': hslTriplet(tint(accentBase, { s: 24, l: 11 })),
    '--theme-popover-dark': hslTriplet(tint(accentBase, { s: 25, l: 9 })),
    '--theme-primary-dark': hslTriplet(primaryDark),
    '--theme-secondary-dark': hslTriplet(tint(accentBase, { s: 20, l: 14 })),
    '--theme-muted-dark': hslTriplet(tint(accentBase, { s: 18, l: 16 })),
    '--theme-accent-dark': hslTriplet(tint(accentBase, { s: 20, l: 15 })),
    '--theme-border-dark': hslTriplet(tint(accentBase, { s: 20, l: 18 })),
    '--theme-input-dark': hslTriplet(tint(accentBase, { s: 18, l: 17 })),
    '--theme-ring-dark': hslTriplet(primaryDark),
    '--theme-app-shell-bg-dark': `linear-gradient(180deg, hsl(${hslTriplet(tint(accentBase, { s: 18, l: 10 }))} / 0.98), hsl(${hslTriplet(tint(accentBase, { s: 18, l: 12 }))} / 0.94))`,
    '--theme-app-shell-glow-dark': `radial-gradient(circle at top left, rgba(${glowDarkRgb}, 0.14), transparent 34%)`,
    '--theme-workspace-bg-dark': `linear-gradient(180deg, hsl(${hslTriplet(tint(accentBase, { s: 18, l: 9 }))} / 0.96), hsl(${hslTriplet(tint(accentBase, { s: 18, l: 8 }))} / 0.92))`,
    '--theme-surface-bg-dark': `linear-gradient(180deg, hsl(${hslTriplet(tint(accentBase, { s: 18, l: 12 }))} / 0.96), hsl(${hslTriplet(tint(accentBase, { s: 18, l: 10 }))} / 0.92))`,
    '--theme-panel-bg-dark': `hsl(${hslTriplet(darkPanel)})`,
    '--theme-panel-inner-bg-dark': `hsl(${hslTriplet(darkPanelInner)})`,
    '--theme-panel-soft-bg-dark': `rgba(${primaryDarkRgb}, 0.08)`,
    '--theme-panel-hover-bg-dark': `rgba(${primaryDarkRgb}, 0.12)`,
    '--theme-text-soft-dark': '#d7d4e5',
    '--theme-text-muted-dark': '#9c96b7',
    '--theme-dot-idle-dark': `rgba(${deepAccentRgb}, 0.6)`,
    '--theme-body-bg-image-dark': `radial-gradient(circle at top left, hsl(${hslTriplet(primaryDark)} / 0.16) 0px, transparent 30%), radial-gradient(circle at top right, hsl(${hslTriplet(glowDark)} / 0.12) 0px, transparent 26%), linear-gradient(180deg, hsl(${hslTriplet(tint(accentBase, { s: 20, l: 10 }))}) 0%, hsl(${hslTriplet(tint(accentBase, { s: 22, l: 8 }))}) 100%)`,
    '--theme-grand-total-bg-dark': `linear-gradient(180deg, rgba(${deepAccentRgb}, 0.92), rgba(${primaryDarkRgb}, 0.88))`,
    '--theme-toast-info-bg-dark': `linear-gradient(180deg, rgba(${deepAccentRgb}, 0.95), rgba(${primaryDarkRgb}, 0.78))`,
    '--theme-primary-shadow-button-dark': `0 10px 24px rgba(${primaryDarkRgb}, 0.22)`,
    '--theme-primary-shadow-strong-dark': `0 14px 28px rgba(${primaryDarkRgb}, 0.22)`,
    '--theme-primary-shadow-tab-dark': `0 0 0 1px rgba(7, 22, 31, 0.28), 0 10px 22px rgba(${primaryDarkRgb}, 0.24)`,
    '--theme-primary-shadow-panel-dark': `0 12px 28px rgba(${primaryDarkRgb}, 0.14)`,
    '--theme-primary-shadow-glow-dark': `0 0 18px rgba(${glowDarkRgb}, 0.8)`,
    '--theme-background-light': hslTriplet(tint(accentBase, { s: 34, l: 96 })),
    '--theme-foreground-light': hslTriplet(inkLight),
    '--theme-card-light': hslTriplet(tint(accentBase, { s: 26, l: 100 })),
    '--theme-card-foreground-light': hslTriplet(inkLight),
    '--theme-popover-light': hslTriplet(tint(accentBase, { s: 26, l: 100 })),
    '--theme-popover-foreground-light': hslTriplet(inkLight),
    '--theme-primary-light': hslTriplet(primaryLight),
    '--theme-secondary-light': hslTriplet(tint(accentBase, { s: 24, l: 92 })),
    '--theme-secondary-foreground-light': hslTriplet(inkLight),
    '--theme-muted-light': hslTriplet(tint(accentBase, { s: 18, l: 91 })),
    '--theme-muted-foreground-light': hslTriplet(tint(accentBase, { s: 14, l: 42 })),
    '--theme-accent-light': hslTriplet(tint(accentBase, { s: 24, l: 92 })),
    '--theme-accent-foreground-light': hslTriplet(inkLight),
    '--theme-border-light': hslTriplet(tint(accentBase, { s: 24, l: 82 })),
    '--theme-ring-light': hslTriplet(primaryLight),
    '--theme-app-shell-bg-light': `linear-gradient(180deg, hsl(${hslTriplet(tint(accentBase, { s: 28, l: 98 }))} / 0.98), hsl(${hslTriplet(tint(accentBase, { s: 26, l: 95 }))} / 0.96))`,
    '--theme-app-shell-glow-light': `radial-gradient(circle at top left, rgba(${glowLightRgb}, 0.16), transparent 34%)`,
    '--theme-workspace-bg-light': `linear-gradient(180deg, hsl(${hslTriplet(tint(accentBase, { s: 24, l: 100 }))} / 0.96), hsl(${hslTriplet(tint(accentBase, { s: 22, l: 96 }))} / 0.94))`,
    '--theme-surface-bg-light': `linear-gradient(180deg, hsl(${hslTriplet(tint(accentBase, { s: 22, l: 100 }))} / 0.98), hsl(${hslTriplet(tint(accentBase, { s: 20, l: 97 }))} / 0.95))`,
    '--theme-panel-bg-light': `hsl(${hslTriplet(lightPanel)})`,
    '--theme-panel-inner-bg-light': `hsl(${hslTriplet(lightPanelInner)})`,
    '--theme-panel-soft-bg-light': `rgba(${primaryLightRgb}, 0.06)`,
    '--theme-panel-hover-bg-light': `rgba(${primaryLightRgb}, 0.1)`,
    '--theme-text-strong-light': `hsl(${hslTriplet(inkLight)})`,
    '--theme-text-soft-light': `hsl(${hslTriplet(tint(accentBase, { s: 20, l: 32 }))})`,
    '--theme-text-muted-light': `hsl(${hslTriplet(tint(accentBase, { s: 16, l: 46 }))})`,
    '--theme-dot-idle-light': `rgba(${primaryLightRgb}, 0.34)`,
    '--theme-body-bg-image-light': `radial-gradient(circle at top left, hsl(${hslTriplet(glowLight)} / 0.18) 0px, transparent 28%), radial-gradient(circle at top right, hsl(${hslTriplet(primaryLight)} / 0.14) 0px, transparent 26%), linear-gradient(180deg, hsl(${hslTriplet(tint(accentBase, { s: 28, l: 98 }))}) 0%, hsl(${hslTriplet(tint(accentBase, { s: 24, l: 94 }))}) 100%)`,
    '--theme-grand-total-bg-light': `linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(${glowLightRgb}, 0.18))`,
    '--theme-grand-total-value-light': `hsl(${hslTriplet(inkLight)})`,
    '--theme-toast-info-bg-light': `linear-gradient(180deg, rgba(${glowLightRgb}, 0.16), rgba(${primaryLightRgb}, 0.12))`,
    '--theme-primary-shadow-button-light': `0 10px 24px rgba(${primaryLightRgb}, 0.18)`,
    '--theme-primary-shadow-strong-light': `0 14px 28px rgba(${primaryLightRgb}, 0.18)`,
    '--theme-primary-shadow-tab-light': `0 0 0 1px rgba(${primaryLightRgb}, 0.12), 0 10px 22px rgba(${primaryLightRgb}, 0.2)`,
    '--theme-primary-shadow-panel-light': `0 12px 28px rgba(${primaryLightRgb}, 0.12)`,
    '--theme-primary-shadow-glow-light': `0 0 18px rgba(${glowLightRgb}, 0.55)`
  }
}

export function applyThemeVariables(target: HTMLElement, baseColor: string): void {
  const variables = createThemeVariables(baseColor)

  for (const [key, value] of Object.entries(variables)) {
    target.style.setProperty(key, value)
  }
}
