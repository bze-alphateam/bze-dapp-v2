import { Button } from "@chakra-ui/react"
import { LuSettings } from "react-icons/lu"
import { Sidebar } from "./sidebar/sidebar"
import { SettingsSidebarContent } from "./sidebar/settings-sidebar"

export function SettingsToggle() {
    return (
        <Sidebar
            ariaLabel="Settings"
            trigger={
                <Button variant="subtle" size={{ base: 'sm', md: 'md' }}>
                    <LuSettings />
                </Button>
            }
        >
            <SettingsSidebarContent />
        </Sidebar>
    )
}