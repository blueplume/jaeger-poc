const express = require('express')
const initTracer = require('jaeger-client').initTracer;
const opentracing = require("opentracing");

const router = express.Router()

const config = {
  'serviceName': 'parent',
  'reporter': {
    'agentHost': '192.168.33.100',
    'flushIntervalMs': 500
  }
};

const options = {
  'tags': {
    'parent.version': '1.0'
  },
  // 'metrics': metrics,
  // 'logger': logger
};

const parentTracer = initTracer(config, options)

router.get('/parent', function (req, res, next) {
  const parentSpan = parentTracer.startSpan('parent-call', { childOf: req.parentContext });
  parentSpan.setTag(opentracing.Tags.SAMPLING_PRIORITY, 1);
  setTimeout(async () => {
    parentSpan.log({ 'event': 'start parent' })
    const headers = {}
    parentTracer.inject(parentSpan, opentracing.FORMAT_HTTP_HEADERS, headers)
    console.error('should-be: ', headers)
    const response = await
      req.chainOn
        .defaults({ headers })
        ('http://localhost:3000/child');
    parentSpan.log({ 'event': 'end parent' })
    parentSpan.finish()
    res.send('done-parent {' + response + '}')
    next();
  }, 1000)
})

module.exports = router