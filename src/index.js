const { normalize } = require('path');
const { debuglog } = require('util');
const chokidar = require('chokidar');

const log = debuglog('connect-chokidar');

function isDevEnv(opts) {
  return typeof opts.isDevEnv === 'boolean'
    ? opts.isDevEnv
    : process.env.NODE_ENV === 'development';
}

module.exports = function createMiddlewareWatcher(rootPath, opts = {}) {
  if (!isDevEnv(opts)) {
    return createMiddlware => createMiddlware();
  }

  log('watching %s', normalize(rootPath));
  const watcher = chokidar.watch(normalize(rootPath), opts.chokidar);

  watcher.on('ready', () => {
    watcher.on('change', changedFilePath => {
      log('changed: %s', changedFilePath);

      Object.keys(require.cache).forEach(key => {
        if (
          !opts.requireCacheToRemoveRe ||
          opts.requireCacheToRemoveRe.test(key)
        ) {
          log('delete from require.cache: %s', key);
          delete require.cache[key];
        }
      });
    });
  });

  return function middlewareWatcher(createMiddlware) {
    return function watchAndRoute(req, res, next) {
      createMiddlware()(req, res, next);
    };
  };
};
