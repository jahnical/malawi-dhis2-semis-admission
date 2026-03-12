import { useState } from 'react';
import { format } from 'date-fns';
import useGetSelectedKeys from '../config/useGetSelectedKeys';
import { attributes, useGetAdmission } from 'dhis2-semis-functions';

function useGetAdmissionUpdateInitialValues() {
    const { getAdmission } = useGetAdmission()
    const { dataStoreData } = useGetSelectedKeys()
    const [error, setError] = useState<boolean>(false)
    const [loading, setLoading] = useState<boolean>(false)
    const [initialValues, setInitialValues] = useState<any>({})
    const { program: programId } = dataStoreData

    const getInitialValues = async (trackedEntity: string, admission: string) => {
        setLoading(true)

        if (Object.keys(dataStoreData)?.length) {
            await getAdmission(admission)
                .then((response: any) => {
                    const admissionDateAttrId = dataStoreData?.admission?.admissionDate;
                    const occurredAtFormatted = response?.results?.occurredAt
                        ? format(new Date(response?.results?.occurredAt), "yyyy-MM-dd")
                        : undefined;
                    setInitialValues({
                        program: programId,
                        admission: admission,
                        trackedEntity: trackedEntity,
                        ...attributes(response?.results?.attributes ?? []),
                        orgUnit: response?.results?.orgUnit,
                        admission_date: occurredAtFormatted,
                        ...(admissionDateAttrId && occurredAtFormatted ? { [admissionDateAttrId]: occurredAtFormatted } : {}),
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

    return { getInitialValues, initialValues, loading, error }
}

export default useGetAdmissionUpdateInitialValues
