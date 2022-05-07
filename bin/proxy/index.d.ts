export interface ProxyOptions {
  host: string;
  port: number;
  bypass?: string;
}

export function enableProxy(options: ProxyOptions): boolean;

export function disableProxy(): boolean;
