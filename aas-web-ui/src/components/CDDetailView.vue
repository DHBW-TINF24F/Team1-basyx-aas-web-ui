<template>
  <v-container>
    <v-dialog v-model="dialogOpen" width="800" @click:outside="closeDialog">
      <v-list>
        <v-list-item>
          <div class="scrollable">
            <!-- Display Concept description -->
            <ConceptDescription :concept-description-object="conceptDescription" />
          </div>
        </v-list-item>
        <v-list-item>
          <!-- Action buttons -->
          <v-row class="rightSideButtons">
            <v-btn
              class="text-buttonText"
              color="primary"
              rounded="lg"
              text="Close"
              variant="flat"
              @click="closeDialog"
            />
          </v-row>
        </v-list-item>
      </v-list>
    </v-dialog>
  </v-container>
</template>

<script lang="ts" setup>
  import { jsonization } from '@aas-core-works/aas-core3.1-typescript'
  import { useCDStore } from '@/store/ConceptDescriptionStore'

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

  function closeDialog () {
    emit('close-dialog')
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

<style>
.scrollable {
  overflow: auto;
  max-height: 80vh;
}
</style>
