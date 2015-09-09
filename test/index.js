const test = require('tape')
const trigger = require('trigger-event')
const events = require('dom-delegation-stream')

const bygone = require('../lib')

const els = []

test('setup', function (t) {
  t.plan(1)

  const urls = [
    ['One', '/one'],
    ['Two', '/two'],
    ['Base', '/base/beep'],
    ['Google', 'http://www.google.com/']
  ]

  urls.forEach(url => {
    const el = document.createElement('a')

    el.setAttribute('name', url[0].toLowerCase())
    el.setAttribute('href', url[1])
    el.appendChild(document.createTextNode(url[0]))

    document.body.appendChild(el)

    els.push(el)
  })

  t.equal(document.querySelectorAll('a').length, 4, 'set it up')
})

test('writing changes navigation', function (t) {
  t.plan(2)

  const instance = bygone()
  const location = '/beep'

  instance.on('data', data => {
    t.equal(data, location)
    t.equal(document.location.pathname, location)

    instance.end()
  })

  instance.write(location)
})

test('navigating back emits events', function (t) {
  t.plan(3)

  const instance = bygone()
  const location = '/boop'

  instance.once('data', data => {
    t.equal(data, location)
    t.equal(document.location.pathname, location)

    instance.on('data', data => {
      t.equal(data, '/beep')
      instance.end()
    })

    window.history.back()
  })

  instance.write(location)
})

test('can set up event listeners', function (t) {
  t.plan(2)

  const instance = bygone().install()

  instance.once('data', data => {
    t.equal(data, '/one')
    t.equal(document.location.pathname, '/one')

    instance.end()
  })

  trigger(document.querySelector('[name=one]'), 'click')
})

test('cannot install twice', function (t) {
  t.plan(1)

  const instance = bygone().install()

  t.throws(function () {
    instance.install()
  })

  instance.end()
})

test('non-local links ignored', function (t) {
  t.plan(1)

  // stop our links from acutally navigating the page
  const prevent = events(document, 'click', 'a', {preventDefault: true})

  const instance = bygone().install()

  instance.once('data', data => {
    t.fail('should not emit')
  })

  trigger(document.querySelector('[name=google]'), 'click')

  process.nextTick(() => {
    t.pass('did not emit')
    instance.end()
    prevent.end()
  })
})

test('non-base links ignored', function (t) {
  t.plan(1)

  // stop our links from acutally navigating the page
  const prevent = events(document, 'click', 'a', {preventDefault: true})

  const instance = bygone().install({root: '/base'})

  instance.once('data', data => {
    t.equal(data, '/base/beep')

    instance.end()
    prevent.end()
  })

  trigger(document.querySelector('[name=one]'), 'click')
  trigger(document.querySelector('[name=base]'), 'click')
})

test('uninstall removes eventlisteners', function (t) {
  t.plan(2)

  // stop our links from acutally navigating the page
  const prevent = events(document, 'click', 'a', {preventDefault: true})

  const instance = bygone().install()

  instance.once('data', data => {
    t.equal(data, '/one')

    instance.once('data', data => {
      t.fail('should not fire')
    })

    instance.end()

    trigger(document.querySelector('[name=one]'), 'click')

    process.nextTick(() => {
      t.pass('did not emit')
      prevent.end()
    })
  })

  trigger(document.querySelector('[name=one]'), 'click')
})

test('teardown', function (t) {
  t.plan(1)

  els.forEach(el => {
    el.parentNode.removeChild(el)
  })

  t.pass('tore it down')
})
