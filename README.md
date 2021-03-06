# bygone

Listen for navigation and stream HTML5 history

[![Build Status](http://img.shields.io/travis/fardog/bygone/master.svg?style=flat-square)](https://travis-ci.org/fardog/bygone)
[![npm install](http://img.shields.io/npm/dm/bygone.svg?style=flat-square)](https://www.npmjs.org/package/bygone)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/feross/standard)

## Example

```javascript
const bygone = require('bygone')

const locationStream = bygone()

locationStream.on('data', console.log(data))

locationStream.write('/path') // navigates browser and emits `/path`
```

When you call the `bygone` instance's `install()` method, it listens for any
clicks on `a` elements, and treats those as pushState events so long as they are
in your current host; for example:

```html
<!-- snippet: test.html -->
<a href="/one">One</a>
<a href="/two">Two</a>
<a href="http://www.google.com/">Google</a>
```

```javascript
const bygone = require('bygone')

const locationStream = bygone().install()

locationStream.on('data', data => console.log('data'))
```

- User clicks on `One`, and `/one` is emitted and pushed onto the history state
- User clicks on `Two`, and `/two` is emitted and pushed onto the history state
- User clicks on `Google` and nothing is emmitted, and browser navigates to
  `http://www.google.com/`

Bygone also listens for `popstate` events, so forward/back button usage will be
emitted as expected.

## API

`bygone() -> duplexStream`

Instances have the following methods:

- `instance.install([opts]) -> instance`: Installs the `a` element listeners, and
  returns the instance to allow chaining.
    - `opts`: (object) an optional configuration object. can have the following
      properties:
        - `root`: (string) the root URL to watch under; if `root` is `/base/`
          only urls starting with `/base/` will be hooked.
        - `el`: (domElement) the element onto which the listeners should be
          installed. Defaults to `document.body`
- `instance.uninstall() -> instance`: Remove the `a` element listeners.

## Advanced Usage

The `instance.install` method is intentionally simplistic, and available for
convenience only. If you wanted something more complex, the tools are available
to do this in a very composable fashion:

```javascript
const through = require('through')
const events = require('dom-delegation-stream')
const cursor = require('object-cursor-stream')
const bygone = require('bygone')

events(document.body, 'click', 'a', {preventDefault: true, stopPropagation: true})
  .pipe(cursor('target.href'))
  .pipe(filterStream('/beep'))
  .pipe(bygone())
    .on('data', data => console.log(data))

function filterStream(base) {
  const stream = through(write)
  const props = ['protocol', 'hostname', 'port']

  return stream

  function write(data) {
    // if the string doesn't start with our base string, drop it
    if (data && data.indexOf(base) !== 0) {
      return
    }

    stream.queue(data)
  }
}
```

Now when you clicked on any link with a URL starting with `/beep`, it would be
pushed into your history state via bygone, and logged to the console.

## License

MIT. See [LICENSE](./LICENSE) for details.
