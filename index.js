const express = require('express')
const opentracing = require("opentracing");
const request = require('request-promise-native');
const initTracer = require('jaeger-client').initTracer;
const processor = require('./processor');
const parent = require('./routes/parent')
const child = require('./routes/child')

// See schema https://github.com/jaegertracing/jaeger-client-node/blob/master/src/configuration.js#L37
const config = {
  'serviceName': 'jaeger-poc',
  'reporter': {
    'agentHost': '192.168.33.100',
    'flushIntervalMs': 500
  }
};

const options = {
  'tags': {
    'svc.version': '1.0'
  },
  // 'metrics': metrics,
  // 'logger': logger
};

opentracing.initGlobalTracer(initTracer(config, options));

let app = express()

function injectTraceSpan(req, res, next) {
  console.error('1', req.headers)
  const tracer = opentracing.globalTracer()
  let parentContext
  if (req.get('tracecontext')) parentContext = JSON.parse(req.get('tracecontext'))
  console.error('heck', req.get('tracecontext'))
  req.traceSpan = tracer.startSpan('svc', { childOf: parentContext });
  req.traceSpan.setTag(opentracing.Tags.SAMPLING_PRIORITY, 1);
  // req.traceSpan.log({'event': `start: ${req.headers['correlation-id']}`})
  const headers = { 'correlation-id': req.get('correlation-id')};
  tracer.inject(req.traceSpan, opentracing.FORMAT_HTTP_HEADERS, headers);
  req.chainOn = request.defaults({
    headers
  })
  // req.chainOn = request
  next()  
}

function wrapupTraceSpan( req, res, next ) {
  console.log('DONE')
  if (req.traceSpan) {
    // req.traceSpan.log({'event': `end: ${req.headers['correlation-id']}`})
    req.traceSpan.finish()
  }
  next();
}

app.use(injectTraceSpan)

app.use(parent)

app.use(child)

app.use(wrapupTraceSpan);

app.listen(3000, () => console.log('POC listening on port 3000!'))