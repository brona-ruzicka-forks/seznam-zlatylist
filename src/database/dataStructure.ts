import type { Nullable } from "../typeutil";

type Referable<I extends number | string> = { id: I }
type Reference<R> = R extends Referable<infer I> ? I : never;

type BookData = Readonly<{
    id: number,
    name: string,
    note: Nullable<string>,

    authors: Nullable<ReadonlyArray<Reference<AuthorData>>>,
    categories: Nullable<ReadonlyArray<Reference<CategoryData>>>,
}>;

type AuthorData = Readonly<{
    id: number,
    short: Nullable<string>,
    name: string,
    aliases: Nullable<string[]>
}>;

type CategoryData = Readonly<{
    id: number,
    short: Nullable<string>,
    name: string,
}>;


type Data = Readonly<{
    books: ReadonlyArray<BookData>,
    authors: ReadonlyArray<AuthorData>,
    categories: ReadonlyArray<CategoryData>,
}>;


export type {
    Referable,
    Reference,
    BookData,
    AuthorData,
    CategoryData,
    Data,
};