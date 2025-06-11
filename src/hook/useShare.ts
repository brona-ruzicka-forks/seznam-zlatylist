import React from "react";
import useSelection from "../selection/useSelection";
import useGlobalStateModifier from "../globalstate/useGlobalStateModifier";
import { SelectionArray } from "../selection/selectionStructure";
import useAutohideQueryParam from "../queryparams/useAutohideQueryParam";

export default function useShare() {

    const selection = useSelection();
    const modify = useGlobalStateModifier();

    const share = React.useCallback(() => {

        const url = new URL(window.location.href);
        url.search = `s=${selection.join(".")}`;

        if (window.navigator.userAgent && window.navigator.share && /iPhone|iPad|iPod|Android/i.test(window.navigator.userAgent)) {
            window.navigator.share({
                url: url.toString(),
                title: "Můj seznam četby"
            });
        } else {
            modify({ share: "open" });
        }
    }, [ selection, modify ]);

    return share;

}

export const useShareUrl = () => {

    const [ ucastnici ] = useAutohideQueryParam("ucastnici");
    const [ exkurze ] = useAutohideQueryParam("exkurze");
    const [ cas ] = useAutohideQueryParam("cas");
    const [ pocet ] = useAutohideQueryParam("pocet");

    const url = new URL(window.location.href);
    url.searchParams.set("ucastnici", ucastnici);
    url.searchParams.set("exkurze", exkurze);
    url.searchParams.set("cas", cas);
    url.searchParams.set("pocet", pocet);
    return url.toString();

}
