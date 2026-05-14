<template>
  <v-container class="pa-0" fluid>
    <v-btn
      rounded="lg"
      text="Import CDs from JSON"
      variant="flat"
      @click="setView('jsonImport', true, undefined)"
    />
    <v-btn
      rounded="lg"
      text="Import CDs from AASX"
      variant="flat"
      @click="setView('aasxImport', true, undefined)"
    />
    <v-btn
      rounded="lg"
      text="Import CDs from IEC CDD"
      variant="flat"
      @click="setView('iecImport', true, undefined)"
    />

    <v-toolbar class="cd-pagination-toolbar mb-2" color="transparent" density="compact" flat>
      <v-btn
        class="cd-pagination-button"
        :disabled="!canGoPrevious"
        :loading="isLoadingPage"
        prepend-icon="mdi-chevron-left"
        variant="text"
        @click="goToPreviousPage"
      >
        Previous
      </v-btn>

      <v-spacer />

      <div class="text-caption text-medium-emphasis">
        Page {{ currentPageNumber }}
      </div>

      <v-spacer />

      <v-btn
        append-icon="mdi-chevron-right"
        class="cd-pagination-button"
        :disabled="!canGoNext"
        :loading="isLoadingPage"
        variant="text"
        @click="goToNextPage"
      >
        Next
      </v-btn>
    </v-toolbar>
    <v-data-table
      v-model:expanded="expandedRows"
      class="cd-list-table"
      :headers="headers"
      hide-default-footer
      item-value="id"
      :items="displayData"
      :items-per-page="-1"
      :row-props="getRowProps"
      @click:row="handleRowClick"
    >
      <template #[`item.idShort`]="{ item }">
        <span class="text-truncate d-inline-block cd-preview">{{ truncateText(item.idShort) }}</span>
      </template>

      <template #[`item.unit`]="{ item }">
        <span class="text-truncate d-inline-block cd-preview">{{ truncateText(item.unit) }}</span>
      </template>

      <template #[`item.definition`]="{ item }">
        <span class="text-truncate d-inline-block cd-preview">{{ truncateText(item.definition, 120) }}</span>
      </template>

      <template #[`item.id`]="{ item }">
        <span class="text-truncate d-inline-block cd-preview">{{ truncateText(item.id, 80) }}</span>
      </template>

      <template #[`item.actions`]="{ item }">
        <v-menu>
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              icon="mdi-dots-vertical"
              size="small"
              variant="text"
              @click.stop
            />
          </template>
          <v-list>
            <v-list-item @click="setView('detail', true, item)">
              <template #prepend>
                <v-icon>{{ 'mdi-file-search-outline' }}</v-icon>
              </template>
              <v-list-item-title>{{ 'View' }}</v-list-item-title>
            </v-list-item>
            <v-list-item @click="toggleRowExpansion(item.id)">
              <template #prepend>
                <v-icon>{{ isRowExpanded(item.id) ? 'mdi-eye-off' : 'mdi-eye' }}</v-icon>
              </template>
              <v-list-item-title>{{ isRowExpanded(item.id) ? 'Collapse' : 'Expand' }}</v-list-item-title>
            </v-list-item>
            <v-list-item @click="setView('edit', true, item)">
              <template #prepend>
                <v-icon>{{ 'mdi-pencil' }}</v-icon>
              </template>
              <v-list-item-title>{{ 'Edit' }}</v-list-item-title>
            </v-list-item>
            <v-list-item @click="setView('download', true, item)">
              <template #prepend>
                <v-icon>{{ 'mdi-download' }}</v-icon>
              </template>
              <v-list-item-title>{{ 'Download JSON' }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </template>

      <template #expanded-row="{ columns, item }">
        <tr>
          <td class="px-0 py-0" :colspan="columns.length">
            <v-card class="pa-4 bg-surface" flat>
              <v-row dense>
                <v-col cols="12" md="6">
                  <div class="text-caption text-medium-emphasis">ID Short</div>
                  <div class="text-body-2 text-break">{{ item.idShort || '—' }}</div>
                </v-col>
                <v-col cols="12" md="6">
                  <div class="text-caption text-medium-emphasis">Unit</div>
                  <div class="text-body-2 text-break">{{ item.unit || '—' }}</div>
                </v-col>
                <v-col cols="12">
                  <div class="text-caption text-medium-emphasis">Definition</div>
                  <div class="text-body-2 text-break">{{ item.definition || '—' }}</div>
                </v-col>
                <v-col cols="12">
                  <div class="text-caption text-medium-emphasis">ID</div>
                  <div class="text-body-2 text-break">{{ item.id || '—' }}</div>
                </v-col>
              </v-row>
            </v-card>
          </td>
        </tr>
      </template>
    </v-data-table>
    <v-toolbar class="cd-pagination-toolbar-bottom mt-2" color="transparent" density="compact" flat>
      <v-btn
        class="cd-pagination-button"
        :disabled="!canGoPrevious"
        :loading="isLoadingPage"
        prepend-icon="mdi-chevron-left"
        variant="text"
        @click="goToPreviousPage"
      >
        Previous
      </v-btn>

      <v-spacer />

      <div class="text-caption text-medium-emphasis">
        Page {{ currentPageNumber }}
      </div>

      <v-spacer />

      <v-btn
        append-icon="mdi-chevron-right"
        class="cd-pagination-button"
        :disabled="!canGoNext"
        :loading="isLoadingPage"
        variant="text"
        @click="goToNextPage"
      >
        Next
      </v-btn>
    </v-toolbar>

    <c-d-editor-view :dialog-open="views.edit" @close-dialog="setView('edit', false, undefined)" @update:confirm="reloadUpdatedCD" />
    <c-d-detail-view :dialog-open="views.detail" @close-dialog="setView('detail', false, undefined)" />
    <c-d-json-exporter :dialog-open="views.download" @close-dialog="setView('download', false, undefined)" />
    <c-d-json-importer :dialog-open="views.jsonImport" @close-dialog="setView('jsonImport', false, undefined)" />
    <aasx-cd-importer-view :dialog-open="views.aasxImport" @close-dialog="setView('aasxImport', false, undefined)" />
    <iec-importer-view :dialog-open="views.iecImport" @close-dialog="setView('iecImport', false, undefined)" />
  </v-container></template>

<script lang="ts" setup>
  import { jsonization } from '@aas-core-works/aas-core3.1-typescript'
  import { computed, onMounted, ref } from 'vue'
  import { useCDRepositoryClient } from '@/composables/Client/CDRepositoryClient'
  import { useCDStore } from '@/store/ConceptDescriptionStore'
  import CDDetailView from './CDDetailView.vue'
  import CDEditorView from './CDEditorView.vue'
  import CDJsonExporter from './ConceptDescriptionElements/CDJsonExporter.vue'
  import CDJsonImporter from './ConceptDescriptionElements/CDJsonImporter.vue'
  import IecImporterView from './ConceptDescriptionElements/IecImporterView.vue'

  const { dispatchSelectedCD } = useCDStore()
  const cdRepoClient = useCDRepositoryClient()
  const cdData = ref<any[]>([])
  const nextCursor = ref<string | null>(null)
  const previousCursors = ref<Array<string | null>>([])
  const currentRequestCursor = ref<string | null>(null)
  const isLoadingPage = ref(false)

  const expandedRows = ref<string[]>([])

  const headers = [
    { title: 'ID Short', key: 'idShort', width: '1fr', sortable: false },
    { title: 'Unit', key: 'unit', width: '1fr', sortable: false },
    { title: 'Definition', key: 'definition', width: '5fr', sortable: false },
    { title: 'ID', key: 'id', width: '2fr', sortable: false },
    { title: '', key: 'actions', width: '48px', sortable: false },
  ]

  const currentPageNumber = computed(() => previousCursors.value.length + 1)

  const canGoPrevious = computed(() => previousCursors.value.length > 0 && !isLoadingPage.value)

  const canGoNext = computed(() => Boolean(nextCursor.value) && !isLoadingPage.value)

  const views = reactive<any>({
    edit: false,
    detail: false,
    download: false,
    jsonImport: false,
    aasxImport: false,
    iecImport: false,
  })

  onMounted(async () => {
    await loadPage(null)
  })

  const displayData = computed(() => {
    return cdData.value.map(item => ({
      ...item,
      unit: getUnit(item),
      definition: getDefinition(item),
    }))
  })

  async function loadPage (cursor: string | null): Promise<boolean> {
    isLoadingPage.value = true

    const queryParams = cursor ? [{ key: 'cursor', value: cursor }] : undefined
    const response = await cdRepoClient.fetchCdPage(queryParams)

    if (!response.success) {
      isLoadingPage.value = false
      return false
    }

    cdData.value = response.items
    nextCursor.value = response.cursor
    currentRequestCursor.value = cursor
    isLoadingPage.value = false
    return true
  }

  async function goToNextPage (): Promise<void> {
    if (!nextCursor.value || isLoadingPage.value) {
      return
    }

    const previousCursor = currentRequestCursor.value
    const targetCursor = nextCursor.value

    if (!await loadPage(targetCursor)) {
      return
    }

    previousCursors.value = [...previousCursors.value, previousCursor]
  }

  async function goToPreviousPage (): Promise<void> {
    if (previousCursors.value.length === 0 || isLoadingPage.value) {
      return
    }

    const targetCursor = previousCursors.value.at(-1)

    if (!await loadPage(targetCursor)) {
      return
    }

    previousCursors.value = previousCursors.value.slice(0, -1)
  }

  function getUnit (item: any): string {
    for (const embeddedSpec in item.embeddedDataSpecifications) {
      const spec = item.embeddedDataSpecifications[embeddedSpec]
      if (spec.dataSpecificationContent && spec.dataSpecificationContent.unit) {
        return spec.dataSpecificationContent.unit
      }
    }
    return ''
  }

  function getDefinition (item: any): string {
    for (const embeddedSpec in item.embeddedDataSpecifications) {
      const spec = item.embeddedDataSpecifications[embeddedSpec]
      if (spec.dataSpecificationContent && spec.dataSpecificationContent.definition) {
        const definitions = spec.dataSpecificationContent.definition

        if (!Array.isArray(definitions)) return ''

        const enDef = definitions.find((def: any) => def.language === 'en')
        if (enDef?.text) {
          return enDef.text
        }

        if (definitions.length > 0 && definitions[0]?.text) {
          return definitions[0].text
        }
      }
    }
    return ''
  }

  function handleRowClick (_event: MouseEvent, { item }: { item: any }): void {
    const itemId = item.id
    const index = expandedRows.value.indexOf(itemId)

    dispatchSelectedCD(item)
    if (index === -1) {
      expandedRows.value = [itemId]
      return
    }

    expandedRows.value = expandedRows.value.filter(expandedId => expandedId !== itemId)
  }

  function getRowProps ({ item }: { item: any }): Record<string, any> {
    return {
      class: [
        'cursor-pointer',
        isRowExpanded(item.id) ? 'expanded-row-highlight' : '',
      ],
    }
  }

  function isRowExpanded (itemId: string): boolean {
    return expandedRows.value.includes(itemId)
  }

  function toggleRowExpansion (itemId: string): void {
    const index = expandedRows.value.indexOf(itemId)
    expandedRows.value = index === -1 ? [itemId] : expandedRows.value.filter(id => id !== itemId)
  }

  function truncateText (value: unknown, maxLength = 40): string {
    if (value === undefined || value === null) {
      return '—'
    }

    const text = String(value)
    if (text.length <= maxLength) {
      return text
    }

    return `${text.slice(0, maxLength - 1)}…`
  }

  function setView (viewName: string, state: boolean, item: any | undefined) {
    if (item!) {
      const cd = jsonization.conceptDescriptionFromJsonable(item)
      dispatchSelectedCD(cd.value)
    }
    if (views && viewName && viewName in views) {
      views[viewName] = state
    }
  }

  async function reloadUpdatedCD (id: string) {
    const oldCd = cdData.value.find(cd => cd.id === id)
    if (oldCd) {
      const res = await cdRepoClient.fetchCdById(id)
      if (!res) {
        return
      }
      const index = cdData.value.indexOf(oldCd)
      cdData.value[index] = res
    }
  }
</script>

<style scoped>
.cd-pagination-toolbar {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-bottom: 0;
  padding-inline: 8px;
}

.cd-pagination-toolbar-bottom {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-top: 0;
  padding-inline: 8px;
}

.cd-pagination-button {
  min-width: 110px;
}

.cd-list-table {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  width: 100%;
}

.cd-list-table :deep(.v-table__wrapper) {
  overflow-y: visible;
}

.cd-list-table :deep(table) {
  table-layout: fixed;
}

.cd-preview {
  max-width: 100%;
  vertical-align: bottom;
}

.cd-list-table :deep([data-test="data-table-select"]),
.cd-list-table :deep(td:last-child) {
  padding: 0 4px !important;
}

.cd-list-table :deep(.expanded-row-highlight) {
  background-color: rgba(var(--v-theme-primary), 0.08) !important;
}

.import-buttons {
  display: flex;
}
</style>
