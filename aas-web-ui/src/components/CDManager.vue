<template>
  <v-container fluid class="pa-0">
    <v-text-field
      v-model="search"
      class="mb-4"
      density="compact"
      hide-details
      label="Type to search for specific ConceptDescriptions..."
      variant="outlined"
    />
    <v-data-table
      class="cd-list-table"
      v-model:expanded="expandedRows"
      :headers="headers"
      :items="filteredData"
      item-value="id"
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
              variant="text"
              size="small"
              @click.stop
            />
          </template>
          <v-list>
            <v-list-item @click="toggleRowExpansion(item.id)">
              <template #prepend>
                <v-icon>{{ isRowExpanded(item.id) ? 'mdi-eye-off' : 'mdi-eye' }}</v-icon>
              </template>
              <v-list-item-title>{{ isRowExpanded(item.id) ? 'Collapse' : 'Expand' }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </template>

      <template #expanded-row="{ columns, item }">
        <tr>
          <td :colspan="columns.length" class="px-0 py-0">
            <v-card flat class="pa-4 bg-surface">
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
  </v-container>
</template>

<script lang="ts" setup>
import { onMounted, ref, computed } from 'vue';
import { useCDRepositoryClient } from '@/composables/Client/CDRepositoryClient';


  const cdRepoClient = useCDRepositoryClient()
  const cdData = ref<any[]>([])
  const search = ref('')
  const expandedRows = ref<string[]>([])

  const headers = [
		{ title: 'ID Short', key: 'idShort', width: '1fr' },
		{ title: 'Unit', key: 'unit', width: '1fr' },
		{ title: 'Definition', key: 'definition', width: '5fr' },
    { title: 'ID', key: 'id', width: '2fr' },
    { title: '', key: 'actions', width: '48px', sortable: false },
	]

	onMounted(async () => {
		cdData.value = await cdRepoClient.fetchCdList()
	})

	const displayData = computed(() => {
		return cdData.value.map(item => ({
			...item,
			unit: getUnit(item),
			definition: getDefinition(item)
		}))
	})

  const filteredData = computed(() => {
    const query = search.value.trim().toLowerCase()

    if (!query) {
      return displayData.value
    }

    return displayData.value.filter((item) => {
      return [item.idShort, item.unit, item.definition, item.id]
        .filter((value) => value !== undefined && value !== null)
        .some((value) => String(value).toLowerCase().includes(query))
    })
  })

	function getUnit(item: any): string {
		for (const embeddedSpec in item.embeddedDataSpecifications) {
      const spec = item.embeddedDataSpecifications[embeddedSpec]
      if (spec.dataSpecificationContent && spec.dataSpecificationContent.unit) {
        return spec.dataSpecificationContent.unit
      }
    }
		return ''
	}

	function getDefinition(item: any): string {
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

    if (index === -1) {
      expandedRows.value = [itemId]
      return
    }

    expandedRows.value = expandedRows.value.filter((expandedId) => expandedId !== itemId)
  }

  function getRowProps ({ item }: { item: any }): Record<string, any> {
    return {
      class: [
        'cursor-pointer',
        isRowExpanded(item.id) ? 'expanded-row-highlight' : ''
      ],
    }
  }

  function isRowExpanded(itemId: string): boolean {
    return expandedRows.value.includes(itemId)
  }

  function toggleRowExpansion(itemId: string): void {
    const index = expandedRows.value.indexOf(itemId)
    if (index === -1) {
      expandedRows.value = [itemId]
    } else {
      expandedRows.value = expandedRows.value.filter((id) => id !== itemId)
    }
  }

  function truncateText(value: unknown, maxLength = 40): string {
    if (value === undefined || value === null) {
      return '—'
    }

    const text = String(value)
    if (text.length <= maxLength) {
      return text
    }

    return `${text.slice(0, maxLength - 1)}…`
  }


</script>

<style scoped>
.cd-list-table {
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
</style>