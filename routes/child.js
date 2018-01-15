const express = require('express')
const initTracer = require('jaeger-client').initTracer;
const opentracing = require("opentracing");

const router = express.Router()

const config = {
  'serviceName': 'child',
  'reporter': {
    'agentHost': '192.168.33.100',
    'flushIntervalMs': 500
  }
};

const options = {
  'tags': {
    'child.version': '1.0'
  },
  // 'metrics': metrics,
  // 'logger': logger
};

const childTracer = initTracer(config, options)

router.get('/child', async function (req, res, next) {
  const traceSpan = childTracer.startSpan('child-timeout', { childOf: req.parentContext });
  traceSpan.log({'event': `start: child`})
  setTimeout(() => {
    res.send(' done-child ')
    traceSpan.log({'event': `end: child`})
    traceSpan.finish()
    next(); // important, as otherwise the traceSpan will not work
  }, 1000)
})

module.exports = router