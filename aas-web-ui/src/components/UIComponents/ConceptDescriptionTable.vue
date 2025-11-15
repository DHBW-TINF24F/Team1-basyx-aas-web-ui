<template>
  <div class="table-wrapper">
    <table class="concept-table">
      <thead>
        <tr>
          <th class="dots-col"></th>
          <th>ID</th>
          <th>IDshort</th>
          <th>Description</th>
          <th>Sign</th>
        </tr>

        <!-- Filter Row -->
        <tr class="filter-row">
          <td></td>
          <td>
            <div class="filter-cell">
              <input type="text" />
              <span class="filter-icon">🔽</span>
            </div>
          </td>
          <td>
            <div class="filter-cell">
              <input type="text" />
              <span class="filter-icon">🔽</span>
            </div>
          </td>
          <td>
            <div class="filter-cell">
              <input type="text" />
              <span class="filter-icon">🔽</span>
            </div>
          </td>
          <td>
            <div class="filter-cell">
              <input type="text" />
              <span class="filter-icon">🔽</span>
            </div>
          </td>
        </tr>
      </thead>

      <tbody>
        <tr v-for="n in 12" :key="n">
          <td class="dots-col">• • •</td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  name: 'ConceptDescriptionTable',
};
</script>

<style scoped>
.table-wrapper {
  width: 100%;
  overflow-x: auto;
}

.concept-table {
  width: 100%;
  border-collapse: collapse;
  border: 2px solid black;
  font-family: Arial, sans-serif;
}

.concept-table th,
.concept-table td {
  border: 2px solid black;
  padding: 8px;
  min-width: 130px;
  height: 38px;
}

.dots-col {
  width: 60px;
  font-size: 18px;
  text-align: center;
  letter-spacing: 4px;
}

.filter-row input {
  width: 70%;
  border: 1px solid black;
  height: 20px;
}

.filter-cell {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-icon {
  cursor: pointer;
  margin-left: 6px;
}
</style>