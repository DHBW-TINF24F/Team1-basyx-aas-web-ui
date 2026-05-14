<template>
  <v-container max-width="1200">
    <v-card>
      <v-card-title align="center">IEC Importer</v-card-title>
      <v-card-subtitle class="text-center pb-2">Import local Excel files (multiple selection supported)</v-card-subtitle>
      <v-divider />
      <v-card-text>
        <!-- Tutorial: How to export Excel files from IEC CDD -->
        <v-expansion-panels class="mb-3">
          <v-expansion-panel>
            <v-expansion-panel-title>
              <template #default="{ expanded }">
                <div class="d-flex align-center">
                  <v-icon class="mr-2" icon="mdi-help-circle-outline" />
                  <span>How to export Excel files of a property or class from IEC CDD</span>
                </div>
                <v-spacer />
              </template>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-alert class="mb-3" density="compact" type="success" variant="tonal">
                <strong>No account required:</strong> the IEC CDD lets you browse and
                export Excel files directly — there is no login, sign-up or paywall
                for the steps below.
              </v-alert>
              <ol class="tutorial-list">
                <li class="mb-2">
                  Open the IEC Common Data Dictionary at
                  <a href="https://cdd.iec.ch" rel="noopener" target="_blank">cdd.iec.ch</a>.
                  Use the tree navigation on the left or the search bar at the top
                  right to locate the desired <strong>class</strong> or
                  <strong>property</strong>, then click it to open the detail view.
                  You should see the metadata table (<code>code</code>,
                  <code>preferred name</code>, <code>definition</code>,
                  <code>primary unit</code>, <code>data type</code>, …) and four
                  orange action buttons above it.
                </li>
                <li class="mb-2">
                  Click the orange <strong>Export</strong> button in the toolbar
                  above the metadata table.
                  <div class="tutorial-figure my-2">
                    <img
                      alt="IEC CDD detail view with Export button highlighted"
                      class="tutorial-img"
                      src="@/assets/Tutorials/IecCdd/01-detail-view.png"
                    >
                  </div>
                </li>
                <li class="mb-2">
                  In the dropdown that appears, choose what to export:
                  <ul class="mt-1">
                    <li><strong>Attributes</strong> — the metadata of the selected class itself.</li>
                    <li><strong>Properties</strong> — all properties of the selected class as rows.</li>
                    <li><strong>All</strong> — attributes and properties combined.</li>
                  </ul>
                  Pick the option that matches what you want to import.
                  <div class="tutorial-figure my-2">
                    <img
                      alt="IEC CDD Export dropdown with Attributes, Properties and All"
                      class="tutorial-img tutorial-img--narrow"
                      src="@/assets/Tutorials/IecCdd/02-export-menu.png"
                    >
                  </div>
                </li>
                <li class="mb-2">
                  A download page opens with the green Excel icon. Click
                  <strong>Download</strong> to save the <code>.xlsx</code> file
                  straight to your downloads folder — no login prompt appears.
                  <div class="tutorial-figure my-2">
                    <img
                      alt="IEC CDD download page with Excel icon and Download link"
                      class="tutorial-img"
                      src="@/assets/Tutorials/IecCdd/03-download-page.png"
                    >
                  </div>
                </li>
                <li>
                  Come back here, click <em>Upload files</em> below and select the
                  downloaded Excel file (or several files at once) to import.
                </li>
              </ol>
              <v-alert class="mt-3" density="compact" type="info" variant="tonal">
                <strong>Tip:</strong> The importer auto-detects the IEC-CDD header row
                (e.g. <code>#property_name</code>, <code>code</code>, <code>preferredname</code>,
                <code>primaryunit</code>, <code>data_type</code>). Custom Excel layouts that
                do not contain these columns will not be recognised as IEC-CDD properties.
              </v-alert>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <!-- Info Alerts -->
        <v-alert class="mb-3" density="compact" type="info" variant="tonal">
          The IEC Importer only supports import via file upload. Download IEC-CDD datasets as Excel files and
          upload them here. You can select multiple files at once.
        </v-alert>

        <v-alert class="mb-3" density="compact" type="info" variant="tonal">
          Supported formats: XLSX/XLS (Excel), as well as JSON, XML, CSV and YAML.
        </v-alert>

        <!-- File Upload Button -->
        <v-btn
          block
          class="mb-3"
          color="primary"
          :loading="datasetLoading"
          prepend-icon="mdi-file-upload"
          size="large"
          variant="flat"
          @click="triggerFileInput"
        >Upload files</v-btn>
        <input
          ref="fileInputRef"
          accept=".xml,.json,.csv,.yaml,.yml,.xlsx,.xls"
          multiple
          style="display: none"
          type="file"
          @change="handleFileUpload"
        >

        <!-- Format Detection -->
        <v-alert
          v-if="importedDatasetFormat !== ''"
          class="mb-3"
          density="compact"
          type="success"
          variant="tonal"
        >
          Detected formats: {{ importedDatasetFormat }}
        </v-alert>

        <!-- Validation Feedback -->
        <v-alert
          v-if="validationResult && validationResult.isValid"
          class="mb-3"
          density="compact"
          type="success"
          variant="tonal"
        >
          {{ validationResult.properties.length }} IEC-CDD properties found
        </v-alert>

        <v-alert
          v-if="validationResult && !validationResult.isValid"
          class="mb-3"
          density="compact"
          type="warning"
          variant="tonal"
        >
          The data does not match the IEC-CDD format.
          <ul v-if="validationResult.errors.length > 0" class="mt-1">
            <li v-for="(err, i) in validationResult.errors" :key="i">{{ err }}</li>
          </ul>
        </v-alert>

        <v-alert
          v-if="validationResult && validationResult.warnings.length > 0"
          class="mb-3"
          density="compact"
          type="info"
          variant="tonal"
        >
          <strong>Warnings:</strong>
          <ul class="mt-1">
            <li v-for="(warn, i) in validationResult.warnings" :key="i">{{ warn }}</li>
          </ul>
        </v-alert>

        <!-- Structured Properties Table -->
        <ConceptDescriptionTableView
          v-if="validationResult && validationResult.isValid"
          class="mb-3"
          :rows="conceptDescriptionRows"
          :show-source="false"
          @view-diff="openDiffDialog"
        />

        <!-- Save to CD Repository -->
        <v-btn
          v-if="validationResult && validationResult.isValid"
          block
          class="mb-3"
          color="success"
          :loading="savingCds"
          prepend-icon="mdi-content-save"
          size="large"
          variant="flat"
          @click="saveAsConceptDescriptions"
        >Save as Concept Descriptions</v-btn>

        <!-- Save Result -->
        <v-alert
          v-if="saveResultMessage !== ''"
          class="mb-3"
          density="compact"
          :type="saveResultType"
          variant="tonal"
        >
          {{ saveResultMessage }}
        </v-alert>

        <!-- Download Buttons -->
        <v-row v-if="importedDatasetJsonPreview !== ''" class="mb-3">
          <v-col cols="12" md="6">
            <v-btn block color="primary" variant="outlined" @click="downloadImportedDatasetJson">Download JSON</v-btn>
          </v-col>
          <v-col v-if="validationResult && validationResult.isValid" cols="12" md="6">
            <v-btn block color="primary" variant="outlined" @click="downloadPropertiesCsv">Download Properties as CSV</v-btn>
          </v-col>
        </v-row>

        <!-- Raw JSON Fallback (collapsible) -->
        <v-expansion-panels v-if="importedDatasetJsonPreview !== ''" class="mb-2">
          <v-expansion-panel title="Raw JSON Preview">
            <v-expansion-panel-text>
              <v-textarea
                v-model="importedDatasetJsonPreview"
                auto-grow
                readonly
                rows="12"
                variant="outlined"
              />
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-card-text>
    </v-card>

    <!-- Diff Dialog -->
    <v-dialog v-model="diffDialogOpen" width="800">
      <v-sheet border rounded="lg">
        <v-card-title class="bg-cardHeader">
          <v-icon class="mr-2" icon="mdi-compare" />
          Compare Concept Descriptions
        </v-card-title>
        <v-divider />
        <v-card-text>
          <p class="text-caption text-medium-emphasis mb-3">
            <strong>ID:</strong> {{ diffRow?.id }}
          </p>
          <template v-if="diffRow && diffRow.existingJson">
            <v-alert
              v-if="computeCdDiff(diffRow.json, diffRow.existingJson).length === 0"
              class="mb-3"
              density="compact"
              type="success"
            >
              No differences found. The incoming CD is identical to the existing one.
            </v-alert>

            <v-table v-else class="border rounded mb-3" density="compact">
              <thead>
                <tr>
                  <th style="width:160px">Field</th>
                  <th>
                    <v-chip class="mr-1" color="primary" size="x-small">Incoming</v-chip>
                    from IEC file
                  </th>
                  <th>
                    <v-chip class="mr-1" color="warning" size="x-small">Existing</v-chip>
                    in Repository
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="diff in computeCdDiff(diffRow.json, diffRow.existingJson)"
                  :key="diff.field"
                >
                  <td class="text-caption font-weight-bold">{{ diff.field }}</td>
                  <td class="text-caption text-success">
                    <pre style="white-space: pre-wrap; word-break: break-all">{{ diff.incoming }}</pre>
                  </td>
                  <td class="text-caption text-warning">
                    <pre style="white-space: pre-wrap; word-break: break-all">{{ diff.existing }}</pre>
                  </td>
                </tr>
              </tbody>
            </v-table>

            <v-alert density="compact" type="info">
              The row is currently
              <strong>{{ diffRow.selected ? 'selected' : 'deselected' }}</strong> —
              {{ diffRow.selected ? 'saving will overwrite the existing CD with the incoming version.' : 'the existing version will be kept.' }}
              Toggle the checkbox in the table to change your selection.
            </v-alert>
          </template>
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-spacer />
          <v-btn rounded="lg" @click="diffDialogOpen = false">Close</v-btn>
        </v-card-actions>
      </v-sheet>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
  import type { ConceptDescriptionTableRow } from '@/types/ConceptDescriptionTable'
  import type { IecCddProperty, IecCddValidationResult } from '@/types/IecCdd'
  import { jsonization } from '@aas-core-works/aas-core3.1-typescript'
  import { ref } from 'vue'
  import ConceptDescriptionTableView from '@/components/UIComponents/ConceptDescriptionTableView.vue'
  import { useCDRepositoryClient } from '@/composables/Client/CDRepositoryClient'
  import { useIecFileImport } from '@/composables/IecFileImport'
  import { useInfrastructureStore } from '@/store/InfrastructureStore'
  import { useNavigationStore } from '@/store/NavigationStore'

  defineOptions({
    moduleTitle: 'IEC Importer',
  })

  const navigationStore = useNavigationStore()
  const infrastructureStore = useInfrastructureStore()
  const { importFileContent } = useIecFileImport()
  const { fetchCdList, postConceptDescription, putConceptDescription } = useCDRepositoryClient()

  type JsonRecord = Record<string, unknown>
  type IecCdRow = ConceptDescriptionTableRow & {
    property: IecCddProperty
    json: JsonRecord
    existingJson: JsonRecord | null
  }
  type DiffEntry = { field: string, incoming: string, existing: string }

  const datasetLoading = ref<boolean>(false)
  const savingCds = ref<boolean>(false)
  const importedDatasetJsonPreview = ref<string>('')
  const importedDatasetFormat = ref<string>('')
  const validationResult = ref<IecCddValidationResult | null>(null)
  const fileInputRef = ref<HTMLInputElement | null>(null)
  const saveResultMessage = ref<string>('')
  const saveResultType = ref<'success' | 'error' | 'info'>('success')
  const conceptDescriptionRows = ref<IecCdRow[]>([])
  const diffDialogOpen = ref<boolean>(false)
  const diffRow = ref<IecCdRow | null>(null)

  function triggerFileInput (): void {
    fileInputRef.value?.click()
  }

  async function handleFileUpload (event: Event): Promise<void> {
    const input = event.target as HTMLInputElement
    const files = input.files
    if (!files || files.length === 0) return

    datasetLoading.value = true
    conceptDescriptionRows.value = []
    const allProperties: IecCddProperty[] = []
    const allResults: Array<{ metadata: { detectedFormat: string }, payload: unknown, validation: IecCddValidationResult }> = []
    const formats = new Set<string>()
    const failedFiles: string[] = []
    const warnings: string[] = []

    try {
      for (const file of Array.from(files)) {
        const result = await importFileContent(file)
        if (!result.success || !result.data) {
          failedFiles.push(file.name)
          continue
        }
        formats.add(result.data.metadata.detectedFormat.toUpperCase())
        allResults.push(result.data)
        if (result.data.validation.isValid) {
          allProperties.push(...result.data.validation.properties)
        }
        if (result.data.validation.warnings.length > 0) {
          warnings.push(...result.data.validation.warnings.map(w => `${file.name}: ${w}`))
        }
      }

      importedDatasetFormat.value = Array.from(formats).join(', ')
      importedDatasetJsonPreview.value = JSON.stringify(allResults, null, 2)

      validationResult.value = {
        isValid: allProperties.length > 0,
        properties: allProperties,
        detectedSchema: allResults.length > 0 ? allResults[0].validation.detectedSchema : '',
        errors: failedFiles.map(f => `Import failed: ${f}`),
        warnings,
      }

      const existingById = new Map<string, JsonRecord>()
      if (allProperties.length > 0) {
        try {
          const existingCds = await fetchCdList()
          for (const cd of existingCds) {
            const id = String(cd?.id ?? '').trim()
            if (id !== '') existingById.set(id, cd as JsonRecord)
          }
        } catch {
          warnings.push('Could not fetch existing CDs from repository — all properties will be treated as NEW.')
        }
      }

      conceptDescriptionRows.value = allProperties.map(property => ({
        id: property.irdi,
        irdi: property.irdi,
        preferredName: property.preferredName,
        shortName: property.shortName ?? '',
        definition: property.definition ?? '',
        unit: property.unit ?? '',
        dataType: property.dataType ?? '',
        selected: true,
        status: existingById.has(property.irdi) ? 'exists' : 'new',
        property,
        json: buildConceptDescription(property),
        existingJson: existingById.get(property.irdi) ?? null,
      }))

      const totalProps = allProperties.length
      const successCount = allResults.length
      const failCount = failedFiles.length

      let message = `${successCount} file(s) imported — ${totalProps} IEC-CDD properties found.`
      if (failCount > 0) message += ` ${failCount} file(s) failed.`

      navigationStore.dispatchSnackbar({
        status: true,
        timeout: 5000,
        color: failCount > 0 ? 'warning' : (totalProps > 0 ? 'success' : 'warning'),
        btnColor: 'buttonText',
        text: message,
      })
    } finally {
      datasetLoading.value = false
      input.value = ''
    }
  }

  function normalizeStr (value: string | undefined): string | undefined {
    return value ? value.normalize('NFC') : undefined
  }

  function buildConceptDescription (property: IecCddProperty): Record<string, unknown> {
    const preferredName = [{ language: 'en', text: normalizeStr(property.preferredName) || property.preferredName }]

    const shortName = property.shortName ? [{ language: 'en', text: normalizeStr(property.shortName) }] : null

    const definition = property.definition ? [{ language: 'en', text: normalizeStr(property.definition) }] : null

    const dataSpecificationContent: Record<string, unknown> = {
      modelType: 'DataSpecificationIec61360',
      preferredName,
    }
    if (shortName) dataSpecificationContent.shortName = shortName
    if (property.unit) dataSpecificationContent.unit = normalizeStr(property.unit)
    if (property.sourceOfDefinition) dataSpecificationContent.sourceOfDefinition = normalizeStr(property.sourceOfDefinition)
    if (property.dataType) dataSpecificationContent.dataType = property.dataType
    if (definition) dataSpecificationContent.definition = definition
    if (property.valueFormat) dataSpecificationContent.valueFormat = property.valueFormat

    return {
      modelType: 'ConceptDescription',
      id: property.irdi,
      idShort: normalizeStr(property.shortName || property.preferredName),
      embeddedDataSpecifications: [
        {
          dataSpecification: {
            type: 'ExternalReference',
            keys: [
              {
                type: 'GlobalReference',
                value: 'https://admin-shell.io/DataSpecificationTemplates/DataSpecificationIec61360/3/0',
              },
            ],
          },
          dataSpecificationContent,
        },
      ],
    }
  }

  async function saveAsConceptDescriptions (): Promise<void> {
    if (!validationResult.value || !validationResult.value.isValid) return

    const selectedRows = conceptDescriptionRows.value.filter(row => row.selected)
    if (selectedRows.length === 0) {
      saveResultType.value = 'info'
      saveResultMessage.value = 'No Concept Descriptions selected.'
      return
    }

    const cdRepoUrl = infrastructureStore.getConceptDescriptionRepoURL
    if (!cdRepoUrl || cdRepoUrl.trim() === '') {
      saveResultType.value = 'error'
      saveResultMessage.value = 'Concept Description Repository URL is not configured. Please set it in the infrastructure settings.'
      return
    }

    savingCds.value = true
    saveResultMessage.value = ''
    let created = 0
    let updated = 0
    let failed = 0

    try {
      for (const row of selectedRows) {
        const cdJson = buildConceptDescription(row.property)
        const cdResult = jsonization.conceptDescriptionFromJsonable(cdJson)

        if (cdResult.error !== null) {
          console.warn('Failed to deserialize CD for IRDI', row.property.irdi, cdResult.error)
          failed++
          continue
        }

        const cd = cdResult.mustValue()

        let success
        if (row.status === 'exists') {
          success = await putConceptDescription(cd)
          if (success) updated++
          else failed++
        } else {
          success = await postConceptDescription(cd)
          if (success) created++
          else failed++
        }
      }

      if (failed === 0) {
        saveResultType.value = 'success'
        saveResultMessage.value = `Successfully saved: ${created} created, ${updated} updated.`
      } else {
        saveResultType.value = 'error'
        saveResultMessage.value = `${created} created, ${updated} updated, ${failed} failed.`
      }
    } catch (error) {
      saveResultType.value = 'error'
      saveResultMessage.value = `Error while saving: ${error instanceof Error ? error.message : 'Unknown error'}`
    } finally {
      savingCds.value = false
    }
  }

  function downloadImportedDatasetJson (): void {
    if (importedDatasetJsonPreview.value === '') return
    downloadBlob(importedDatasetJsonPreview.value, 'imported-iec-dataset.json', 'application/json')
  }

  function downloadPropertiesCsv (): void {
    if (!validationResult.value || !validationResult.value.isValid) return

    const headers = ['IRDI', 'PreferredName', 'ShortName', 'Definition', 'Unit', 'DataType', 'ValueFormat', 'SourceOfDefinition']
    const rows = validationResult.value.properties.map(p =>
      [p.irdi, p.preferredName, p.shortName ?? '', p.definition ?? '', p.unit ?? '', p.dataType ?? '', p.valueFormat ?? '', p.sourceOfDefinition ?? '']
        .map(v => `"${v.replace(/"/g, '""')}"`)
        .join(','),
    )
    const csvContent = [headers.join(','), ...rows].join('\n')
    downloadBlob(csvContent, 'iec-cdd-properties.csv', 'text/csv')
  }

  function extractDataSpecificationContent (json: JsonRecord): JsonRecord | null {
    const eds = Array.isArray(json.embeddedDataSpecifications) ? json.embeddedDataSpecifications : []
    if (eds.length === 0) return null
    return ((eds[0] as any)?.dataSpecificationContent ?? null) as JsonRecord | null
  }

  function computeCdDiff (incoming: JsonRecord, existing: JsonRecord): DiffEntry[] {
    const diffs: DiffEntry[] = []

    const stringify = (v: unknown): string => {
      if (v === undefined || v === null) return '—'
      if (typeof v === 'string') return v
      return JSON.stringify(v, null, 2)
    }

    for (const field of ['id', 'category', 'idShort']) {
      const a = stringify(incoming[field])
      const b = stringify(existing[field])
      if (a !== b) diffs.push({ field, incoming: a, existing: b })
    }

    for (const field of ['displayName', 'description']) {
      const a = stringify(incoming[field])
      const b = stringify(existing[field])
      if (a !== b) diffs.push({ field, incoming: a, existing: b })
    }

    const inContent = extractDataSpecificationContent(incoming)
    const exContent = extractDataSpecificationContent(existing)

    for (const field of ['dataType', 'unit', 'symbol', 'sourceOfDefinition', 'valueFormat']) {
      const a = stringify(inContent?.[field])
      const b = stringify(exContent?.[field])
      if (a !== b) diffs.push({ field: `EDS.${field}`, incoming: a, existing: b })
    }

    for (const field of ['preferredName', 'shortName', 'definition']) {
      const a = stringify(inContent?.[field])
      const b = stringify(exContent?.[field])
      if (a !== b) diffs.push({ field: `EDS.${field}`, incoming: a, existing: b })
    }

    return diffs
  }

  function openDiffDialog (row: ConceptDescriptionTableRow): void {
    if (!('json' in row) || !('existingJson' in row)) return
    diffRow.value = row as IecCdRow
    diffDialogOpen.value = true
  }

  function downloadBlob (content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType })
    const objectUrl = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = filename
    document.body.append(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(objectUrl)
  }
</script>

<style scoped>
.tutorial-figure {
  display: flex;
  justify-content: flex-start;
}

.tutorial-img {
  max-width: 100%;
  width: 100%;
  height: auto;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.tutorial-img--narrow {
  max-width: 220px;
  width: auto;
}
</style>
