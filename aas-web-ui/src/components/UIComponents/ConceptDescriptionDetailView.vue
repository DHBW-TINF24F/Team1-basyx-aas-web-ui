<template>
    <div style="padding: 20px; font-family: Arial; max-width: 500px">
        <h2>ConceptDescription Prototype</h2>

        <label><strong>ID</strong></label>
        <input v-model="cd.id" style="width: 100%; margin-bottom: 10px" />

        <label><strong>idShort</strong></label>
        <input v-model="cd.idShort" style="width: 100%; margin-bottom: 20px" />

        <h3><strong>Display Names</strong></h3>

        <div
            v-for="(item, index) in cd.displayName"
            :key="index"
            style="border: 1px solid #ccc; padding: 10px; margin-bottom: 10px">
            <label>{{ item.language.toUpperCase() }} Name</label>
            <input v-model="item.text" style="width: 100%" />
        </div>

        <h3><strong>Live JSON</strong></h3>
        <pre style="background: #f0f0f0; padding: 15px">{{ cd }}</pre>
    </div>
</template>

<script>
    import { reactive, watch } from 'vue';

    export default {
        name: 'App',

        setup() {
            // Reactive ConceptDescription object
            const cd = reactive({
                id: '0173-1#02-AAA099#002',
                idShort: 'ValueId',
                displayName: [
                    { language: 'en', text: 'Length' },
                    { language: 'de', text: 'Länge' },
                ],
            });

            // Watcher: fires whenever ANY field changes
            watch(
                cd,
                (newValue) => {
                    console.log('ConceptDescription changed:', newValue);
                },
                { deep: true }
            );

            return { cd };
        },
    };
</script>
