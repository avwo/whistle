/// <reference types="node" />

import { IncomingMessage, ServerResponse, Server } from 'http';
import EventEmitter from 'events';

export type WhistleBody = string | false;

export interface WhistleFrame {
 reqId: string;
 frameId: string;
 base64?: string;
 bin?: '' | Buffer;
 text?: string;
 mask?: boolean;
 compressed?: boolean;
 length?: number;
 opcode?: number;
 isClient?: boolean;
 err?: string;
 closed?: true;
 code?: string | number;
 [propName: string]: any;
}

export interface WhistleSession {
 id: string;
 url: string;
 useH2?: boolean;
 isHttps?: boolean;
 startTime: number;
 dnsTime?: number;
 requestTime: number;
 responseTime: number;
 endTime?: number;
 req: {
   method?: string;
   httpVersion?: string;
   ip?: string;
   port?: string | number;
   rawHeaderNames?: object;
   headers: object;
   size?: number;
   body?: WhistleBody;
   base64?: WhistleBody;
   rawHeaders?: object;
   [propName: string]: any;
 };
 res: {
   ip?: string;
   port?: string | number;
   rawHeaderNames?: object;
   statusCode?: number | string;
   statusMessage?: string;
   headers?: object;
   size?: number;
   body?: WhistleBody;
   base64?: WhistleBody;
   rawHeaders?: object;
   [propName: string]: any;
 };
 rules: object;
 rulesHeaders?: object;
 frames?: WhistleFrame[];
 [propName: string]: any;
}

export type WhistleSecureFilter = ((item: WhistleSession, clientIp?: string, filter?: string) => WhistleSession) | string;

export interface WhistleOptions {
  config?: string;
  cluster?: number;
  server?: EventEmitter | Server;
  debugMode?: boolean;
  mode?: string;
  realPort?: number;
  realHost?: string;
  port?: number | string;
  uiport?: number | string;
  socksPort?: number | string;
  httpPort?: number | string;
  httpsPort?: number | string;
  host?: string;
  authKey?: string;
  guestAuthKey?: string;
  reqCacheSize?: number;
  frameCacheSize?: number;
  allowMultipleChoice?: boolean;
  timeout?: number;
  username?: string;
  password?: string;
  guestName?: string;
  guestPassword?: string;
  disableAllRules?: boolean;
  disableAllPlugins?: boolean;
  replaceExistRule?: boolean;
  replaceExistValue?: boolean;
  allowPluginList?: boolean;
  blockPluginList?: boolean;
  webUIPath?: string;
  certDir?: string;
  middleware?: string;
  uiMiddleware?: string;
  cmdName?: string;
  account?: string;
  dnsServer?: string;
  projectPluginsPath?: string | string[];
  accountPluginsPath?: string | string[];
  customPluginsPath?: string | string[];
  notUninstallPluginPath?: string | string[];
  pluginsPath?: string | string[];
  addonsPath?: string | string[];
  inspect?: boolean;
  inspectBrk?: boolean;
  secureFilter?: WhistleSecureFilter;
  encrypted?: boolean;
  sockets?: number;
  dataDirname?: string;
  storage?: string;
  baseDir?: string;
  noGlobalPlugins?: boolean;
  pluginsDataMap?: object;
  globalData?: object;
  localUIHost?: string;
  extra?: string;
  rules?: object;
  values?: object;
  shadowRules?: string;
  dnsCache?: number;
  allowDisableShadowRules?: boolean;
  customHandler?: (req: IncomingMessage, res: ServerResponse, next?: Function) => void;
  pluginHost?: string;
  copy?: string;
  [propName: string]: any;
}

export interface WhistleAuth {
 username?: string;
 password?: string;
 guestName?: string;
 guestPassword?: string;
 guest?: {
   username?: string;
   password?: string;
 };
}

export interface WhistleRuntimeInfo {
 memUsage: NodeJS.MemoryUsage;
 uptime: number;
 cpuPercent: string;
 startupTime: number;
 updateTime: number;
 httpRequests: number;
 allHttpRequests: number;
 wsRequests: number;
 allWsRequests: number;
 tunnelRequests: number;
 totalHttpRequests: number;
 totalWsRequests: number;
 totalTunnelRequests: number;
 totalAllHttpRequests: number;
 totalAllWsRequests: number;
 httpQps: number;
 tunnelQps: number;
 wsQps: number;
 totalQps: number;
 maxQps: number;
 maxAllQps: number;
 maxRss: number;
 maxCpu: number;
}

export type WhistleLogFn = (msg: Object, ...restMsg: Object[]) => void;

export interface WhistleResult {
 logger: {
   log: (msg: Object, level?: string) => void;
   fatal: WhistleLogFn;
   error: WhistleLogFn;
   warn: WhistleLogFn;
   info: WhistleLogFn;
   debug: WhistleLogFn;
 };
 getWhistlePath(): string;
 setAuth(auth: WhistleAuth): void;
 setUIHost(host: string | string[]): void;
 setPluginUIHost(pluginName: string, host: string | string[]): void;
 getRuntimeInfo(): WhistleRuntimeInfo;
 getShadowRules(): string;
 setShadowRules(shadowRules: string): void;
 [propName: string]: any;
}

export type WhistleCallback = (result?: WhistleResult) => void;

export function getWhistlePath(): string;

export default function(options?: WhistleOptions | WhistleCallback, callback?: WhistleCallback): WhistleResult;
