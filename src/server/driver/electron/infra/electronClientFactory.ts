import memoize from 'lodash/memoize';

import ElectronAppClient from 'client/driver/electron';
import { kvDbFactory } from 'driver/sqlite';

export default memoize(() => new ElectronAppClient(kvDbFactory()));
