const proxyquire = require('proxyquire');

describe('connect-chokidar', () => {
  let chokidar;
  let watchOnCbs;

  function run(opts, cb) {
    chokidar = jasmine.createSpyObj('chokidar', ['watch']);

    watchOnCbs = {};
    const watchOnSpy = jasmine.createSpy('chokidar.watch.on');
    chokidar.watch.and.returnValue({ on: watchOnSpy });
    watchOnSpy.and.callFake((name, cbi) => {
      watchOnCbs[name] = cbi;
    });

    const create = proxyquire('../src', { chokidar });
    const watcher = create('p', opts);
    const mid = watcher(() => (req, res, next) => next());
    mid('req', 'res', cb);
  }

  it('should not watch in production', done => {
    run({ isDevEnv: false }, () => {
      expect(chokidar.watch).not.toHaveBeenCalled();
      done();
    });
  });

  it('should watch in development', done => {
    run({ isDevEnv: true }, () => {
      expect(chokidar.watch).toHaveBeenCalled();
      done();
    });
  });

  it('should remove from rquire.cache on change', done => {
    const key = 'should_be_removed';
    const altKey = `must_not_be_removed`;
    run(
      {
        isDevEnv: true,
        requireCacheToRemoveRe: new RegExp(key),
      },
      () => {
        require.cache[key] = 77;
        require.cache[altKey] = 34;

        watchOnCbs.ready();
        watchOnCbs.change();

        expect(require.cache[key]).not.toBeDefined();
        expect(require.cache[altKey]).toBeDefined();
        delete require.cache[altKey];

        done();
      },
    );
  });
});
