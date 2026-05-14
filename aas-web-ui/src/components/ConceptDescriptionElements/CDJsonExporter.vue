<template>
  <v-container>
    <v-dialog v-model="dialogOpen" persistent width="800">
      <v-list>
        <v-list-item>
          <p>Enter the desired filename to download the Concept Description as JSON.</p>
          <p> The Concept Description's <span style="color: orange;">'idShort'</span> is used as default.</p>
        </v-list-item>
        <v-form
          v-model="formValid"
          @submit.prevent="downloadCdAsJson(conceptDescription, filename)"
        >
          <v-list-item>
            <v-text-field v-model="filename" :maxlength="maxLength" placeholder="Desired filename" :rules="[rules.filename, rules.baseChars]" />
          </v-list-item>
          <v-list-item>
            <!-- Action buttons -->
            <v-row class="rightSideButtons">
              <v-btn
                class="text-buttonText"
                color="primary"
                :disabled="!formValid"
                rounded="lg"
                text="Download"
                type="submit"
                variant="flat"
              />
              <v-btn
                class="text-buttonText"
                color="red"
                rounded="lg"
                text="Close"
                variant="flat"
                @click="closeDialog"
              />
            </v-row>
          </v-list-item>
        </v-form>
      </v-list>
    </v-dialog>
  </v-container>
</template>

<script lang="ts" setup>
  import { jsonization } from '@aas-core-works/aas-core3.1-typescript'
  import { useCDStore } from '@/store/ConceptDescriptionStore'
  import { downloadJson } from '@/utils/generalUtils'

  const props = defineProps({
    dialogOpen: {
      type: Boolean,
      default: false,
    },
  })

  const emit = defineEmits<{
    (event: 'close-dialog'): void
  }>()

  const conceptDescription = reactive<any>({})
  const dialogOpen = ref<boolean>(props.dialogOpen)
  const filename = ref<string>('')
  const formValid = ref(false)

  const maxLength = 100
  const rules = {
    filename: (value: string) => (value && value.length > 0 && value.length <= maxLength) || 'Filename must be between 1-' + maxLength + ' characters long.',
    baseChars: (value: string) => (value && !value.includes('.') && !value.includes(' ')) || 'Filename must not contain spaces and dots.',
  }

  function closeDialog () {
    emit('close-dialog')
  }

  function downloadCdAsJson (conceptDescription: any, filename: string) {
    downloadJson(conceptDescription, filename)
    closeDialog()
  }

  watch(
    () => props.dialogOpen,
    newVal => {
      if (newVal) {
        const cd = jsonization.toJsonable(toRaw(useCDStore().getSelectedCD))
        Object.assign(conceptDescription, structuredClone(cd))
        filename.value = conceptDescription.idShort ?? 'conceptDescription'
      }
      dialogOpen.value = newVal
    },
  )
</script>

<style>
.scrollable {
  overflow: auto;
  max-height: 80vh;
}
</style>
