const defaultUserFilters = {
  unregistered: true,
  registered: false,
  newcomers: true,
  learners: true,
  experienced: true,
  bots: false,
}

const defaultRevisionFilters = {
  largeAdditions: true,
  smallAdditions: true,
  neutral: true,
  smallRemovals: true,
  largeRemovals: true,
} 

const defaultMinorFilters = {
  isMinor: true,
  isMajor: true
}

const defaultNamespaceSelected = [{namespace: "Main/Article - 0"}]

const defaultNewcomerUserFilters = {
  unregistered: true,
  registered: false,
  newcomers: true,
  learners: false,
  experienced: false,
  bots: false,
}

const defaultLGBTHistoryFilters = [{
  page_id: 1421393,
  primary_text: "LGBT history",
  secondary_text: "73 edits"
}] 

export default {
  defaultUserFilters,
  defaultRevisionFilters,
  defaultMinorFilters,
  defaultNamespaceSelected,
  defaultNewcomerUserFilters,
  defaultLGBTHistoryFilters
}