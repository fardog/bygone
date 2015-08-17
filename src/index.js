const url = require('url')

const events = require('dom-delegation-stream')
const dotpath = require('dotpather')
const through = require('through')

module.exports = createBygone

function createBygone () {
  const stream = through(write, end)
  const lookupHref = dotpath('target.href')
  const lookupPath = dotpath('location.pathname')

  const baseUrl = url.parse(window.location.toString())
  const history = window.history

  let eventListener
  let rootStr

  stream.install = install
  stream.uninstall = uninstall
  stream._checkUrl = checkUrl

  // emit location on back/forward
  window.addEventListener('popstate', onPopState)

  return stream

  function write (href) {
    const urlObj = url.parse(href)

    history.pushState(urlObj, href, urlObj.path)

    stream.queue(urlObj.path)
  }

  function end () {
    uninstall()
    window.removeEventListener('popstate', onPopState)
    stream.queue(null)
  }

  function onPopState () {
    stream.queue(lookupPath(document))
  }

  function install ({root = null, el = document.body} = {}) {
    if (eventListener) {
      throw new Error('bygone: event listener already installed')
    }

    rootStr = root

    eventListener = events(el, 'click', 'a')
    eventListener.on('data', handler)

    return stream
  }

  function uninstall () {
    if (eventListener) {
      eventListener.end()
      eventListener = null
    }

    return stream
  }

  function handler (ev) {
    const href = lookupHref(ev)

    // verify we should be messing with this url
    if (!checkUrl(href)) {
      return
    }

    ev.preventDefault()
    ev.stopPropagation()

    write(href)
  }

  function checkUrl (_toCheck) {
    const toCheck = url.parse(_toCheck)
    const props = ['protocol', 'hostname', 'port']

    // if we don't match our baseurl, this url should be ignored
    if (props.some(prop => !(baseUrl[prop] === toCheck[prop]))) {
      return false
    }

    if (!toCheck.path) {
      return false
    }

    if (rootStr && toCheck.path.indexOf(rootStr) !== 0) {
      return false
    }

    return true
  }
}
