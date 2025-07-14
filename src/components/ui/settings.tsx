import {useTheme} from "next-themes";
import {Button} from "@chakra-ui/react";
import {LuSettings} from "react-icons/lu";


export function SettingsToggle() {
    const { theme, setTheme } = useTheme()
    const toggleColorMode = () => {
        setTheme(theme === "light" ? "dark" : "light")
    }

    return (
        <Button variant={"subtle"} size={{ base: 'sm', md: 'md' }} onClick={toggleColorMode}>
            <LuSettings />
        </Button>
    )
}
