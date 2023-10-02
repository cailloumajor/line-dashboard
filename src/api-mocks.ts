import { rest, setupWorker } from "msw"

import { computeApiPath, configApiPath } from "src/global"

export const timelineData = new Uint8Array([
  0x95, 0x92, 0xce, 0x1c, 0x18, 0xf8, 0x00, 0x00, 0x92, 0xce, 0x1c, 0x19, 0x4c,
  0x60, 0x01, 0x92, 0xce, 0x1c, 0x19, 0x92, 0xb0, 0xc0, 0x92, 0xce, 0x1c, 0x19,
  0xa0, 0xc0, 0x02, 0x92, 0xce, 0x1c, 0x19, 0xf5, 0x20, 0x03,
])

const handlers = [
  rest.get(`${configApiPath}/common`, (req, res, ctx) =>
    res(
      ctx.json({
        partnerGroups: {
          testzone: ["partner1", "partner2", "partner3"],
        },
        shiftStartTimes: ["05:00:00", "12:00:00", "20:00:00"],
        weekStart: {
          day: "Tuesday",
          shiftIndex: 2,
        },
      }),
    ),
  ),
  rest.get(`${configApiPath}/:id`, (req, res, ctx) =>
    res(
      ctx.json({
        title: req.params.id,
        shiftEngaged: [...Array(21)].map(() => Math.random() < 0.5),
        targetCycleTime: Math.floor(Math.random() * 600) / 10,
        targetEfficiency: Math.floor(Math.random() * 1000) / 1000,
      }),
    ),
  ),
  rest.patch(`${configApiPath}/:id`, (req, res, ctx) => res(ctx.status(200))),
  rest.get(`${computeApiPath}/timeline/:id`, (req, res, ctx) =>
    res(
      ctx.set("Content-Length", timelineData.byteLength.toString()),
      ctx.set("Content-Type", "application/msgpack"),
      ctx.body(timelineData),
    ),
  ),
  rest.get(`${computeApiPath}/performance/:id`, (req, res, ctx) =>
    res(
      ctx.set("Content-Type", "application/json"),
      ctx.body(String(Math.random() * 100)),
    ),
  ),
]

export const worker = setupWorker(...handlers)
