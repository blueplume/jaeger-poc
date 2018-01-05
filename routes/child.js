const express = require('express')
const initTracer = require('jaeger-client').initTracer;
const opentracing = require("opentracing");

const router = express.Router()

router.get('/child', async function (req, res, next) {
  req.traceSpan.log({'event': `start: child`})
  setTimeout(() => {
    res.send(' done-child ')
    req.traceSpan.log({'event': `end: child`})
    next(); // important, as otherwise the traceSpan will not work
  }, 1000)
})

module.exports = router