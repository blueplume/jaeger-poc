const express = require('express')
const opentracing = require("opentracing");
const request = require('request-promise-native');
const fletcher = require('fletcher')
const parent = require('./routes/parent')
const child = require('./routes/child')

const tracerMw = fletcher.createTracerMiddleware('fletcher-demo', '192.168.33.100', '6832', { tag: { 'type': 'mw' }})

let app = express()

app.use(tracerMw)

app.use(child)

app.use(parent)

app.listen(3000, () => console.log('POC listening on port 3000!'))