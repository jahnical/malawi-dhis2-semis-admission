import { useState } from 'react';
import { format } from 'date-fns';
import useGetSelectedKeys from '../config/useGetSelectedKeys';
import { attributes, dataValues, useGetAdmission } from 'dhis2-semis-functions';

function useGetDeleteAdmissionInitialValues() {
    const { dataStoreData, program } = useGetSelectedKeys()
    const { programStages } = program || {}
    const { getAdmission } = useGetAdmission()
    const [loading, setLoading] = useState<boolean>(false)
    const [initialValues, setInitialValues] = useState<any>({})
    const { registration, 'socio-economics': socioEconomics, program: programId, } = dataStoreData

    const getInitialValues = async (trackedEntity: string, admission: string) => {
        setLoading(true)

        if (Object.keys(dataStoreData)?.length) {
            let socioEconomicData: any = []

            await getAdmission(admission)
                .then((resp: any) => {
                    const admissionEvents = programStages?.filter((programStage: { id: string }) => programStage.id !== socioEconomics?.programStage && programStage.id !== registration?.programStage)?.map((value: any) => {

                        const event = resp?.results?.events?.filter((event: { programStage: string, dataValues: any[] }) => event.programStage === value.id && event.dataValues.length)

                        return {
                            name: value.displayName,
                            value: event?.length,
                            repeatable: value.repeatable,
                            class: event?.length ? 'hasValuesColor' : 'noValuesColor',
                            label: value.repeatable ? event?.length ? `${value.displayName + "s"}` : `No ${value.displayName.toLowerCase() + "s"}` : event?.length ? "Value assigned" : 'No value assigned'
                        }
                    })

                    const registrationData: any = resp?.results?.events?.filter((event: any) => event.programStage === dataStoreData?.registration?.programStage)

                    if (socioEconomics)
                        socioEconomicData = resp?.results?.events?.filter((event: any) => event.programStage === dataStoreData?.['socio-economics']?.programStage)

                    setInitialValues({
                        events: admissionEvents,
                        program: programId,
                        admission: admission,
                        trackedEntity: trackedEntity,
                        ...attributes(resp?.results?.attributes ?? []),
                        orgUnit: registrationData?.find((x: any) => x.admission === admission)?.orgUnit,
                        admissionDate: registrationData?.find((x: any) => x.admission === admission)?.occurredAt,
                        ...dataValues(registrationData?.find((x: any) => x.admission === admission)?.dataValues ?? []),
                        ...dataValues(socioEconomicData?.find((x: any) => x.admission === admission)?.dataValues ?? []),
                        admission_date: registrationData?.find((x: any) => x.admission === admission)?.occurredAt ? format(new Date(registrationData?.find((x: any) => x.admission === admission)?.occurredAt), "yyyy-MM-dd") : undefined,
                    })
                })
                .finally(() => {
                    setLoading(false)
                })
        } else {
            setLoading(false)
        }
    }

    return { getInitialValues, initialValues, loading }
}

export default useGetDeleteAdmissionInitialValues