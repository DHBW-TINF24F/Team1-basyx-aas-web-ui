<template>
  <v-container>
    <v-btn @click="toggleDialog('editor')">
      Open Dialog
    </v-btn>

    <v-dialog v-model="dialog.editor" persistent width="1000">
      <c-d-editor
        :concept-description="model"
        @cancel:edit="toggleDialog('editor')"
        @update:concept-description="updateConceptDescription"
      />
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
  import { jsonization } from '@aas-core-works/aas-core3.1-typescript'
  import { useCDRepositoryClient } from '@/composables/Client/CDRepositoryClient'
  import { useNavigationStore } from '@/store/NavigationStore'

  const { fetchCd, getCdEndpointById, putConceptDescription } = useCDRepositoryClient()
  const navigationStore = useNavigationStore()

  const emit = defineEmits<{
    (event: 'update:confirm', id: string): void
  }>()

  const model = ref({})
  const dialog = reactive<any>({
    editor: false,
  })

  async function getCdByID () {
    const hardcodedID = 'https://example.com/aas/concept-descriptions/temperature'
    const endpoint = getCdEndpointById(hardcodedID)
    const cd = await fetchCd(endpoint)
    model.value = cd
  }

  function toggleDialog (component: string) {
    dialog[component] = !dialog[component]
  }

  async function updateConceptDescription (value: any) {
    try {
      const res = jsonization.conceptDescriptionFromJsonable(value)
      if (res.error !== null) {
        throw new Error(`Failed to parse ConceptDescription: ${JSON.stringify(res.error)}`)
      } else if (res.value !== null) {
        const response = await putConceptDescription(res.value)
        navigationStore.dispatchSnackbar({
          status: true,
          timeout: 8000,
          color: response ? 'success' : 'warning',
          btnColor: 'buttonText',
          text: response ? `Successfully updated ConceptDescription: ${value.idShort}` : `Failed to update ConceptDescription: ${value.idShort}`,
        })
        toggleDialog('editor')
        emit('update:confirm', value.id)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error)
      navigationStore.dispatchSnackbar({
        status: true,
        timeout: 8000,
        color: 'error',
        btnColor: 'buttonText',
        text: errorMessage,
      })
    }
  }

  onMounted(() => {
    getCdByID()
  })
</script>
