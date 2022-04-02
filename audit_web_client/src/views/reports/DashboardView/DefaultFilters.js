import LGBTHistory from 'src/views/reports/DashboardView/LGBTHistoryFilter';

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

const defaultLGBTHistoryFilters = LGBTHistory

export default {
  defaultUserFilters,
  defaultRevisionFilters,
  defaultMinorFilters,
  defaultNamespaceSelected,
  defaultNewcomerUserFilters,
  defaultLGBTHistoryFilters
}