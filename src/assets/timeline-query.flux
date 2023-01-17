import "influxdata/influxdb/schema"

params = {
    cycleTimeOverColor: "",
    cycleColor: "",
    campChangeColor: "",
    stoppedColor: "",
    bucket: "",
    id: "",
}

filterFields = (r) =>
    r._field == "averageCycleTime" or r._field == "campChange" or r._field == "cycle" or r._field == "goodPartsAge"

dropColumns = (column) => filterFields(r: {_field: column})

colorFromStatuses = (r) =>
    ({r with color:
            if r.cycle then
                if r.goodPartsAge > 63.72 then
                    params.stoppedColor
                else if float(v: r.averageCycleTime) / 10.0 < 22.3 then
                    params.cycleColor
                else
                    params.cycleTimeOverColor
            else if r.campChange then
                params.campChangeColor
            else
                params.stoppedColor,
    })

from(bucket: params.bucket)
    |> range(start: -24h)
    |> filter(fn: (r) => r["_measurement"] == "opcua.data")
    |> filter(fn: (r) => r.id == params.id)
    |> filter(fn: filterFields)
    |> schema.fieldsAsCols()
    |> map(fn: colorFromStatuses)
    |> drop(fn: dropColumns)
    |> aggregateWindow(every: 1m, fn: last, column: "color")
