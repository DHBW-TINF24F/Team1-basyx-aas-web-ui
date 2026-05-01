<template>
  <v-container max-width="1400">
    <v-card border rounded="lg">
      <v-card-title class="bg-cardHeader">
        <v-icon icon="mdi-file-import-outline" />
        <span class="ml-3">AASX CD Importer</span>
      </v-card-title>
      <v-divider />
      <v-card-text>
        <!-- Zone 1: File Upload -->
        <v-file-upload
          v-model="aasxFiles"
          :accept="['.aasx']"
          class="mb-4"
          clearable
          :multiple="false"
        />

        <!-- Zone 2: Action Buttons -->
        <div class="d-flex align-center ga-3 mb-4">
          <v-btn
            class="text-buttonText"
            color="primary"
            :disabled="!canScan"
            :loading="phase === 'scanning'"
            prepend-icon="mdi-magnify-scan"
            @click="scanFile"
          >
            Scan for Concept Descriptions
          </v-btn>
          <v-btn
            v-if="phase === 'ready' || phase === 'done'"
            prepend-icon="mdi-refresh"
            variant="text"
            @click="resetModule"
          >
            Reset
          </v-btn>
        </div>

        <!-- Zone 3: Parse Warnings -->
        <v-alert
          v-if="parseWarnings.length > 0"
          border="start"
          class="mb-3"
          density="compact"
          type="warning"
        >
          {{ parseWarnings.length }} warning(s) during parsing.
          <div class="mt-1">
            <div v-for="(w, i) in parseWarnings" :key="i" class="text-caption">{{ w }}</div>
          </div>
        </v-alert>

        <v-alert
          v-if="parseError"
          border="start"
          class="mb-3"
          density="compact"
          type="error"
        >
          {{ parseError }}
        </v-alert>

        <!-- Zone 4: Summary Banner -->
        <v-alert
          v-if="phase === 'ready' || phase === 'done'"
          border="start"
          class="mb-4"
          color="#2b2b2b"
          density="compact"
          type="info"
        >
          Found <strong>{{ cdRows.length }}</strong> importable Concept Description(s):
          <v-chip class="ml-2" color="primary" size="small">{{ cdCount }} from CD section</v-chip>
          <v-chip class="ml-1" color="secondary" size="small">{{ edsCount }} from Submodel EDS</v-chip>
          <v-chip class="ml-1" color="success" size="small">{{ newCount }} NEW</v-chip>
          <v-chip class="ml-1" color="warning" size="small">{{ existsCount }} ALREADY EXISTS</v-chip>
        </v-alert>

        <!-- Zone 5: CD Preview Table -->
        <v-data-table
          v-if="cdRows.length > 0"
          class="border rounded-lg mb-4"
          density="compact"
          :headers="tableHeaders"
          hover
          :items="cdRows"
          :items-per-page="25"
        >

          <template #[`header.selected`]>
            <v-checkbox-btn
              :indeterminate="someSelected"
              :model-value="allSelected"
              @update:model-value="toggleSelectAll"
            />
          </template>

          <template #[`item.selected`]="{ item }">
            <v-checkbox-btn
              v-model="item.selected"
              @click.stop
            />
          </template>

          <template #[`item.source`]="{ item }">
            <v-chip
              :color="item.source === 'cd' ? 'primary' : 'secondary'"
              size="small"
              variant="tonal"
            >
              {{ item.source === 'cd' ? 'CD' : 'EDS' }}
            </v-chip>
          </template>

          <template #[`item.status`]="{ item }">
            <v-chip
              :color="item.status === 'new' ? 'success' : 'warning'"
              size="small"
              variant="tonal"
            >
              {{ item.status === 'new' ? 'NEW' : 'EXISTS' }}
            </v-chip>
          </template>

          <template #[`item.diff`]="{ item }">
            <v-btn
              v-if="item.status === 'exists'"
              color="warning"
              prepend-icon="mdi-compare"
              size="x-small"
              variant="tonal"
              @click.stop="openDiffDialog(item)"
            >
              View Diff
            </v-btn>
          </template>

          <template #[`item.preferredName`]="{ item }">
            <span v-if="item.preferredName" class="text-body-2">{{ item.preferredName }}</span>
            <span v-else class="text-medium-emphasis text-caption font-italic">—</span>
          </template>

          <template #[`item.id`]="{ item }">
            <span class="text-caption text-mono">{{ item.id }}</span>
          </template>
        </v-data-table>

        <!-- Zone 6: Import Button -->
        <v-btn
          v-if="phase === 'ready'"
          block
          class="text-buttonText mb-4"
          color="primary"
          :disabled="!canImport"
          prepend-icon="mdi-upload"
          @click="confirmImport"
        >
          Import {{ selectedRows.length }} Selected Concept Description(s)
        </v-btn>

        <!-- Zone 7: Post-Import Result -->
        <v-alert
          v-if="phase === 'done' && importSummary"
          border="start"
          class="mb-3"
          density="compact"
          :type="importSummary.failed === 0 ? 'success' : 'warning'"
        >
          Imported {{ importSummary.succeeded }}/{{ importSummary.total }} Concept Description(s) successfully.
          <div v-if="importErrors.length > 0" class="mt-2">
            <div v-for="(e, i) in importErrors" :key="i" class="text-caption">{{ e }}</div>
          </div>
        </v-alert>
      </v-card-text>
    </v-card>

    <!-- Confirmation Dialog -->
    <v-dialog v-model="confirmDialogOpen" width="600">
      <v-sheet border rounded="lg">
        <v-card-title class="bg-cardHeader">
          <v-icon class="mr-2" icon="mdi-upload-multiple" />
          Confirm Import
        </v-card-title>
        <v-divider />
        <v-card-text>
          <p>
            You are about to import
            <strong>{{ selectedRows.length }}</strong> Concept Description(s) into the CD Repository:
          </p>
          <ul class="mt-2 ml-4">
            <li class="mb-1">
              <v-chip class="mr-1" color="success" size="x-small">NEW</v-chip>
              {{ selectedRows.filter((r) => r.status === 'new').length }} will be created
            </li>
            <li>
              <v-chip class="mr-1" color="warning" size="x-small">EXISTS</v-chip>
              {{ selectedRows.filter((r) => r.status === 'exists').length }} will be updated (overwritten)
            </li>
          </ul>
          <v-alert
            v-if="selectedRows.some((r) => r.status === 'exists')"
            class="mt-3"
            density="compact"
            type="warning"
          >
            Existing Concept Descriptions will be overwritten with the version from the AASX file.
          </v-alert>
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-spacer />
          <v-btn rounded="lg" @click="confirmDialogOpen = false">Cancel</v-btn>
          <v-btn
            class="text-buttonText"
            color="primary"
            :loading="phase === 'importing'"
            rounded="lg"
            variant="flat"
            @click="executeImport"
          >
            Confirm Import
          </v-btn>
        </v-card-actions>
      </v-sheet>
    </v-dialog>

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
          <template v-if="diffRow">
            <v-alert
              v-if="computeCdDiff(diffRow.json, diffRow.existingJson!).length === 0"
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
                    from AASX
                  </th>
                  <th>
                    <v-chip class="mr-1" color="warning" size="x-small">Existing</v-chip>
                    in Repository
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="diff in computeCdDiff(diffRow.json, diffRow.existingJson!)"
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
              {{ diffRow.selected ? 'importing will overwrite the existing CD with the incoming version.' : 'the existing version will be kept.' }}
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
  import type * as aasCore from '@aas-core-works/aas-core3.1-typescript'
  import { computed, ref, watch } from 'vue'
  import { extractCdsFromAasx } from '@/composables/AAS/AASXImport'
  import { useCDRepositoryClient } from '@/composables/Client/CDRepositoryClient'
  import { useNavigationStore } from '@/store/NavigationStore'

  defineOptions({
    inheritAttrs: false,
    moduleTitle: 'AASX CD Importer',
    isDesktopModule: true,
    isMobileModule: false,
  })

  // --- Stores & Composables ---
  const navigationStore = useNavigationStore()
  const { fetchCdList, postConceptDescription, putConceptDescription } = useCDRepositoryClient()

  // --- Local Types ---
  type JsonRecord = Record<string, unknown>
  type CdStatus = 'new' | 'exists'
  type CdSource = 'cd' | 'eds'
  type Phase = 'idle' | 'scanning' | 'ready' | 'importing' | 'done'
  type CdRow = {
    id: string
    preferredName: string
    status: CdStatus
    source: CdSource
    selected: boolean
    core: aasCore.types.ConceptDescription
    json: JsonRecord
    existingJson: JsonRecord | null
  }
  type ImportSummary = { succeeded: number, failed: number, total: number }
  type DiffEntry = { field: string, incoming: string, existing: string }

  // --- Reactive State ---
  const aasxFiles = ref<File[]>([])
  const phase = ref<Phase>('idle')
  const parseWarnings = ref<string[]>([])
  const parseError = ref<string>('')
  const cdRows = ref<CdRow[]>([])
  const confirmDialogOpen = ref<boolean>(false)
  const diffDialogOpen = ref<boolean>(false)
  const diffRow = ref<CdRow | null>(null)
  const importSummary = ref<ImportSummary | null>(null)
  const importErrors = ref<string[]>([])

  // --- Table Headers ---
  const tableHeaders = [
    { title: '', key: 'selected', sortable: false, width: '48px' },
    { title: 'Source', key: 'source', sortable: true, width: '100px' },
    { title: 'Status', key: 'status', sortable: true, width: '110px' },
    { title: '', key: 'diff', sortable: false, width: '110px' },
    { title: 'Preferred Name', key: 'preferredName', sortable: true },
    { title: 'ID', key: 'id', sortable: true },
  ]

  // --- Computed ---
  const selectedFile = computed<File | null>(() => aasxFiles.value[0] ?? null)

  const canScan = computed<boolean>(
    () => selectedFile.value !== null && phase.value !== 'scanning' && phase.value !== 'importing',
  )

  const selectedRows = computed<CdRow[]>(() => cdRows.value.filter(r => r.selected))

  const canImport = computed<boolean>(() => phase.value === 'ready' && selectedRows.value.length > 0)

  const newCount = computed<number>(() => cdRows.value.filter(r => r.status === 'new').length)

  const existsCount = computed<number>(() => cdRows.value.filter(r => r.status === 'exists').length)

  const cdCount = computed<number>(() => cdRows.value.filter(r => r.source === 'cd').length)

  const edsCount = computed<number>(() => cdRows.value.filter(r => r.source === 'eds').length)

  const allSelected = computed<boolean>(
    () => cdRows.value.length > 0 && cdRows.value.every(r => r.selected),
  )

  const someSelected = computed<boolean>(
    () => cdRows.value.some(r => r.selected) && !allSelected.value,
  )

  // --- Helpers ---
  function extractPreferredName (json: JsonRecord): string {
    try {
      const eds = json.embeddedDataSpecifications
      if (!Array.isArray(eds) || eds.length === 0) return ''
      const content = (eds[0] as any)?.dataSpecificationContent
      if (!content) return ''
      const preferredNames: any[] = Array.isArray(content.preferredName) ? content.preferredName : []
      if (preferredNames.length === 0) return ''
      const en = preferredNames.find((p: any) => String(p.language ?? '').toLowerCase().startsWith('en'))
      return String((en ?? preferredNames[0])?.text ?? '')
    } catch {
      return ''
    }
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

    const getContent = (json: JsonRecord): JsonRecord | null => {
      const eds = Array.isArray(json.embeddedDataSpecifications) ? json.embeddedDataSpecifications : []
      if (eds.length === 0) return null
      return (eds[0] as any)?.dataSpecificationContent ?? null
    }

    const inContent = getContent(incoming)
    const exContent = getContent(existing)

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

  // --- Core Functions ---
  async function scanFile (): Promise<void> {
    if (!selectedFile.value) return

    phase.value = 'scanning'
    parseWarnings.value = []
    parseError.value = ''
    cdRows.value = []
    importSummary.value = null
    importErrors.value = []

    try {
      // Step 1: Extract CDs from the AASX package
      const { cdById, warnings } = await extractCdsFromAasx(selectedFile.value)
      parseWarnings.value = warnings

      if (cdById.size === 0) {
        parseError.value = 'No Concept Descriptions found in the selected AASX file.'
        phase.value = 'idle'
        return
      }

      // Step 2: Fetch existing CDs from the repository
      const existingById = new Map<string, JsonRecord>()
      try {
        const existingCds: any[] = await fetchCdList()
        for (const cd of existingCds) {
          const id = String(cd?.id ?? '').trim()
          if (id !== '') existingById.set(id, cd as JsonRecord)
        }
      } catch {
        parseWarnings.value.push(
          'Could not fetch existing CDs from repository — all extracted CDs will be treated as NEW.',
        )
      }

      // Step 3: Build table rows with status, source and existing data
      cdRows.value = Array.from(cdById.entries()).map(([id, { core, json, source }]) => ({
        id,
        preferredName: extractPreferredName(json),
        status: existingById.has(id) ? 'exists' : 'new',
        source,
        selected: true,
        core,
        json,
        existingJson: existingById.get(id) ?? null,
      }))

      phase.value = 'ready'
    } catch (error) {
      parseError.value
        = error instanceof Error ? error.message : 'Unknown error while parsing the AASX file.'
      phase.value = 'idle'
      navigationStore.dispatchSnackbar({
        status: true,
        timeout: 7000,
        color: 'error',
        btnColor: 'buttonText',
        text: 'Failed to scan AASX file',
        extendedError: parseError.value,
      })
    }
  }

  function openDiffDialog (row: CdRow): void {
    diffRow.value = row
    diffDialogOpen.value = true
  }

  function confirmImport (): void {
    if (!canImport.value) return
    confirmDialogOpen.value = true
  }

  async function executeImport (): Promise<void> {
    confirmDialogOpen.value = false
    phase.value = 'importing'
    importErrors.value = []

    let succeeded = 0
    let failed = 0
    const toImport = selectedRows.value

    for (const row of toImport) {
      try {
        if (row.status === 'new') {
          const ok = await postConceptDescription(row.core)
          if (ok) {
            succeeded++
          } else {
            // Fallback: CD may have appeared in repo between scan and import
            const putOk = await putConceptDescription(row.core)
            if (putOk) {
              succeeded++
            } else {
              failed++
              importErrors.value.push(`Failed to create CD: ${row.id}`)
            }
          }
        } else {
          const ok = await putConceptDescription(row.core)
          if (ok) {
            succeeded++
          } else {
            failed++
            importErrors.value.push(`Failed to update CD: ${row.id}`)
          }
        }
      } catch (error) {
        failed++
        importErrors.value.push(
          `Error for CD '${row.id}': ${error instanceof Error ? error.message : String(error)}`,
        )
      }
    }

    importSummary.value = { succeeded, failed, total: toImport.length }
    phase.value = 'done'

    navigationStore.dispatchSnackbar({
      status: true,
      timeout: 8000,
      color: failed === 0 ? 'success' : 'warning',
      btnColor: 'buttonText',
      text: `Import complete: ${succeeded}/${toImport.length} Concept Description(s) imported successfully`,
      extendedError: failed > 0 ? importErrors.value.join('\n') : undefined,
    })
  }

  function toggleSelectAll (value: boolean): void {
    for (const r of cdRows.value) (r.selected = value)
  }

  function resetModule (): void {
    aasxFiles.value = []
    cdRows.value = []
    phase.value = 'idle'
    parseWarnings.value = []
    parseError.value = ''
    importSummary.value = null
    importErrors.value = []
    diffDialogOpen.value = false
    diffRow.value = null
  }

  // --- Watchers ---
  watch(selectedFile, () => {
    if (phase.value === 'ready' || phase.value === 'done') {
      cdRows.value = []
      phase.value = 'idle'
      parseWarnings.value = []
      parseError.value = ''
      importSummary.value = null
      importErrors.value = []
      diffDialogOpen.value = false
      diffRow.value = null
    }
  })
</script>
