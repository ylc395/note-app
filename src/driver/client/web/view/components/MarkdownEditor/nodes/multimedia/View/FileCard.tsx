import type { FileVO } from '#domain/shared/model/file';

export default function FileCard(props: { file: FileVO }) {
  return <div>{props.file.id}</div>;
}
