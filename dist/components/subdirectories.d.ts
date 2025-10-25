interface Note {
    id: number;
    title: string;
    icon: string;
    text: string;
    folder: string;
    favorite: boolean;
}
interface SubdirectoriesParams {
    items: Note[];
}
/**
 * Список заметок (без вложенности)
 * @param {Array} items - массив заметок
 */
export declare function Subdirectories({ items }: SubdirectoriesParams): HTMLElement;
export {};
