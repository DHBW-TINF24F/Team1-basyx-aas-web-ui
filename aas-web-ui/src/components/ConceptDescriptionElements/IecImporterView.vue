<template>
  <v-container>
    <v-dialog v-model="dialogOpen" max-width="80vh" @click:outside="closeDialog">
      <v-card>
        <div class="scrollable">
          <iec-importer />
        </div>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import IecImporter from '@/pages/modules/IecImporter.vue'

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

  function closeDialog () {
    emit('close-dialog')
  }

  watch(
    () => props.dialogOpen,
    newVal => {
      dialogOpen.value = newVal
    },
  )
</script>

<style scoped>
.upload-area {
  border: 2px dashed #888;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
}

.right-button {
  display: flex;
  justify-content: end;
}

.scrollable {
  overflow: scroll;
  max-width: 80vh;
  max-height: 80vh;
}
</style>
