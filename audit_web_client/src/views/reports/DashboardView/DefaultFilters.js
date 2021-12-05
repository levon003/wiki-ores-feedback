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

export default {
  defaultUserFilters,
  defaultRevisionFilters,
  defaultMinorFilters
}