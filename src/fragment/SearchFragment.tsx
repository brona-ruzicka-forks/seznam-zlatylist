import React from "react";

import { styled, useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton"
import Tooltip from "@mui/material/Tooltip"

import Clear from "@mui/icons-material/Clear";
import ArrowDropUp from "@mui/icons-material/ArrowDropUp";
import ArrowDropDown from "@mui/icons-material/ArrowDropDown";
import Abc from "@mui/icons-material/Abc";
import Person from "@mui/icons-material/Person";
import AccessTime from "@mui/icons-material/AccessTime";

import useDatabase from "../database/useDatabase";
import type { BookItem, AuthorItem, CategoryItem } from "../database/databaseStructure";

import useSelection from "../selection/useSelection";
import useAutohideQueryParam from "../queryparams/useAutohideQueryParam";
import useSearch from "../hook/useSearch";
import useCookie from "../cookie/useCookie";
import { Group } from "@mui/icons-material";


const sorts = [
    "book_asc",
    "book_desc",
    "author_asc",
    "author_desc",
] as const;

type Sort = typeof sorts[number];


export default function SearchFragment() {

    const selection = useSelection();

    const database = useDatabase();


    const theme = useTheme();
    const smallOrMedium = useMediaQuery(theme.breakpoints.down("md"));

    const [ tab ] = useAutohideQueryParam("tab");
    const autoFocus = !smallOrMedium || tab === "search";


    const [ sortStr, setSort ] = useCookie("sort");
    const sort: Sort = sorts.includes(sortStr as Sort) ? sortStr as Sort : sorts[0];
    const cycleSort = React.useCallback(() => {
        setSort(sorts[(sorts.indexOf(sort) + 1) % sorts.length]);
    }, [sort, setSort]);
    const reverseCycleSort = React.useCallback(() => {
        setSort(sorts[(sorts.indexOf(sort) - 1 + sorts.length) % sorts.length]);
    }, [sort, setSort]);


    const [ searchParam, setSearchParam ] = useAutohideQueryParam("search");
    const [ searchText, setSearchText ] = React.useState(searchParam);
    const searchOld = React.useRef(searchText);

    const setSearch = React.useCallback(
        (text: string) => {
            setSearchText(text);
            setSearchParam(text, true);
            searchOld.current = text;
        },
        [setSearchText, setSearchParam, searchOld]
    );

    let search = "";
    if (searchParam === searchText) {
        search = searchText;
    } else if (searchParam === searchOld.current) {
        search = searchText;
    } else {
        search = searchParam;
    }

    const searchIndex = React.useMemo<Readonly<{
        books: (readonly [ string, BookItem ])[],
        authors: (readonly [ string, AuthorItem ])[],
        categories: (readonly [ string, CategoryItem ])[],
    }>>(() => {
        if (!database.loaded)
            return {
                books: [],
                authors: [],
                categories: [],
            };

        const books = Object.values(database.books).flatMap(book => [
            [normalize(book.name), book] as const,
            ...( book.note ? [ [ normalize(book.note), book] as const ] : [] )
        ]);

        const authors = Object.values(database.authors).flatMap(author => [
            [normalize(author.name), author] as const,
            [normalize(author.short), author] as const,
            ...author.aliases?.map(alias => [normalize(alias), author] as const)
        ] as const);

        const categories = Object.values(database.categories).flatMap(category => [
            [normalize(category.name), category] as const,
            [normalize(category.short), category] as const,
        ] as const);


        return {
            books,
            authors,
            categories,
        };
    }, [ database ]);

    const matched = React.useMemo(() => {

        const keywordStrings = search.match(/\\?.|^$/g)!.reduce((reducer, char) => {
            if (char === '"') {
                reducer.quote ^= 1;
            } else if (!reducer.quote && char === ' '){
                reducer.arr.push('');
            } else {
                reducer.arr[reducer.arr.length-1] += char.replace(/\\(.)/,"$1");
            }
            return reducer;
        }, { arr: [''], quote: 0 }).arr

        const matches = keywordStrings.flatMap(str => {
            const word = str.split(/\s+/, 1)[0];
            let category = "any";
            let string = str;

            if (word.includes(":")) {
                const splitIndex = word.indexOf(":");
                category = normalize(word.substring(0, splitIndex));
                string = str.substring(splitIndex + 1);
            }

            const words = normalize(string).split(/\s+/);

            const matches = words.map(word => {
                switch (category) {
                    case "ucastnik":
                    case "jmeno":
                        return searchIndex.books.filter(([query, _]) => query.includes(word)).map(([_, book]) => book);
                    case "tym":
                        return searchIndex.authors.filter(([query, _]) => query.includes(word)).flatMap(([_, author]) => author.books)
                    case "kategorie":
                    case "kat":
                    case "cat":
                        return searchIndex.categories.filter(([query, _]) => query.includes(word)).flatMap(([_, category]) => category.books);
                    case "vybrano":
                    case "vyb":
                        if (!database.loaded) break;
                        if (word.trim() === "ne" || word.trim() === "no")
                            return Object.values(database.books).filter(book => !selection.includes(book.id));
                        return Object.values(database.books).filter(book => selection.includes(book.id));
                    default:
                        return [
                            ...searchIndex.books.filter(([query, _]) => query.includes(word)).map(([_, book]) => book),
                            ...searchIndex.authors.filter(([query, _]) => query.includes(word)).flatMap(([_, author]) => author.books),
                            ...searchIndex.categories.filter(([query, _]) => query.includes(word)).flatMap(([_, category]) => category.books)
                        ]    
                }
                
                return [];

            }).map(books => books
                .reduce((red, val) => {
                    red[val.id] = val;
                    return red;
                }, {} as Record<number, BookItem>)
            );

            return matches;
            
        })

        return Object.values(database.books)
            .filter(book => matches.every(match => book.id in match))
            .reduce((red, val) => {
                red[val.id] = val;
                return red;
            }, {} as Record<number, BookItem>);

    }, [searchIndex, search, selection, database ]);

    const sortedBooks = React.useMemo(() => {

        let sortingFun: (a: BookItem, b: BookItem) => number;

        switch (sort) {
            case "book_asc":
                sortingFun = (a,b) =>
                    a.name.localeCompare(b.name, "cs");
                break;

            case "book_desc":
                sortingFun = (a,b) =>
                    b.name.localeCompare(a.name, "cs");
                break;

            case "author_asc":
                sortingFun = (a,b) => 
                    ((a.authors[0]?.short ?? "").localeCompare(b.authors[0]?.short ?? "", "cs")) ||
                    a.name.localeCompare(b.name, "cs");
                break;

            case "author_desc":
                sortingFun = (a,b) =>
                    ((b.authors[0]?.short ?? "").localeCompare(a.authors[0]?.short ?? "", "cs")) ||
                    a.name.localeCompare(b.name, "cs");
                break;

        }

        return Object.values(database.books).sort(sortingFun!);

    }, [ sort, database ]);

    return (
        <Stack sx={{ height: "100%" }}>
            <Box sx={{ position: "relative" }}>
                <StyledTextField
                    variant="standard"
                    placeholder="Prohledat účastníky…"
                    autoFocus={autoFocus}
                    fullWidth
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onKeyUp={e => {
                        if (e.code === "Enter") {
                            e.preventDefault();

                            const values = Object.values(matched);
                            if (values.length === 1) {
                                selection.toggle(values[0].id);
                                setSearch("");
                            } else if (e.ctrlKey) {
                                values.forEach(value => selection.toggle(value.id));
                                setSearch("");
                            }
                        }
                    }}
                />
                <Stack
                    direction="row"
                    sx={{
                        position: "absolute",
                        top: "60%",
                        right: theme => theme.spacing(2),
                        transform: "translateY(-60%)",
                    }}
                >
                    <IconButton
                        onClick={() => setSearch("")}
                    >
                        <Clear/>
                    </IconButton>
                    <Tooltip
                        title={{
                            book_asc: "Řazení: Účastník, Vzestupně",
                            book_desc: "Řazení: Účastník, Sestupně",
                            author_asc: "Řazení: Tým, Vzestupně",
                            author_desc: "Řazení: Tým, Sestupně",
                        }[sort]}
                    
                    >
                        <IconButton
                            onClick={cycleSort}
                            onContextMenuCapture={e => { e.preventDefault(); e.stopPropagation(); reverseCycleSort() }}
                            sx={{ position: "relative" }}
                        >
                            <ArrowDropUp
                                fontSize="small"
                                sx={{
                                    position: "absolute",
                                    pointerEvents: "none",
                                    top: "-10%",
                                }}
                                color={sort.endsWith("asc") ? "action" : "disabled"}
                            />
                            { sort.startsWith("book")   && <Person/>        } 
                            { sort.startsWith("author") && <Group/>         }
                            <ArrowDropDown
                                fontSize="small"
                                sx={{
                                    position: "absolute",
                                    pointerEvents: "none",
                                    bottom: "-10%",
                                }}
                                color={sort.endsWith("desc") ? "action" : "disabled"}
                            />
                        </IconButton>
                    </Tooltip>
                </Stack>
            </Box>
            <List sx={{ overflow: "auto" }}>
                {
                    sortedBooks.map(book => (
                        <ListItem key={book.id} sx={{ paddingRight: 4, paddingLeft: 4, ...(book.id in matched ? {} : { display: "none" }) }}>
                            <MemoListItemContent book={book} checked={selection.includes(book)} toggleChecked={() => selection.toggle(book.id)}/>
                        </ListItem>
                    ))
                }
            </List>
        </Stack>
    );

}


const normalize = (input: string): string => {
    return input.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f,.:;?!_\\/-]/g, "");
}


const StyledTextField = styled(TextField)(({theme}) => ({
    "& > * > input": {
        height: theme.spacing(3),
        lineHeight: theme.spacing(3),
        padding: theme.spacing(2),
        paddingRight: theme.spacing(12),
        paddingTop: theme.spacing(3),
    }
}))

const CustomListItemContent = (props: {
    book: BookItem,
    checked: boolean,
    toggleChecked: () => void
}) => {

    const search = useSearch();

    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"))
    const isMediumScreen = useMediaQuery(theme.breakpoints.between("md","lg"))

    return (<>
        <ListItemButton
            role={undefined}
            onClick={props.toggleChecked}
            sx={{
                position: "absolute",
                padding: 0,
                top: 0,
                left: 0,
                width: "100%",
                height: "100%"
            }}
        />
        <ListItemIcon>
            <Checkbox
                edge="start"
                checked={props.checked}
                tabIndex={-1}
                disableRipple
                sx={{ pointerEvents:"none" }}
            />
        </ListItemIcon>
        <ListItemText id={`${props.book.id}`}
            primary={
                (<>
                    {props.book.name}
                </>)
            }
            secondary={
                (<>
                    {
                        isSmallScreen ? (
                            props.book.authors?.map(author => author.short).join(" • ") + " • " + props.book.categories?.map(category => category.name).join(" • ")
                        ) : (
                            props.book.authors?.map(author => author.name).join(", ") || undefined
                        )
                    }
                </>)
            }
        />
        {!isSmallScreen && (<Stack direction={isMediumScreen ? "column" : "row-reverse"} spacing={1}>
            {props.book.categories.map(category => (
                <Chip
                    sx={{alignSelf: "end"}}
                    key={category.id}
                    size="small"
                    variant="outlined"
                    label={category.name}
                    onClick={() => search(`kategorie:"${category.name}"`)}
                />
            ))}
        </Stack>)}
    </>)
}

const MemoListItemContent = React.memo(CustomListItemContent, (old, next) => {
    return old.book === next.book && old.checked === next.checked
});
