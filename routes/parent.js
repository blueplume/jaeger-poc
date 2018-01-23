const express = require('express')
const initTracer = require('jaeger-client').initTracer;
const opentracing = require("opentracing");
const request = require('request-promise-native');

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

router.get('/parent', async function (req, res, next) {
  const parentSpan = parentTracer.startSpan('parent-call', { childOf: res.traceStack.parentContext });
  parentSpan.setTag(opentracing.Tags.SAMPLING_PRIORITY, 1);
  parentSpan.log({ 'event': 'start parent' })
  const headers = {}
  parentTracer.inject(parentSpan, opentracing.FORMAT_HTTP_HEADERS, headers)
  const response = await request('http://localhost:3000/child', { headers });
  parentSpan.log({ 'event': 'end parent' })
  parentSpan.finish()
  res.send('done-parent {' + response + '}')
})

module.exports = router