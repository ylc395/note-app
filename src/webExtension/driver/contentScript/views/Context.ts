import { createContext } from 'react';
import type ClipService from 'service/ClipService';

export default createContext<{ clipService: ClipService }>(null as never);
