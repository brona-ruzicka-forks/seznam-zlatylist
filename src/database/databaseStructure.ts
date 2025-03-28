
import type { Nullable, ReadonlyRecord } from "../typeutil";


type BookItem = Readonly<{
    id: number,
    name: string,
    note: Nullable<string>
    
    authors: ReadonlyArray<AuthorItem>,
    categories: ReadonlyArray<CategoryItem>,
}>;

type AuthorItem = Readonly<{
    id: number,
    short: string,
    name: string,
    aliases: string[]

    books: ReadonlyArray<BookItem>,
    categories: ReadonlyArray<CategoryItem>,
}>;

type CategoryItem = Readonly<{
    id: number,
    short: string,
    name: string

    books: ReadonlyArray<BookItem>,
    authors: ReadonlyArray<AuthorItem>,
}>;



type EmptyDatabase = {
    loaded: false,
    books: {},
    authors: {},
    categories: {},
};

type LoadedDatabase = {
    loaded: true,
    books: ReadonlyRecord<number, BookItem>,
    authors: ReadonlyRecord<number, AuthorItem>,
    categories: ReadonlyRecord<number, CategoryItem>,
};

type Database = EmptyDatabase | LoadedDatabase;


export type {
    Database,
    EmptyDatabase,
    LoadedDatabase,
    BookItem,
    AuthorItem,
    CategoryItem
};
