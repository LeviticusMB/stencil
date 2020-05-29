import { CompilerSystem, Logger } from '../../../declarations';
import { createDenoLogger } from '../deno-logger';
import { createDenoSysWithWatch } from '../deno-sys-watch';
import { join } from 'path';
import { parseFlags } from '../../../cli/parse-flags';
import { runTask } from '../../../cli/run-task';
import { shouldIgnoreError, hasError } from '@utils';
import { setupWorkerController } from '../worker';
import { taskVersion } from '../../../cli/task-version';

export async function run(init: CliInitOptions) {
  if (!init) {
    throw new Error('cli missing run init');
  }
  const logger = init.logger;
  if (!logger) {
    throw new Error('cli run missing "logger"');
  }
  const sys = init.sys;
  if (!sys) {
    throw new Error('cli run missing "sys"');
  }

  try {
    const flags = parseFlags(Deno.args);

    if (flags.ci) {
      logger.colors = false;
    }

    if (flags.task === 'version' || flags.version) {
      return taskVersion();
    }

    if (flags.help) {
      flags.task = 'help';
    }

    if (sys.getCompilerExecutingPath == null) {
      sys.getCompilerExecutingPath = getCompilerExecutingPath;
    }

    const { loadConfig } = await import('@stencil/core/compiler');

    const validated = await loadConfig({
      config: {
        flags,
      },
      configPath: flags.config,
      logger,
      sys,
    });

    if (validated.diagnostics.length > 0) {
      logger.printDiagnostics(validated.diagnostics);
      if (hasError(validated.diagnostics)) {
        Deno.exit(1);
      }
    }

    setupWorkerController(sys, logger, 'stencil-compiler-worker');

    await runTask(validated.config, validated.config.flags.task);
  } catch (e) {
    if (!shouldIgnoreError(e)) {
      logger.error(`uncaught cli error: ${e}${logger.level === 'debug' ? e.stack : ''}`);
      Deno.exit(1);
    }
  }
}

function getCompilerExecutingPath() {
  return join(__dirname, '..', 'compiler', 'stencil.js');
}

export interface CliInitOptions {
  logger?: Logger;
  sys?: CompilerSystem;
}

export { createDenoLogger, createDenoSysWithWatch as createDenoSystem, parseFlags, runTask };

declare const Deno: any;
