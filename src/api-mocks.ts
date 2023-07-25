import { rest, setupWorker } from "msw"

import { computeApiPath, configApiPath } from "src/global"

export const timelineData = new Uint8Array([
  0x95, 0x92, 0xce, 0x1c, 0x18, 0xf8, 0x00, 0x00, 0x92, 0xce, 0x1c, 0x19, 0x4c,
  0x60, 0x01, 0x92, 0xce, 0x1c, 0x19, 0x92, 0xb0, 0xc0, 0x92, 0xce, 0x1c, 0x19,
  0xa0, 0xc0, 0x02, 0x92, 0xce, 0x1c, 0x19, 0xf5, 0x20, 0x03,
])

const handlers = [
  rest.get(`${configApiPath}/:id`, (req, res, ctx) =>
    res(
      ctx.json({
        title: "Test Title",
        influxdbOrg: "devOrg",
        influxdbToken: "devToken",
        influxdbBucket: "devBucket",
      }),
    ),
  ),
  rest.get(`${computeApiPath}/timeline/:id`, (req, res, ctx) =>
    res(
      ctx.set("Content-Length", timelineData.byteLength.toString()),
      ctx.set("Content-Type", "application/msgpack"),
      ctx.body(timelineData),
    ),
  ),
]

export const worker = setupWorker(...handlers)
