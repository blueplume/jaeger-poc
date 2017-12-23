
module.exports = (traceSpan) => {
  return new Promise((resolve, reject) => {
      traceSpan.log({'event': 'start process'})
    setTimeout(() => { 
      traceSpan.log({'event': 'end process'})
      return resolve('pong')
    }, 1000)
  })
}