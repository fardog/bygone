const bygone = require('../../src')

const locationStream = bygone().install()

locationStream.on('data', data => console.log(data))

locationStream.write('/bup')
