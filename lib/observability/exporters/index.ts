/**
 * Exporter bootstrap — registers all active exporters with the EventStreamer.
 * Import this once at app startup (or in route handlers that need event streaming).
 */
import { EventStreamer } from '../eventStreamer'
import { datadogExporter }    from './datadogExporter'
import { grafanaExporter }    from './grafanaExporter'
import { prometheusExporter } from './prometheusExporter'

let initialized = false

export function initExporters(): void {
  if (initialized) return
  initialized = true

  EventStreamer.registerExporter(datadogExporter)
  EventStreamer.registerExporter(grafanaExporter)
  EventStreamer.registerExporter(prometheusExporter)
}
