import React from "react";

import { Font, Document, Page, Text, View } from '@react-pdf/renderer';

import { BookItem } from '../database/databaseStructure';

Font.register({
    family: "Arial", fonts: [
        { src: `${process.env.PUBLIC_URL}/static/font/arial-default.ttf` },
        { src: `${process.env.PUBLIC_URL}/static/font/arial-bold.ttf`, fontWeight: "bold" }
    ]
});

Font.registerHyphenationCallback(word => (
    [word]
));

// Create Document Component
export default function SeznamCetby(props: {
    personName: string,
    personClass: string,
    count: string,
    dateOfIssue: string | null,
    pronouncement: boolean,
    books: BookItem[]
}) {

    let countInt = NaN;

    try {
        countInt = parseInt(props.count);
    } catch { }
    
    if ( isNaN(countInt) )
        countInt = 0;



    const sorted = React.useMemo(() => {

        const sorted = props.books.sort((a,b) => 
            (a.authors[0]?.short ?? "").localeCompare(b.authors[0]?.short ?? "") ||
            a.name.localeCompare(b.name)
        )

        return sorted;
    }, [ props.books ]);


    let items = [];
    for (let i = 0; i < Math.max(countInt, sorted.length); i++) {
        
        if (i < sorted.length) {
            let index = i;
            let book = sorted[i];

            items[i] = (
                <>
                    <Row
                        first={<Text>{`${index + 1}.`}</Text>}
                        second={<Text>{book.categories[0].short.toUpperCase()}</Text>}
                        flex={<Text>{book.name.split(/,\s*/).reverse().join(" ")}{book.authors.length > 0 && (" (" + book.authors.map(author => author.short).join(", ") + ")")}</Text>}
                    />
                    <Separator orientation="vertical"/>
                </>
            );
        } else {
            items[i] = (
                <>
                    <Row
                        first={<Text>{`${i + 1}.`}</Text>}
                        second={<Text>{" "}</Text>}
                        flex={<Text>{" "}</Text>}
                    />
                    <Separator orientation="vertical"/>
                </>
            );
        }
    }


    return (
        <Document
            title={`${props.personClass} - ${props.personName}`}
        >
            <Page size="A4" style={{
                fontFamily: "Arial",
                lineHeight: "1.2",
                textAlign: "center",
                padding: "2.5cm",
                display: "flex",
                flexDirection: "column",
            }}>
                <View style={{
                    textAlign: "center",
                    fontWeight: "bold",
                }}>
                    <Text style={{
                        fontSize: 18,
                    }}>
                        {`${props.personName}`}
                    </Text>
                    <Padder padding={10} />
                    <Text style={{
                        fontSize: 14,
                    }}>
                        {`${props.personClass.toUpperCase()}`}
                    </Text>
                </View>
                <Padder padding={15} />
                <View style={{
                    flex: 1,
                    fontSize: 12
                }}>
                    <Separator orientation="vertical"/>
                    <Row
                        first={<Text style={{ fontSize: 14, fontWeight: "bold" }}>{"Pořadí"}</Text>}
                        second={<Text style={{ fontSize: 14, fontWeight: "bold" }}>{"Věk"}</Text>}
                        flex={<Text style={{ fontSize: 14, fontWeight: "bold" }}>{"Účastník"}</Text>}
                    />
                    <Separator orientation="vertical"/>
                    { items }
                </View>
            </Page>
        </Document>
    );
};

const Row = (props: {
    first: React.ReactNode,
    second: React.ReactNode,
    flex: React.ReactNode,
}) => {

    return (
        <View style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
        }}> 
            <Separator/>
            <View style={{
                padding: 3,
                textAlign: "center",
                width: 50
            }}>
                {props.first}
            </View>
            <Separator/>
            <View style={{
                padding: 3,
                textAlign: "center",
                width: 50
            }}>
                {props.second}
            </View>
            <Separator/>
            <View style={{
                padding: 7,
                paddingLeft: 7,
                textAlign: "left",
                flex: 1
            }}>
                {props.flex}
            </View>
            <Separator/>
        </View>
    );

}

const Padder = (props: {
    padding: number
}) => {
    return (
        <View style={{
            paddingTop: props.padding
        }}/>
    );
}

const Separator = (props: {
    orientation?: "horizontal" | "vertical" | undefined
}) => {

    return (
        <View style={props.orientation === "vertical" ? {
            borderTop: "1pt solid black",
            alignSelf: "stretch"
        } : {
            borderLeft: "1pt solid black",
            alignSelf: "stretch"
        }}/>
    );

}

