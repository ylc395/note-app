export enum Actions {
  SelectElement = 'SELECT_ELEMENT',
  SelectPage = 'SELECT_PAGE',
  ExtractText = 'EXTRACT_TEXT',
  ExtractSelection = 'EXTRACT_SELECTION',
  ScreenShot = 'SCREENSHOT',
}

export interface ActionRequest {
  action: Actions;
}
