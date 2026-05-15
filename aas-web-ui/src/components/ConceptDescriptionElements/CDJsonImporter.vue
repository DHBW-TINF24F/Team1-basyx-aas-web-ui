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
  import { count } from 'node:console'
  import { jsonization } from '@aas-core-works/aas-core3.1-typescript'
  import { ref } from 'vue'
  import { s } from 'vue-router/dist/options-D5Ta7zF4.mjs'
  import { useCDRepositoryClient } from '@/composables/Client/CDRepositoryClient'
  import { useNavigationStore } from '@/store/NavigationStore'
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
  const results = ref<Array<any>>([])

  const navigationStore = useNavigationStore()

  async function processFiles () {
    await extractFiles()
    await importCds()
    closeDialog()
  }

  async function extractFiles () {
    const failedFileExtractions: Array<string> = []
    const failedFileValidations: Array<string> = []
    for (const file of selectedFiles.value) {
      if (!file.name.toLowerCase().endsWith('.json')) {
        continue
      }
      let json: unknown = ''

      try {
        const text = await file.text()
        json = JSON.parse(text)
      } catch {
        failedFileExtractions.push(file.name)
        continue
      }

      try {
        const converted = jsonization.conceptDescriptionFromJsonable(json as jsonization.JsonObject)
        if (converted.value && converted.value.id) {
          results.value.push(converted.value)
        } else {
          failedFileValidations.push(file.name)
        }
      } catch {
        failedFileValidations.push(file.name)
      }
    }
    if (failedFileExtractions.length > 0) {
      navigationStore.dispatchSnackbar({
        status: true,
        timeout: 8000,
        color: 'warning',
        btnColor: 'buttonText',
        text: `Failed to parse JSON Files: ${failedFileExtractions.join(', ')}`,
      })
    }
    if (failedFileValidations.length > 0) {
      navigationStore.dispatchSnackbar({
        status: true,
        timeout: 8000,
        color: 'error',
        btnColor: 'buttonText',
        text: `The contents of the following JSON files are no Concept Description: ${failedFileValidations.join(', ')}'`,
      })
    }
  }

  function removeDuplicates (arr: Array<any>) {
    return Array.from(
      new Map(
        arr.map(obj => [JSON.stringify(obj), obj]),
      ).values(),
    )
  }

  async function importCds () {
    let success = 0
    let failed = 0

    const deduplicatedResults = removeDuplicates(results.value)
    try {
      for (const conceptDescription of deduplicatedResults) {
        if (!conceptDescription || !conceptDescription.id) continue
        const existing = await fetchCdById(conceptDescription.id)
        const res = await (existing && existing.keys > 0 ? putConceptDescription(existing) : postConceptDescription(conceptDescription))
        if (res) {
          success++
        } else {
          failed++
        }
      }
    } catch (error) {
      navigationStore.dispatchSnackbar({
        status: true,
        timeout: 8000,
        color: 'error',
        btnColor: 'buttonText',
        text: `Something went wrong uploading Concept Descriptions: ${error}'`,
      })
    }
    navigationStore.dispatchSnackbar({
      status: true,
      timeout: 8000,
      color: 'success',
      btnColor: 'buttonText',
      text: `Successfully imported ${success} Concept Descriptions; ${failed} Failed.'`,
    })
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
