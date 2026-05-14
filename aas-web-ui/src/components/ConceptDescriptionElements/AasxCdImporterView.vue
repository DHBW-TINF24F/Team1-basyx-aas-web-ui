<template>
  <v-container>
    <v-dialog v-model="dialogOpen" max-width="80vh" @click:outside="closeDialog">
      <v-card>
        <div class="scrollable">
          <index />
        </div>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import Index from '@/pages/modules/AasxCdImporter/index.vue'

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
.scrollable {
  overflow: scroll;
  max-width: 80vh;
  max-height: 80vh;
}
</style>
