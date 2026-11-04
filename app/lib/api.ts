import { staticApi } from './static-api';

export async function api(resource: string, body?: unknown): Promise<any> {
  return staticApi(resource, body);
}
