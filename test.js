const { stylizer } = require('./build')

const newTheme = stylizer({
  err: 'b,red',
  success: 'u,green',
  reg: 'i,/yellow',
})

console.log(newTheme.err`
test ${{success: 'some success message', err: 'and error mess'}}
other styles ${{reg: "test"}}
`)
