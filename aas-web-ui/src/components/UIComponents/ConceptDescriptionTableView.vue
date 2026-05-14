<template>
  <v-card v-if="rows.length >= 0" variant="outlined">
    <v-card-title class="text-subtitle-1">{{ title }}</v-card-title>
    <v-card-text>
      <v-text-field
        v-model="tableSearch"
        class="mb-2"
        clearable
        density="compact"
        label="Search properties..."
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
      />
      <v-data-table
        density="compact"
        :headers="tableHeaders"
        :items="rows"
        :search="tableSearch"
        :items-per-page="itemsPerPage"
      >
        <template v-if="selectable" #[`header.selected`]>
          <v-checkbox-btn
            :indeterminate="someSelected"
            :model-value="allSelected"
            @update:model-value="toggleSelectAll"
          />
        </template>

        <template v-if="selectable" #[`item.selected`]="{ item }">
          <v-checkbox-btn v-model="item.selected" @click.stop />
        </template>

        <template v-if="showSource" #[`item.source`]="{ item }">
          <v-chip
            :color="item.source === 'cd' ? 'primary' : 'secondary'"
            size="small"
            variant="tonal"
          >
            {{ item.source === 'cd' ? 'CD' : 'EDS' }}
          </v-chip>
        </template>

        <template v-if="showStatus" #[`item.status`]="{ item }">
          <v-chip
            :color="item.status === 'new' ? 'success' : 'warning'"
            size="small"
            variant="tonal"
          >
            {{ item.status === 'new' ? 'NEW' : 'EXISTS' }}
          </v-chip>
        </template>

        <template v-if="showDiff" #[`item.diff`]="{ item }">
          <v-btn
            v-if="item.status === 'exists'"
            color="warning"
            prepend-icon="mdi-compare"
            size="x-small"
            variant="tonal"
            @click.stop="emit('view-diff', item)"
          >
            View Diff
          </v-btn>
        </template>

        <template #[`item.irdi`]="{ item }">
          <span class="text-caption text-mono">{{ item.irdi }}</span>
        </template>
      </v-data-table>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'
  import type { ConceptDescriptionTableRow } from '@/types/ConceptDescriptionTable'

  const props = withDefaults(defineProps<{
    rows: ConceptDescriptionTableRow[]
    title?: string
    selectable?: boolean
    showSource?: boolean
    showStatus?: boolean
    showDiff?: boolean
    itemsPerPage?: number
  }>(), {
    title: 'Concept Descriptions',
    selectable: true,
    showSource: true,
    showStatus: true,
    showDiff: true,
    itemsPerPage: 10,
  })

  const emit = defineEmits<{
    (event: 'view-diff', row: ConceptDescriptionTableRow): void
  }>()

  const tableSearch = ref('')

  const tableHeaders = computed(() => {
    const headers = []

    if (props.selectable) {
      headers.push({ title: '', key: 'selected', sortable: false, width: '48px' })
    }
    if (props.showSource) {
      headers.push({ title: 'Source', key: 'source', sortable: true, width: '100px' })
    }
    if (props.showStatus) {
      headers.push({ title: 'Status', key: 'status', sortable: true, width: '110px' })
    }
    if (props.showDiff) {
      headers.push({ title: '', key: 'diff', sortable: false, width: '110px' })
    }

    headers.push(
      { title: 'IRDI', key: 'irdi', sortable: true },
      { title: 'Preferred Name', key: 'preferredName', sortable: true },
      { title: 'Short Name', key: 'shortName', sortable: true },
      { title: 'Definition', key: 'definition', sortable: false },
      { title: 'Unit', key: 'unit', sortable: true },
      { title: 'Data Type', key: 'dataType', sortable: true },
    )

    return headers
  })

  const allSelected = computed<boolean>(
    () => props.rows.length > 0 && props.rows.every(row => row.selected === true),
  )

  const someSelected = computed<boolean>(
    () => props.rows.some(row => row.selected === true) && !allSelected.value,
  )

  function toggleSelectAll (value: boolean): void {
    for (const row of props.rows) {
      row.selected = value
    }
  }
</script>
