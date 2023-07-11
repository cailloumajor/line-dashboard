import { rest, setupWorker } from "msw"

import { configApiPath } from "src/global"

const handlers = [
  rest.get(`${configApiPath}/:id`, (req, res, ctx) =>
    res(
      ctx.json({
        title: "Test Title",
        influxdbOrg: "devOrg",
        influxdbToken: "devToken",
        influxdbBucket: "devBucket",
      })
    )
  ),
]

export const worker = setupWorker(...handlers)
