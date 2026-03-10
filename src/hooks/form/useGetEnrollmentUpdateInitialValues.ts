import { useState } from 'react';
import { format } from 'date-fns';
import useGetSelectedKeys from '../config/useGetSelectedKeys';
import { attributes, dataValues, useGetAdmission } from 'dhis2-semis-functions';

function useGetAdmissionUpdateInitialValues() {
    const { getAdmission } = useGetAdmission()
    const { dataStoreData } = useGetSelectedKeys()
    const [error, setError] = useState<boolean>(false)
    const [loading, setLoading] = useState<boolean>(false)
    const [initialValues, setInitialValues] = useState<any>({})
    const [admissionEvents, setAdmissionEvents] = useState<any>({})
    const { registration, 'socio-economics': socioEconomics, program: programId, } = dataStoreData

    const getInitialValues = async (trackedEntity: string, admission: string) => {
        setLoading(true)

        if (Object.keys(dataStoreData)?.length) {
            await getAdmission(admission)
                .then((response: any) => {
                    const registrationData: any = response?.results?.events?.filter((event: any) => event.programStage === dataStoreData?.registration?.programStage)
                    const socioEconomicData: any = response?.results?.events?.filter((event: any) => event.programStage === dataStoreData?.['socio-economics']?.programStage)

                    setInitialValues({
                        program: programId,
                        admission: admission,
                        trackedEntity: trackedEntity,
                        ...attributes(response?.results?.attributes ?? []),
                        orgUnit: registrationData?.find((x: any) => x.admission === admission)?.orgUnit,
                        admissionDate: registrationData?.find((x: any) => x.admission === admission)?.occurredAt,
                        ...dataValues(registrationData?.find((x: any) => x.admission === admission)?.dataValues ?? []),
                        ...dataValues(socioEconomicData?.find((x: any) => x.admission === admission)?.dataValues ?? []),
                        admission_date: registrationData?.find((x: any) => x.admission === admission)?.occurredAt ? format(new Date(registrationData?.find((x: any) => x.admission === admission)?.occurredAt), "yyyy-MM-dd") : undefined,
                    })

                    setAdmissionEvents({
                        events: [
                            registrationData?.find((x: any) => x.admission === admission) ?? { admission: admission, programStage: registration },
                            socioEconomicData?.find((x: any) => x.admission === admission) ?? { admission: admission, programStage: socioEconomics },
                        ]
                    })
                })
                .catch(() => {
                    setError(true)
                })
                .finally(() => {
                    setLoading(false)
                })
        } else {
            setLoading(false)
        }
    }

    return { admissionEvents, getInitialValues, initialValues, loading, error }
}

export default useGetAdmissionUpdateInitialValues