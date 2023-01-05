import { toFluxValue } from "@influxdata/influxdb-client-browser"

function useFluxQuery() {
  /**
   * Replaces a [Flux] query's `params` record with provided params argument.
   *
   * @param rawQuery - The raw Flux query
   * @param params - An object for replacing `params` record in the query
   * @returns The Flux query with replaced parameters record
   *
   * [Flux]: https://docs.influxdata.com/flux
   */
  function makeFluxQuery<T extends object>(
    rawQuery: string,
    params: T
  ): string {
    const effectiveParams = Object.entries(params)
      .map(([key, value]) => `${key}:${toFluxValue(value)}`)
      .join(",")
    const replacement = `params={${effectiveParams}}`

    return rawQuery.replace(/params\s*=\s*\{(.*?)\}/s, replacement)
  }

  return { makeFluxQuery }
}

export default { useFluxQuery }
