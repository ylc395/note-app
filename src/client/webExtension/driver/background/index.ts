import 'reflect-metadata';
import { expose } from 'comlink';
import { chromeRuntimeMessageEndpoint } from 'comlink-adapters';

import BackgroundService from 'service/BackgroundService';

expose(new BackgroundService(), chromeRuntimeMessageEndpoint());
