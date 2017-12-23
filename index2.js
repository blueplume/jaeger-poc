const express = require('express')
const opentracing = require("opentracing");
const initTracer = require('jaeger-client').initTracer;
const processor = require('./processor');
// See schema https://github.com/jaegertracing/jaeger-client-node/blob/master/src/configuration.js#L37
const config = {
  'serviceName': 'svc-2',
  'reporter': {
    'agentHost': '192.168.33.100',
    'flushIntervalMs': 500
  }
};

const options = {
  'tags': {
    'svc2.version': '1.0'
  },
  // 'metrics': metrics,
  // 'logger': logger
};

opentracing.initGlobalTracer(initTracer(config, options));

let app = express()

function injectTraceSpan(req, res, next) {
  const tracer = opentracing.globalTracer()
  console.info('!! CONTEXT !!', req.headers)
  const parentContext = JSON.parse(req.get('x-context'))
  req.traceSpan = tracer.startSpan('http_request', { childOf: parentContext });
  req.traceSpan.setTag(opentracing.Tags.SAMPLING_PRIORITY, 1);
  req.traceSpan.log({'event': `start: ${req.headers['correlation-id']}`})
  next()  
}

app.get('/', injectTraceSpan, async function (req, res, next) {
  req.traceSpan.log({'event': `start: svc2`})
  setTimeout(() => {
    res.send('svc2-done')
    req.traceSpan.log({'event': `end: svc2`})
    next();
  }, 1000)
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

app.listen(4000, () => console.log('Svc-2 listening on port 4000!'))