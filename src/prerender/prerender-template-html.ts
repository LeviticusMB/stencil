import * as d from '../declarations';
import { catchError } from '@utils';
import { inlineExternalStyleSheets, minifyScriptElements, minifyStyleElements } from './prerender-optimize';
import fs from 'fs';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);

export async function generateTemplateHtml(
  prerenderConfig: d.PrerenderConfig,
  diagnostics: d.Diagnostic[],
  isDebug: boolean,
  srcIndexHtmlPath: string,
  outputTarget: d.OutputTargetWww,
  hydrateOpts: d.PrerenderHydrateOptions,
) {
  try {
    const { createDocument, serializeNodeToHtml } = await import('@stencil/core/mock-doc');

    if (typeof srcIndexHtmlPath !== 'string') {
      srcIndexHtmlPath = outputTarget.indexHtml;
    }
    let templateHtml: string;
    if (typeof prerenderConfig.loadTemplate === 'function') {
      templateHtml = await prerenderConfig.loadTemplate(srcIndexHtmlPath);
    } else {
      templateHtml = await readFile(srcIndexHtmlPath, 'utf8');
    }

    let doc = createDocument(templateHtml);

    let staticSite = false;

    if (prerenderConfig.staticSite) {
      // purposely do not want any clientside JS
      // go through the document and remove only stencil's scripts
      const stencilScripts = doc.querySelectorAll('script[data-stencil]');
      for (let i = stencilScripts.length - 1; i >= 0; i--) {
        stencilScripts[i].remove();
      }
      staticSite = true;
    } else {
      // config didn't set if it's a staticSite only,
      // but the HTML may not have any stencil scripts at all,
      // so we'll need to know that so we don't add preload modules
      const stencilScript = doc.querySelector('script[data-stencil]');

      // if there isn't at least one stencil script then it's a static site
      staticSite = !stencilScript;
    }

    doc.documentElement.classList.add('hydrated');

    if (hydrateOpts.inlineExternalStyleSheets && !isDebug) {
      try {
        await inlineExternalStyleSheets(outputTarget.appDir, doc);
      } catch (e) {
        catchError(diagnostics, e);
      }
    }

    if (hydrateOpts.minifyScriptElements && !isDebug) {
      try {
        await minifyScriptElements(doc);
      } catch (e) {
        catchError(diagnostics, e);
      }
    }

    if (hydrateOpts.minifyStyleElements && !isDebug) {
      try {
        await minifyStyleElements(doc);
      } catch (e) {
        catchError(diagnostics, e);
      }
    }

    if (typeof prerenderConfig.beforeSerializeTemplate === 'function') {
      doc = await prerenderConfig.beforeSerializeTemplate(doc);
    }

    let html = serializeNodeToHtml(doc);
    if (typeof prerenderConfig.afterSerializeTemplate === 'function') {
      html = await prerenderConfig.afterSerializeTemplate(html);
    }

    return {
      html,
      staticSite,
    };
  } catch (e) {
    catchError(diagnostics, e);
  }
  return undefined;
}
