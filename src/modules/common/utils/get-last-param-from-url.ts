import { standardizeUrl } from "./standardize-url";

export function getLastParamFromUrl(url: string): string {
  return standardizeUrl(url).split('/').pop();
}