import React from 'react'
import { Router } from '../components/routes'
import { useConfig } from '@dhis2/app-runtime'
import { D2I18n } from 'dhis2-semis-types'

const Admission = ({ i18n, baseUrl }: { i18n: D2I18n, baseUrl: string }) => {
    const { baseUrl: localBaseUrl } = useConfig()
    const useBaseUrl = baseUrl || localBaseUrl

    return (
        <Router i18n={i18n as unknown as any} baseUrl={useBaseUrl} />
    )
}

export default Admission
