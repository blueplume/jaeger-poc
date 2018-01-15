const express = require('express')
const opentracing = require("opentracing");
const request = require('request-promise-native');
const initTracer = require('jaeger-client').initTracer;
const SpanContext = require('jaeger-client').SpanContext;
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
    'express.version': '1.0'
  },
  // 'metrics': metrics,
  // 'logger': logger
};

opentracing.initGlobalTracer(initTracer(config, options));

let app = express()

function injectTraceSpan(req, res, next) {
  const tracer = opentracing.globalTracer()
  req.traceSpan = tracer.startSpan('express', { childOf: req.parentContext });

  console.error(777, req.headers)
  if (req.get('uber-trace-id')) req.parentContext = SpanContext.fromString(req.get('uber-trace-id'))
    else req.parentContext = req.traceSpan.context()

  req.traceSpan.setTag(opentracing.Tags.SAMPLING_PRIORITY, 1);
  // req.traceSpan.log({'event': `start: ${req.headers['correlation-id']}`})
  const headers = { 'correlation-id': req.get('correlation-id') };
  // tracer.inject(req.traceSpan, opentracing.FORMAT_HTTP_HEADERS, headers);
  console.error('sendingout: ', headers)
  req.chainOn = request.defaults({
    headers
  })
  next()  
}

function wrapupTraceSpan( req, res, next ) {
  if (req.traceSpan) {
    // req.traceSpan.log({'event': `end: ${req.headers['correlation-id']}`})
    req.traceSpan.finish()
  }
  next();
}

app.use(injectTraceSpan)

app.use(child)

app.use(parent)

app.use(wrapupTraceSpan);

app.listen(3000, () => console.log('POC listening on port 3000!'))