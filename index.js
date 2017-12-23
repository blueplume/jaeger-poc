const express = require('express')
const opentracing = require("opentracing");
const request = require('request-promise-native');
const initTracer = require('jaeger-client').initTracer;
const processor = require('./processor');
// See schema https://github.com/jaegertracing/jaeger-client-node/blob/master/src/configuration.js#L37
const config = {
  'serviceName': 'svc-1',
  'reporter': {
    'agentHost': '192.168.33.100',
    'flushIntervalMs': 500
  }
};

const options = {
  'tags': {
    'svc1.version': '1.0'
  },
  // 'metrics': metrics,
  // 'logger': logger
};

opentracing.initGlobalTracer(initTracer(config, options));

let app = express()

function injectTraceSpan(req, res, next) {
  const tracer = opentracing.globalTracer()
  req.traceSpan = tracer.startSpan('http_request');
  req.traceSpan.setTag(opentracing.Tags.SAMPLING_PRIORITY, 1);
  req.traceSpan.log({'event': `start: ${req.headers['correlation-id']}`})
  req.chainOn = request.defaults({
    headers: ['correlation-id: ' + req.headers['correlation-id'], 'x-context: ' + JSON.stringify(req.traceSpan.context())]
  })
  next()  
}

app.get('/', injectTraceSpan, async function (req, res, next) {
  req.traceSpan.log({ 'event': 'start svc-1' })
  const retVal = await processor(req.traceSpan)
  const context = req.traceSpan.context()
  const response = await req.chainOn('http://localhost:4000/');
  res.send(retVal + ' ' + response)
  req.traceSpan.log({ 'event': 'end svc-1' })
  next();
})

function wrapupTraceSpan( req, res, next ) {
  console.log('DONE')
  if (req.traceSpan) {
    req.traceSpan.log({'event': `end: ${req.headers['correlation-id']}`})
    req.traceSpan.finish()
  }
  next();
}

app.use(wrapupTraceSpan);

app.listen(3000, () => console.log('Svc-1 listening on port 3000!'))