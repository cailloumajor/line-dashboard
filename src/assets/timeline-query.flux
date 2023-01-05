import "influxdata/influxdb/schema"

params = {
    cycleTimeOverColor: "",
    cycleColor: "",
    campChangeColor: "",
    stoppedColor: "",
    bucket: "",
    id: "",
}

filterFields = (r) => r._field == "campChange" or r._field == "cycle" or r._field == "cycleTimeOver"

dropColumns = (column) => filterFields(r: {_field: column})

colorFromStatuses = (r) =>
    ({r with color:
            if r.cycle then
                if r.cycleTimeOver then
                    params.cycleTimeOverColor
                else
                    params.cycleColor
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
