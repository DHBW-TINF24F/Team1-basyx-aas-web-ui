<template>
  <v-container>
    <v-dialog v-model="dialogOpen" width="800" @click:outside="closeDialog">
      <v-sheet border rounded="lg">
        <v-card-title class="bg-cardHeader">Upload CDs from JSON</v-card-title>
        <v-divider />
        <v-card-text class="overflow-y-auto" style="max-height: calc(100vh - 296px)">
          <v-file-upload
            v-model="selectedFiles"
            accept=".json,application/json"
            clearable
            density="comfortable"
            multiple
            show-size
          >
            <template #title>
              Drop JSON files here or click to upload
            </template>
          </v-file-upload>

          <v-card-actions>
            <v-spacer />
            <v-btn
              class="text-buttonText"
              color="primary"
              :disabled="selectedFiles.length === 0"
              rounded="lg"
              text="Import"
              variant="flat"
              @click="processFiles"
            />
          </v-card-actions>
        </v-card-text>
      </v-sheet>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
  import { jsonization } from '@aas-core-works/aas-core3.1-typescript'
  import { ref } from 'vue'
  import { useCDRepositoryClient } from '@/composables/Client/CDRepositoryClient'
  const { fetchCdById, postConceptDescription, putConceptDescription } = useCDRepositoryClient()

  const props = defineProps({
    dialogOpen: {
      type: Boolean,
      default: false,
    },
  })

  const emit = defineEmits<{
    (event: 'close-dialog'): void
  }>()

  const dialogOpen = ref<boolean>(props.dialogOpen)

  const selectedFiles = ref<File[]>([])
  const jsonContents = ref<unknown[]>([])
  const results = ref<Array<any>>([])

  async function processFiles () {
    await extractFiles()
    await validateFiles()
    console.log('after validate')
    await importCds()
    console.log('after import')
  }

  async function extractFiles () {
    for (const file of selectedFiles.value) {
      if (!file.name.toLowerCase().endsWith('.json')) {
        continue
      }

      try {
        const text = await file.text()
        const parsed = JSON.parse(text)

        jsonContents.value.push(parsed)
      } catch {}
    }
  }

  async function validateFiles () {
    for (const json of jsonContents.value) {
      try {
        const converted = jsonization.conceptDescriptionFromJsonable(json as jsonization.JsonObject)
        if (converted.value) {
          results.value.push(converted.value)
        }
      } catch {
        continue
      }
    }
  }

  async function importCds () {
    try {
      for (const conceptDescription of results.value) {
        if (!conceptDescription || !conceptDescription.id) continue
        const existing = await fetchCdById(conceptDescription.id)
        await (existing && existing.keys > 0 ? putConceptDescription(existing) : postConceptDescription(conceptDescription))
      }
    } catch {}
  }

  function closeDialog () {
    selectedFiles.value = []
    emit('close-dialog')
  }

  watch(
    () => props.dialogOpen,
    newVal => {
      dialogOpen.value = newVal
    },
  )
</script>
