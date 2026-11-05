import { resolve, sep } from 'node:path';
import type { Plugin } from 'vite';
import { generateGrammar } from './grammar.ts';

export function grammarAuthoring(
  root = resolve('content/grammar'),
  output = resolve('public/grammar.json'),
): Plugin {
  return {
    name: 'grammar-authoring',
    configureServer(server) {
      server.watcher.add(root);
      const update = (_event: string, path: string) => {
        if (!resolve(path).startsWith(root + sep) || !path.endsWith('.yaml')) return;
        try {
          generateGrammar(false, root, output);
          server.ws.send({ type: 'full-reload' });
        } catch (error) {
          const message = (error as Error).message;
          server.config.logger.error(message);
          server.ws.send({ type: 'error', err: { message, stack: '' } });
        }
      };
      server.watcher.on('all', update);
      server.httpServer?.once('close', () => server.watcher.off('all', update));
    },
  };
}
