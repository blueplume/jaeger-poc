const express = require('express')

const router = express.Router()

router.get('/parent', async function (req, res, next) {
  req.traceSpan.log({ 'event': 'start parent' })
  const response = await req.chainOn('http://localhost:3000/child');
  res.send('done-parent {' + response + '}')
  req.traceSpan.log({ 'event': 'end parent' })
  next();
})

module.exports = router