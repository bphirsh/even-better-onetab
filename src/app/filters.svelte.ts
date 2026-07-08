export const filters = $state({
  query: '',
  tag: null as string | null,
})

export const filtersActive = () => filters.query.trim() !== '' || filters.tag !== null
