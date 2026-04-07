export async function transferItemToFileDTO(item: DataTransferItem) {
  const file = item.getAsFile();

  if (!file) {
    return null;
  }

  return {
    name: file.name,
    data: await file.arrayBuffer(),
    mimeType: file.type,
  };
}
