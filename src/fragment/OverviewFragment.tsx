import React from "react";

import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Fade from "@mui/material/Fade";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";


import CollapseAlert from "../component/CollapseAlert";
import TwoPartChip from "../component/TwoPartChip";

import { useOverflowDetector } from "react-detectable-overflow";
import useAutoCollapse from '../autocollapse/useAutoCollapse';
import useDatabase from "../database/useDatabase";
import useCounts from "../counts/useCounts";
import useSearch from "../hook/useSearch";
import useShare from "../hook/useShare";
import useSelection from "../selection/useSelection";
import useGlobalStateModifier from "../globalstate/useGlobalStateModifier";
import useQueryParam from "../queryparams/useQueryParam";


export default function OverviewFragment() {

    const modify = useGlobalStateModifier();

    const selection = useSelection();
    const [ sParam, ] = useQueryParam("s");
    const isShared = sParam !== null;

    return (
        <Stack sx={{ height: "100%" }}>
            {/* <Stack
                ref={ref as any}
                spacing={2}
                sx={{
                    flex: 1,
                    overflow: "auto",
                    padding: 2,
                    paddingBottom: overflow ? 2 : isShared ? 1 : 0,
                    transition: theme => theme.transitions.create("padding-bottom")
                }}
            >
                {alerts}
            </Stack>
            <Fade in={overflow}>
                <Divider/>
            </Fade> */}
            { isShared && (
                <ButtonBase
                    sx={{
                        marginBottom: -2,
                        paddingLeft: 2,
                        paddingRight: 2,
                        height: theme => theme.spacing(4),
                        justifyContent: "start"
                    }}
                    onClick={() => modify({ share_alert: null })}
                >
                    <Typography variant="subtitle2" color="GrayText" lineHeight="unset">Prohlížíte si sdílený seznam</Typography>
                </ButtonBase>
            )}
            <Stack
                spacing={2}
                direction="row"
                sx={{
                    padding: 2,
                }}
            >
                <Button variant="outlined" size="medium" sx={{ flex: 1, padding: 1.5 }} onClick={() => modify({ share: "open" })}>Sdílet</Button>
                <Button variant="outlined" size="medium" sx={{ flex: 1, padding: 1.5 }} onClick={() => modify({ export: "open" })}>Tisk</Button>
                <Button color="error" variant="outlined" size="medium" sx={{ flex: 1, padding: 1.5 }} onClick={() => selection.clear()}>Vymazat</Button>
            </Stack>
        </Stack>
    )
}
