<template>
  <div class="container">

    <!-- ID + idShort -->
    <div class="card">
      <label class="label">ID</label>
      <input v-model="cd.id" class="input" />

      <label class="label">idShort</label>
      <input v-model="cd.idShort" class="input" />
    </div>

    <!-- One Display Name -->
    <div class="subtitle">Display Name</div>

    <div class="card">
      <label class="label">Language</label>
      <input v-model="cd.displayName.language" placeholder="en, de..." class="input" />

      <label class="label">Text</label>
      <input v-model="cd.displayName.text" placeholder="Length / Länge" class="input" />
    </div>

    <!-- JSON Output -->
    <div class="subtitle">Live JSON</div>
    <pre class="json-box">{{ formattedJSON }}</pre>

  </div>
</template>

<script>
import { reactive, computed } from "vue";

export default {
  name: "MinimalConceptDescription",
  setup() {
    const cd = reactive({
      id: "0173-1#02-AAA099#002",
      idShort: "ValueId",
      displayName: {
        language: "en",
        text: "Length"
      }
    });

    const formattedJSON = computed(() =>
      JSON.stringify(cd, null, 2)
    );

    return { cd, formattedJSON };
  }
};
</script>

<style>
/* Light Theme Defaults */
:root {
  --bg: #ffffff;
  --card-bg: #ffffff;
  --text: #222;
  --border: #ddd;
  --input-bg: #fafafa;
  --input-border: #aaa;
  --json-bg: #f5f5f5;
}

/* Dark Theme */
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #1e1e1e;
    --card-bg: #2b2b2b;
    --text: #e6e6e6;
    --border: #444;
    --input-bg: #3a3a3a;
    --input-border: #666;
    --json-bg: #242424;
  }
}

.container {
  padding: 30px;
  max-width: 500px;
  margin: auto;
  font-family: Arial, sans-serif;
  background: var(--bg);
  color: var(--text);
}

.card {
  background: var(--card-bg);
  border-radius: 10px;
  padding: 15px;
  border: 1px solid var(--border);
  margin-bottom: 20px;
}

.label {
  display: block;
  margin-bottom: 6px;
  font-weight: bold;
  color: var(--text);
}

.input {
  width: 100%;
  padding: 8px 10px;
  margin-bottom: 12px;
  border: 1px solid var(--input-border);
  border-radius: 6px;
  background: var(--input-bg);
  color: var(--text);
}

.subtitle {
  font-size: 18px;
  font-weight: bold;
  margin: 10px 0;
}

.json-box {
  background: var(--json-bg);
  padding: 15px;
  border-radius: 10px;
  border: 1px solid var(--border);
  white-space: pre-wrap;
  color: var(--text);
}
</style>
