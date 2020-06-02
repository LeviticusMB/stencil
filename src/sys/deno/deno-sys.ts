import { CompilerSystem, SystemDetails, CompilerSystemUnlinkResults, CompilerSystemMakeDirectoryResults, CompilerSystemWriteFileResults } from '../../declarations';
import { normalizePath } from '@utils';

export function createDenoSys(Deno: any) {
  const destroys = new Set<() => Promise<void> | void>();

  const sys: CompilerSystem = {
    async access(p) {
      try {
        await Deno.stat(p);
        return true;
      } catch (e) {
        return false;
      }
    },
    accessSync(p) {
      try {
        Deno.statSync(p);
        return true;
      } catch (e) {
        return false;
      }
    },
    addDestory(cb) {
      destroys.add(cb);
    },
    removeDestory(cb) {
      destroys.delete(cb);
    },
    async copyFile(src, dst) {
      try {
        await Deno.copyFile(src, dst);
        return true;
      } catch (e) {
        return false;
      }
    },
    async destroy() {
      const waits: Promise<void>[] = [];
      destroys.forEach(cb => {
        try {
          const rtn = cb();
          if (rtn && rtn.then) {
            waits.push(rtn);
          }
        } catch (e) {
          console.error(`node sys destroy: ${e}`);
        }
      });
      await Promise.all(waits);
      destroys.clear();
    },
    encodeToBase64(str) {
      return Buffer.from(str).toString('base64');
    },
    exit(exitCode) {
      Deno.exit(exitCode);
    },
    getCurrentDirectory() {
      return normalizePath(Deno.cwd());
    },
    glob(_pattern, _opts) {
      return null;
    },
    async isSymbolicLink(p) {
      try {
        const stat = await Deno.stat(p);
        return stat.isSymlink;
      } catch (e) {
        return false;
      }
    },
    getCompilerExecutingPath: null,
    normalizePath,
    async mkdir(p, opts) {
      await Deno.mkdir(p, opts);
      return new Promise(resolve => {
        if (opts) {
          fs.mkdir(p, opts, err => {
            resolve({
              basename: path.basename(p),
              dirname: path.dirname(p),
              path: p,
              newDirs: [],
              error: err,
            });
          });
        } else {
          fs.mkdir(p, err => {
            resolve({
              basename: path.basename(p),
              dirname: path.dirname(p),
              path: p,
              newDirs: [],
              error: err,
            });
          });
        }
      });
    },
    mkdirSync(p, opts) {
      const results: CompilerSystemMakeDirectoryResults = {
        basename: path.basename(p),
        dirname: path.dirname(p),
        path: p,
        newDirs: [],
        error: null,
      };
      try {
        fs.mkdirSync(p, opts);
      } catch (e) {
        results.error = e;
      }
      return results;
    },
    readdir(p) {
      return new Promise(resolve => {
        fs.readdir(p, (err, files) => {
          if (err) {
            resolve([]);
          } else {
            resolve(
              files.map(f => {
                return normalizePath(path.join(p, f));
              }),
            );
          }
        });
      });
    },
    readdirSync(p) {
      try {
        return fs.readdirSync(p).map(f => {
          return normalizePath(path.join(p, f));
        });
      } catch (e) {}
      return [];
    },
    readFile(p) {
      return new Promise(resolve => {
        fs.readFile(p, 'utf8', (_, data) => {
          resolve(data);
        });
      });
    },
    readFileSync(p) {
      try {
        return fs.readFileSync(p, 'utf8');
      } catch (e) {}
      return undefined;
    },
    realpath(p) {
      return new Promise(resolve => {
        fs.realpath(p, 'utf8', (_, data) => {
          resolve(data);
        });
      });
    },
    realpathSync(p) {
      try {
        return fs.realpathSync(p, 'utf8');
      } catch (e) {}
      return undefined;
    },
    rename(oldPath, newPath) {
      return new Promise(resolve => {
        fs.rename(oldPath, newPath, error => {
          resolve({ oldPath, newPath, error, oldDirs: [], oldFiles: [], newDirs: [], newFiles: [], renamed: [], isFile: false, isDirectory: false });
        });
      });
    },
    resolvePath(p) {
      return normalizePath(p);
    },
    rmdir(p, opts) {
      return new Promise(resolve => {
        const recursive = !!(opts && opts.recursive);
        if (recursive) {
          fs.rmdir(p, { recursive: true }, err => {
            resolve({ basename: path.basename(p), dirname: path.dirname(p), path: p, removedDirs: [], removedFiles: [], error: err });
          });
        } else {
          fs.rmdir(p, err => {
            resolve({ basename: path.basename(p), dirname: path.dirname(p), path: p, removedDirs: [], removedFiles: [], error: err });
          });
        }
      });
    },
    rmdirSync(p, opts) {
      try {
        const recursive = !!(opts && opts.recursive);
        if (recursive) {
          fs.rmdirSync(p, { recursive: true });
        } else {
          fs.rmdirSync(p);
        }
        return { basename: path.basename(p), dirname: path.dirname(p), path: p, removedDirs: [], removedFiles: [], error: null };
      } catch (e) {
        return { basename: path.basename(p), dirname: path.dirname(p), path: p, removedDirs: [], removedFiles: [], error: e };
      }
    },
    stat(p) {
      return new Promise(resolve => {
        fs.stat(p, (err, s) => {
          if (err) {
            resolve(undefined);
          } else {
            resolve(s);
          }
        });
      });
    },
    statSync(p) {
      try {
        return fs.statSync(p);
      } catch (e) {}
      return undefined;
    },
    unlink(p) {
      return new Promise(resolve => {
        fs.unlink(p, err => {
          resolve({
            basename: path.basename(p),
            dirname: path.dirname(p),
            path: p,
            error: err,
          });
        });
      });
    },
    unlinkSync(p) {
      const results: CompilerSystemUnlinkResults = {
        basename: path.basename(p),
        dirname: path.dirname(p),
        path: p,
        error: null,
      };
      try {
        fs.unlinkSync(p);
      } catch (e) {
        results.error = e;
      }
      return results;
    },
    writeFile(p, content) {
      return new Promise(resolve => {
        fs.writeFile(p, content, err => {
          resolve({ path: p, error: err });
        });
      });
    },
    writeFileSync(p, content) {
      const results: CompilerSystemWriteFileResults = {
        path: p,
        error: null,
      };
      try {
        fs.writeFileSync(p, content);
      } catch (e) {
        results.error = e;
      }
      return results;
    },
    generateContentHash(content, length) {
      let hash = createHash('sha1').update(content).digest('hex').toLowerCase();

      if (typeof length === 'number') {
        hash = hash.substr(0, length);
      }
      return Promise.resolve(hash);
    },
    copy: nodeCopyTasks,
    details: getDetails(),
  };

  const nodeResolve = new NodeResolveModule();

  sys.lazyRequire = new NodeLazyRequire(nodeResolve, {
    '@types/jest': ['24.9.1', '25.2.3'],
    '@types/puppeteer': ['1.19.0', '2.0.1'],
    'jest': ['24.9.0', '26.0.1'],
    'jest-cli': ['24.9.0', '26.0.1'],
    'pixelmatch': ['4.0.2', '4.0.2'],
    'puppeteer': ['1.19.0', '2.1.1'],
    'puppeteer-core': ['1.19.0', '2.1.1'],
    'workbox-build': ['4.3.1', '4.3.1'],
  });

  return sys;
}

const getDetails = () => {
  const details: SystemDetails = {
    cpuModel: '',
    cpus: -1,
    freemem() {
      return freemem();
    },
    platform: '',
    release: '',
    runtime: 'node',
    runtimeVersion: '',
    tmpDir: tmpdir(),
    totalmem: -1,
  };
  try {
    const sysCpus = cpus();
    details.cpuModel = sysCpus[0].model;
    details.cpus = sysCpus.length;
    details.platform = platform();
    details.release = release();
    details.runtimeVersion = process.version;
    details.totalmem = totalmem();
  } catch (e) {}
  return details;
};