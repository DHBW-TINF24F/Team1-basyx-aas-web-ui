<template>
  <v-container>
    <v-list>
      <v-list-item>
        <div class="edit-window">
          <!-- Display Concept description -->
          <ConceptDescription
            :concept-description-object="localConceptDescription"
            :editor-mode="true"
            @update:concept-description="updateConceptDescription"
            @update:embedded-data-specification="updateEmbeddedDataSpecification"
          />
        </div>
      </v-list-item>
      <v-divider />
      <v-list-item>
        <!-- Action buttons -->
        <v-row class="rightSideButtons">
          <v-btn
            class="text-buttonText"
            color="green"
            rounded="lg"
            text="Save changes"
            variant="flat"
            @click="openConfirmDialog('save')"
          />
          <v-btn
            class="text-buttonText"
            color="red"
            rounded="lg"
            text="Cancel"
            variant="flat"
            @click="openConfirmDialog('cancel')"
          />
        </v-row>
      </v-list-item>
    </v-list>

    <!-- Confirm action dialog -->
    <v-dialog v-model="dialog.open" max-width="400">
      <v-card>
        <v-card-title class="text-h6">{{ dialog.title }}</v-card-title>
        <v-card-text>{{ dialog.message }}</v-card-text>
        <v-card-actions>
          <v-btn
            class="text-buttonText"
            color="green"
            rounded="lg"
            variant="flat"
            @click="confirmAction"
          >Confirm</v-btn>
          <v-btn
            class="text-buttonText"
            color="red"
            rounded="lg"
            variant="flat"
            @click="resetAction"
          >Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
  import type { DialogContext } from '@/components/ConceptDescriptionElements/EditorComposables/types'
  import { reactive } from 'vue'

  const props = defineProps({
    conceptDescription: {
      type: Object as any,
      default: () => ({}) as any,
    },
  })

  const emit = defineEmits<{
    (event: 'update:concept-description', value: object): void
    (event: 'cancel:edit', value: boolean): void
  }>()

  const localConceptDescription = reactive<any>({})
  const dialog = ref<DialogContext>({
    open: false,
    action: '',
    title: '',
    message: '',
  })

  function openConfirmDialog (action: string) {
    dialog.value.action = action
    if (action === 'cancel') {
      dialog.value.title = 'Discard changes'
      dialog.value.message = 'Do you really want to stop editing the Concept Description? - All changes made will be lost.'
    } else {
      dialog.value.title = 'Save canges'
      dialog.value.message = 'Do you really want to save the canges made to the Concept Description? - All changes made will be Persisted.'
    }

    dialog.value.open = true
  }

  function confirmAction () {
    dialog.value.open = false
    if (dialog.value.action === 'cancel') {
      emit('cancel:edit', true)
    } else if (dialog.value.action === 'save') {
      emit('update:concept-description', localConceptDescription)
    }
  }

  function resetAction () {
    dialog.value.open = false
    dialog.value.action = ''
    dialog.value.title = ''
    dialog.value.message = ''
  }

  function updateConceptDescription (value: object, name: string) {
    localConceptDescription[name] = value
  }

  function updateEmbeddedDataSpecification (value: object, name: string, index: number) {
    localConceptDescription.embeddedDataSpecifications[index][name] = value
  }

  // updates the concept description passed by the parent
  watch(
    () => props.conceptDescription,
    newVal => {
      if (newVal) {
        Object.assign(localConceptDescription, structuredClone(toRaw(newVal)))
      }
    },
    { immediate: true },
  )
</script>

<style>
.rightSideButtons {
  justify-content: flex-end;
  display: flex;
}

.edit-window {
  overflow: auto;
  max-height: 80vh;
}
</style>
