import InlineMetrics from './InlineMetrics'
import InlineAllocation from './InlineAllocation'
import InlineBarChart from './InlineBarChart'
import InlineTable from './InlineTable'
import InlineCallout from './InlineCallout'
import BlockSkeleton from './BlockSkeleton'

export const BLOCK_COMPONENTS = {
  metrics: InlineMetrics,
  allocation: InlineAllocation,
  'bar-chart': InlineBarChart,
  table: InlineTable,
  callout: InlineCallout,
}

export { BlockSkeleton }
