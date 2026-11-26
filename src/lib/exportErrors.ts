export type ExportFormat = 'png' | 'gif' | 'video'
export type ExportErrors = Record<ExportFormat, string>
export const emptyExportErrors: ExportErrors = { png: '', gif: '', video: '' }

export function updateExportError(errors: ExportErrors, format: ExportFormat, message: string): ExportErrors {
  return { ...errors, [format]: message }
}

export function clearExportErrors(errors: ExportErrors, formats: ExportFormat[]): ExportErrors {
  const next = { ...errors }
  for (const format of formats) next[format] = ''
  return next
}
