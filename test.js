const { MultiLogger } = require('./build')

const log = new MultiLogger({ 
  path: './log',
  appName: 'TestApp',
  toFile: ['warn']
 })

 log.on('close', () => {
  console.log('closed');
})

 log.on('open', () => {
   console.log('Opened');
  log.system('System test log message');
  log.fatal('Fatal test log message');
  log.error('Error test log message');
  log.warn('Warning test log message');
  log.info('Info test log message');
  log.debug('Debug test log message');
  log.slow('Slow test log message');
  log.db('Database test log message');

  log.close()
 })


