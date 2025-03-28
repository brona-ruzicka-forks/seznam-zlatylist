import React from "react";

import { DeepMutable } from "../typeutil";

import type { BookItem, AuthorItem, CategoryItem } from "./databaseStructure";
import DatabaseContext from "./DatabaseContext";
import databaseDefault from "./databaseDefault";

import { Data } from "./dataStructure";
import useGlobalStateModifier from "../globalstate/useGlobalStateModifier";

export default function DatabaseLoader(props: {
    children?: React.ReactNode | undefined,
}) {

    const [ request, setRequest ] = React.useState<{
        loaded: boolean,
        result: Data|null,
        error: any|null
    }>({
        loaded: false,
        result: null,
        error: null
    });

    React.useEffect(() => {
        const pathname = window.location.pathname;
        const path = pathname.substring(0, pathname.lastIndexOf("/"));

        fetch(`${window.location.origin}${path}/data/data.json?override_cache=${Date.now()}`)
            .then(res => res.json())
            .then(
                (result) => {
                    setRequest({
                        loaded: true,
                        result,
                        error: null,
                    });
                },
                (error) => {
                    setRequest({
                        loaded: true,
                        result: null,
                        error: error,
                    });
                    console.log(error);
                }
            )

    }, [ ]);

    const modify = useGlobalStateModifier();
    const [ database, setDatabase ] = React.useState(databaseDefault);

    React.useEffect(() => {

        if (request.loaded === false) {
            return;
        } else if (request.error !== null || request.result === null) {
            modify({ error: "open" });
            return;
        }

        try {
            const data = request.result;

            const books: Record<number, DeepMutable<BookItem>> = {};
            const authors: Record<number, DeepMutable<AuthorItem>> = {};
            const categories: Record<number, DeepMutable<CategoryItem>> = {};


            data.authors.forEach(author => authors[author.id] = {
                id: author.id,
                short: author.short ?? author.name,
                name: author.name,
                aliases: author.aliases ?? [],

                books: [],
                categories: [],
            });
            data.categories.forEach(category => categories[category.id] = {
                id: category.id,
                short: category.short ?? category.name,
                name: category.name,

                books: [],
                authors: [],
            });

            data.books.forEach(book => {
                const bookItem = books[book.id] = {
                    id: book.id,
                    name: book.name,
                    note: book.note,
                    
                    authors: book.authors?.map(id => authors[id]) ?? [],
                    categories: book.categories?.map(id => categories[id]) ?? [],
                };

                bookItem.authors.forEach(author => {
                    author.books.push(bookItem);
                    bookItem.categories.forEach(category => {
                        if (!author.categories.includes(category))
                            author.categories.push(category)
                    });
                });

                bookItem.categories.forEach(category => {
                    category.books.push(bookItem);
                    bookItem.authors.forEach(author => {
                        if (!category.authors.includes(author))
                            category.authors.push(author);
                    });
                });

            });

            setDatabase({
                loaded: true,
                books: books,
                authors: authors,
                categories: categories,
            });

            return;
        } catch (e) {
            modify({ error: "open" });
        }


    }, [ request, modify ]);

    return (
        <DatabaseContext.Provider
            value={ database }
        >
            { props.children }
        </DatabaseContext.Provider>
    );
};







