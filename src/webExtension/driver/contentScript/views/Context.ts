import { createContext } from 'react';
import type ClipService from 'service/ClipService';
import type ConfigService from 'service/ConfigService';

export default createContext<{ clipService: ClipService; configService: ConfigService }>(null as never);
