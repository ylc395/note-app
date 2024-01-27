import { createContext } from 'react';

import type PdfEditor from '@domain/app/model/material/editor/PdfEditor';

export default createContext<{ editor: PdfEditor }>(null as never);
