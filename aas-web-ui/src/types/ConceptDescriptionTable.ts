export type ConceptDescriptionTableStatus = 'new' | 'exists'
export type ConceptDescriptionTableSource = 'cd' | 'eds'

export type ConceptDescriptionTableRow = {
  id: string
  irdi: string
  preferredName: string
  shortName: string
  definition: string
  unit: string
  dataType: string
  selected?: boolean
  status?: ConceptDescriptionTableStatus
  source?: ConceptDescriptionTableSource
  [key: string]: unknown
}
