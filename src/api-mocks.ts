import { HttpResponse, http } from "msw"
import { setupWorker } from "msw/browser"

import { computeApiPath, configApiPath } from "src/global"

export const timelineData = new Uint8Array([
  0x95, 0x92, 0xce, 0x1c, 0x18, 0xf8, 0x00, 0x00, 0x92, 0xce, 0x1c, 0x19, 0x4c,
  0x60, 0x01, 0x92, 0xce, 0x1c, 0x19, 0x92, 0xb0, 0xc0, 0x92, 0xce, 0x1c, 0x19,
  0xa0, 0xc0, 0x02, 0x92, 0xce, 0x1c, 0x19, 0xf5, 0x20, 0x03,
])

const handlers = [
  http.get(`${configApiPath}/common`, () => {
    return HttpResponse.json({
      partnerGroups: {
        testzone: ["partner1", "partner2", "partner3"],
      },
      shiftStartTimes: ["05:00:00", "12:00:00", "20:00:00"],
      weekStart: {
        day: "Tuesday",
        shiftIndex: 2,
      },
    })
  }),

  http.get(`${configApiPath}/:id`, ({ params }) => {
    return HttpResponse.json({
      title: params.id,
      shiftEngaged: [...Array(21)].map(() => Math.random() < 0.5),
      targetCycleTime: Math.floor(Math.random() * 600) / 10,
      targetEfficiency: Math.floor(Math.random() * 1000) / 1000,
    })
  }),

  http.patch(`${configApiPath}/:id`, () => {
    return new HttpResponse(null, {
      status: 200,
    })
  }),

  http.get(`${computeApiPath}/timeline/:id`, () => {
    return new HttpResponse(timelineData, {
      headers: {
        "Content-Length": timelineData.byteLength.toString(),
        "Content-Type": "application/msgpack",
      },
    })
  }),

  http.get(`${computeApiPath}/performance/:id`, () => {
    return new HttpResponse(String(Math.random() * 100), {
      headers: {
        "Content-Type": "application/json",
      },
    })
  }),
]

export const worker = setupWorker(...handlers)
