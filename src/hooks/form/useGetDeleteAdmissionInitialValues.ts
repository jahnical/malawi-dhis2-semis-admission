import { useState } from 'react';
import { format } from 'date-fns';
import useGetSelectedKeys from '../config/useGetSelectedKeys';
import { attributes, useGetAdmission } from 'dhis2-semis-functions';

function useGetDeleteAdmissionInitialValues() {
    const { dataStoreData } = useGetSelectedKeys()
    const { getAdmission } = useGetAdmission()
    const [loading, setLoading] = useState<boolean>(false)
    const [initialValues, setInitialValues] = useState<any>({})
    const { program: programId } = dataStoreData

    const getInitialValues = async (trackedEntity: string, admission: string) => {
        setLoading(true)

        if (Object.keys(dataStoreData)?.length) {
            await getAdmission(admission)
                .then((resp: any) => {
                    setInitialValues({
                        program: programId,
                        admission: admission,
                        trackedEntity: trackedEntity,
                        ...attributes(resp?.results?.attributes ?? []),
                        orgUnit: resp?.results?.orgUnit,
                        admission_date: resp?.results?.occurredAt
                            ? format(new Date(resp?.results?.occurredAt), "yyyy-MM-dd")
                            : undefined,
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
