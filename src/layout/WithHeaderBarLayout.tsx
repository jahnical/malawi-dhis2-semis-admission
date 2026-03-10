import { Outlet } from "react-router-dom"
import useGetSelectedKeys from "../hooks/config/useGetSelectedKeys"
import { HeaderBarLayout, SemisHeader, useSchoolCalendarKey } from "dhis2-semis-components"

const WithHeaderBarLayout = ({ baseUrl }: { baseUrl: string }) => {
    const schoolCalendar = useSchoolCalendarKey()
    const { program, dataStoreData } = useGetSelectedKeys()

    return (
        <HeaderBarLayout
            header={
                <SemisHeader
                    baseUrl={baseUrl}
                    program={program}
                    schoolCalendar={schoolCalendar}
                    dataStoreValues={dataStoreData}
                />
            }
        >
            <Outlet />
        </HeaderBarLayout>
    )
}

export default WithHeaderBarLayout