# connect-chokidar [![Build Status](https://img.shields.io/travis/nemtsov/connect-chokidar.svg)](http://travis-ci.org/nemtsov/connect-chokidar) [![NPM version](https://img.shields.io/npm/v/connect-chokidar.svg)](https://www.npmjs.com/package/connect-chokidar)

Middleware to watch files and remove `require.cache` on change, making nodemon unnecessary.

## Motivation

Sometimes restaring the entire process when a file changes (as with nodemon) takes
too long or is undesirable. This is often the case with "universal" web applications,
where the code which runs both on the client and server is already hot-reloaded with webpack.
In such apps we sometimes have server-only code (such as a GraphQL server or a RESTful API). Restarting the entire server with nodemon would mean forcing webpack to have to take time
to rebuild, loosing the benefits of hot reloading.

This module saves that time by specifically only removing files from the `require.cache`
(a cache that `require()` uses on every call) when a change to one of the files on the
file system is detected.

## Usage

```javascript
const createWatcher = require('connect-chokidar');

const watchMiddleware = createWatcher(`${__dirname}`, {
  // `process.env.NODE_ENV === 'development'` will be used as the default
  // when this is `false`, no file watching will be done and your middleware
  // will be executed with minimal interference
  isDevEnv: process.env.NODE_ENV === 'development',

  // Only the filenames that are in the regexp below will be deleted
  // from `require.cache` when files change
  requireCacheToRemoveRe: /\/src\//,

  // `usePolling: true` is usually necessary with NFS (and, for me, in docker for mac)
  // other `chokidar` opts can also be provided here
  chokidar: {
    usePolling: true,
  },
});

//...

const app = connect(); // or express()

// Now is the trickier bit, you'll have to `require()` all of the files that your
// local middleware or router depend on. This is because if we required it on top,
// the router / middleware would always refere to that instance and there would be
// no way of clearing it.

app.use('/auth', watchMiddleware(() => require('../auth/router')));

app.use(
  '/api',
  watchMiddleware(() => {
    const midA = require('./middlewareA');
    const apiRouter = require('./api/router');
    return [midA, apiRouter];
  }),
);

app.use(
  '/hello',
  watchMiddleware(() => {
    const midA = require('./middlewareA');
    return [
      midA,
      (req, res) => {
        res.end('world');
      },
    ];
  }),
);
```

## Inspiration

https://codeburst.io/dont-use-nodemon-there-are-better-ways-fc016b50b45e

## License

[MIT](/LICENSE)
