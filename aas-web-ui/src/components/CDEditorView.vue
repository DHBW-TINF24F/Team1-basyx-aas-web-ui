<template>
  <v-container>
    <v-dialog v-model="dialogOpen" persistent width="1000">
      <c-d-editor
        :concept-description="conceptDescription"
        @cancel:edit="closeDialog()"
        @update:concept-description="updateConceptDescription"
      />
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
  import { jsonization } from '@aas-core-works/aas-core3.1-typescript'
  import { useCDRepositoryClient } from '@/composables/Client/CDRepositoryClient'
  import { useCDStore } from '@/store/ConceptDescriptionStore'
  import { useNavigationStore } from '@/store/NavigationStore'

  const { putConceptDescription } = useCDRepositoryClient()
  const props = defineProps({
    dialogOpen: {
      type: Boolean,
      default: false,
    },
  })

  const dialogOpen = ref(props.dialogOpen)

  const navigationStore = useNavigationStore()

  const emit = defineEmits<{
    (event: 'update:confirm', id: string): void
    (event: 'close-dialog'): void
  }>()

  const conceptDescription = reactive<any>({})

  function closeDialog () {
    emit('close-dialog')
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
          text: response ? `Successfully updated ConceptDescription: ${value.id}` : `Failed to update ConceptDescription: ${value.id}`,
        })
        emit('update:confirm', value.id)
        closeDialog()
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

  watch(
    () => props.dialogOpen,
    newVal => {
      if (newVal) {
        const cd = jsonization.toJsonable(toRaw(useCDStore().getSelectedCD))
        Object.assign(conceptDescription, structuredClone(cd))
      }
      dialogOpen.value = newVal
    },
  )
</script>
