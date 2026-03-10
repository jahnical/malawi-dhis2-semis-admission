import { format } from "date-fns";
import { useRecoilState } from 'recoil';
import ModalContent from './ModalContent';
import React, { useEffect, useState } from 'react'
import { ModalComponent } from 'dhis2-semis-components'
import { Modules, TableDataRefetch } from 'dhis2-semis-types';
import { ModalManagerInterface } from '../../../types/modal/ModalProps'
import useGetSelectedKeys from '../../../hooks/config/useGetSelectedKeys';
import { admissionDeletionFormField } from '../../../utils/constants/form/admissionDeletionForm';
import useGetDeleteAdmissionInitialValues from '../../../hooks/form/useGetDeleteAdmissionInitialValues';
import { useBuildForm, useDeleteAdmission, useGetSectionTypeLabel, useUrlParams, useGetTotalAdmissions, useDeleteTEI } from 'dhis2-semis-functions';

const ModalManagerAdmissionDelete = (props: ModalManagerInterface) => {
    const [loadingDelete, setLoadingDelete] = useState(false)
    const { urlParameters, useQuery } = useUrlParams();
    const { deleteAdmission } = useDeleteAdmission();
    const { getTotalAdmission } = useGetTotalAdmissions()
    const { sectionName } = useGetSectionTypeLabel();
    const [refetch, setRefetch] = useRecoilState(TableDataRefetch);
    const { dataStoreData, program: programData } = useGetSelectedKeys()
    const { deleteTEI } = useDeleteTEI()
    const { open, setOpen, i18n } = props;
    const { schoolName } = urlParameters;
    const { formData } = useBuildForm({ dataStoreData, programData, module: Modules.Admission });
    const [initialValues] = useState<object>({ registerschoolstaticform: schoolName, admission_date: format(new Date(), "yyyy-MM-dd") });
    const { getInitialValues, initialValues: updateInitialValues, loading: initialValuesLoading } = useGetDeleteAdmissionInitialValues()
    const admission = useQuery.get("admission") as string
    const trackedEntity = useQuery.get("trackedEntity") as string


    useEffect(() => {
        void getInitialValues(trackedEntity, admission);
    }, [open]);

    const handleCloseModal = () => setOpen(false);

    const onDeleteAdmission = async () => {
        setLoadingDelete(true)
        await getTotalAdmission(trackedEntity)
            .then(async (totalAdmission: any) => {
                const admissions: any[] = totalAdmission?.results?.admissions;

                const deleteAction = admissions.length > 1 ? deleteAdmission(admission) : deleteTEI(trackedEntity);
                await deleteAction
                    .then(() => {
                        setLoadingDelete(false)
                        setRefetch(!refetch)
                        setOpen(false)
                    })
                    .catch(() => {
                        setLoadingDelete(false)
                        setRefetch(!refetch)
                        setOpen(false)
                    })
            })
    }

    return (
        <ModalComponent
            open={open}
            handleClose={handleCloseModal}
            loading={initialValuesLoading}
            title={i18n.t("Admission Deletion")}
        >
            <ModalContent
                loading={loadingDelete}
                onChange={() => { }}
                onSubmit={onDeleteAdmission}
                onCancel={handleCloseModal}
                formFields={admissionDeletionFormField({ formFieldsData: formData, sectionName })}
                initialValues={{ ...initialValues, ...updateInitialValues }}
            />
        </ModalComponent>
    )
}

export default ModalManagerAdmissionDelete