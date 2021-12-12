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

// filler for testing - TODO add actual LGBT History default filters
const defaultLGBTHistoryFilters = {
  largeAdditions: true,
  smallAdditions: false,
  neutral: false,
  smallRemovals: false,
  largeRemovals: false,
} 

export default {
  defaultUserFilters,
  defaultRevisionFilters,
  defaultMinorFilters,
  defaultNamespaceSelected,
  defaultNewcomerUserFilters,
  defaultLGBTHistoryFilters
}