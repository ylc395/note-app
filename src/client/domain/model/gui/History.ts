// import EventEmitter from "eventemitter3";
import type Note from "domain/model/content/Note";



// export default class History extends EventEmitter {

//   readonly #stack: Record<> = [];

//   #pointer = -1;

//   get currentState(): HistoryState | undefined {
//     return this.#stack[this.#pointer];
//   }

//   readonly back = () => {
//     if (this.#pointer <= 0) {
//       throw new Error("can not go back");
//     }

//     this.#pointer -= 1;
//   }

//   readonly forward = () => {
//     if (this.#pointer >= this.#stack.length - 1) {
//       throw new Error("can not go forward");
//     }

//     this.#pointer += 1;
//   }

//   readonly push = (note: Note) => {
//     this.#stack[this.#pointer + 1] = {
//         noteId: note.id,
//         scroll: this.#editor.getScroll(),
//         cursor: this.#editor.getCursor(),
//     };
//     this.#pointer += 1;
//     this.#stack.splice(this.#pointer);
//   }
// }