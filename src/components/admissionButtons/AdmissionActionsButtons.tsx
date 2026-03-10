import React, { useState } from 'react'
import { Form } from "react-final-form";
import { Tooltip } from '@mui/material';
import styles from './admissionActionsButtons.module.css'
import ModalManager from '../modal/saveAdmission/ModalManager';
import { useBuildForm, useGetSectionTypeLabel, useUrlParams, useShowAlerts } from 'dhis2-semis-functions';
import { D2I18n, Modules, TableDataRefetch } from 'dhis2-semis-types'
import { IconAddCircle24, Button, ButtonStrip, IconUserGroup16, IconSearch24 } from "@dhis2/ui";
import { ModalSearchAdmissionContent, DataExporter, DataImporter, CustomDropdown as DropdownButton, useSchoolCalendarKey } from 'dhis2-semis-components';
import { formFields } from '../../utils/constants/form/admissionForm';
import useGetSelectedKeys from '../../hooks/config/useGetSelectedKeys';
import { useSetRecoilState } from 'recoil';
import EnrollBulkModal, { SelectedStudent } from '../modal/enrollFromAdmission/EnrollBulkModal';

function AdmissionActionsButtons({ i18n, baseUrl, selectedStudents = [] }: { i18n: D2I18n, baseUrl: string, selectedStudents?: SelectedStudent[] }) {
    const { urlParameters } = useUrlParams();
    const { sectionName } = useGetSectionTypeLabel();
    const schoolCalendar = useSchoolCalendarKey()
    const { dataStoreData, program: programData } = useGetSelectedKeys()
    const [formInitialValues, setFormInitialValues] = useState({})
    const [openSaveModal, setOpenSaveModal] = useState<boolean>(false)
    const { school: orgUnit, academicYear } = urlParameters;
    const [openSearchAdmission, setOpenSearchAdmission] = useState<boolean>(false);
    const [openEnrollBulkModal, setOpenEnrollBulkModal] = useState<boolean>(false);
    const { formData } = useBuildForm({ dataStoreData, programData, module: Modules.Admission, schoolCalendar });
    const { hide, show } = useShowAlerts()
    const setRefetch = useSetRecoilState(TableDataRefetch);
    const academicYearFilter = academicYear !== null
        ? `${schoolCalendar?.academicYear}:in:${academicYear}`
        : null;
    const filters = [academicYearFilter].filter((f): f is string => f !== null);


    const showAlert = (error: any) => {
        show({ message: `${i18n.t("Unknown error")}: ${error}`, type: { critical: true } })
        setTimeout(hide, 5000);
    }

    const admissionOptions: any = [
        {
            label: <DataImporter
                baseURL={baseUrl}
                label={i18n.t('Admit new {{section}}', {
                    section: `${i18n.t(sectionName)}s`,
                })}
                module={Modules.Admission}
                onError={(e: any) => { showAlert(e) }}
                programConfig={programData!}
                sectionType={sectionName}
                selectedSectionDataStore={dataStoreData}
                updating={false}
                title={i18n.t("Bulk Admission")}
                onClose={() => setRefetch(prev => !prev)}
            />,
            divider: true,
            disabled: false,
        },
        {
            label: <DataImporter
                baseURL={baseUrl}
                label={i18n.t('Update existing {{section}}', {
                    section: `${i18n.t(sectionName)}s`,
                })}
                module={Modules.Admission}
                onError={(e: any) => { showAlert(e) }}
                programConfig={programData!}
                sectionType={sectionName}
                selectedSectionDataStore={dataStoreData}
                updating={true}
                title={i18n.t("Bulk Admission Update")}
                onClose={() => setRefetch(prev => !prev)}
            />,
            divider: true,
            disabled: false,
        },
        {
            label: <DataExporter
                Form={Form}
                baseURL={baseUrl}
                eventFilters={filters}
                label={i18n.t('Export Empty Template')}
                module={Modules.Admission}
                onError={(e: any) => { showAlert(e) }}
                programConfig={programData!}
                sectionType={sectionName}
                selectedSectionDataStore={dataStoreData}
                empty={true}
                stagesToExport={[]}
            />,
            divider: false,
            disabled: false,
        },
        {
            label: <DataExporter
                Form={Form}
                baseURL={baseUrl}
                eventFilters={filters}
                label={i18n.t('Export Existing {{section}}', {
                    section: `${i18n.t(sectionName)}s`,
                })}
                module={Modules.Admission}
                onError={(e: any) => { showAlert(e) }}
                programConfig={programData!}
                sectionType={sectionName}
                selectedSectionDataStore={dataStoreData}
                empty={false}
                stagesToExport={[]}
            />,
            divider: false,
            disabled: false,
        },
    ];

    return (
        <div className={styles.container}>
            <ButtonStrip className={styles.work_buttons}>
                {dataStoreData?.defaults?.allowSearching && <Tooltip title={orgUnit === null ? i18n.t("Please select an organisation unit before") : ""}>
                    <span>
                        <Button onClick={() => {
                            setOpenSearchAdmission(true);
                        }} icon={<IconSearch24 />}>
                            <span className={styles.work_buttons_text}>
                                {
                                    i18n.t('Search by {{section}}', {
                                        section: `${i18n.t(sectionName)}s`,
                                    })
                                }
                            </span>
                        </Button>
                    </span>
                </Tooltip>}
                <Tooltip title={orgUnit === null ? i18n.t("Please select an organisation unit before") : ""}
                    onClick={() => setOpenSaveModal(true)}
                >
                    <span>
                        <Button icon={<IconAddCircle24 />}>
                            <span className={styles.work_buttons_text}>
                                {
                                    i18n.t('Admit {{section}}', {
                                        section: `${i18n.t(sectionName)}`,
                                    })
                                }
                            </span>
                        </Button>
                    </span>
                </Tooltip>

                {selectedStudents.length > 0 && (
                    <Tooltip title="">
                        <span>
                            <Button
                                icon={<IconUserGroup16 />}
                                onClick={() => setOpenEnrollBulkModal(true)}
                            >
                                <span className={styles.work_buttons_text}>
                                    {i18n.t('Enroll Selected ({{count}})', { count: selectedStudents.length })}
                                </span>
                            </Button>
                        </span>
                    </Tooltip>
                )}

                <Tooltip title={orgUnit === undefined || academicYear === undefined ? i18n.t("Please select an organisation unit and academic year") : ""}>
                    <span>
                        <DropdownButton
                            name={<span className={styles.work_buttons_text}>{i18n.t("Bulk admission")}</span> as unknown as string}
                            disabled={!!(orgUnit == undefined || academicYear == undefined)}
                            icon={<IconUserGroup16 />}
                            options={admissionOptions}
                        />
                    </span>
                </Tooltip>

            </ButtonStrip>

            {openSaveModal && <ModalManager
                i18n={i18n}
                saveMode='CREATE'
                open={openSaveModal}
                setOpen={setOpenSaveModal}
                formVariablesFields={formData}
                initialValues={formInitialValues}
                setFormInitialValues={setFormInitialValues}
                formFields={formFields({ formFieldsData: formData, sectionName: sectionName!, admissionDateAttributeId: dataStoreData?.admission?.addmissionDate })}
            />}

            {openSearchAdmission &&
                <ModalSearchAdmissionContent
                    open={openSearchAdmission}
                    programConfig={programData!}
                    sectionName={sectionName}
                    setOpen={setOpenSearchAdmission}
                    Form={Form}
                    setOpenNewAdmissionModal={() => setOpenSaveModal(true)}
                    setFormInitialValues={(values: any) => setFormInitialValues(values)}
                />
            }

            {openEnrollBulkModal && (
                <EnrollBulkModal
                    i18n={i18n}
                    open={openEnrollBulkModal}
                    setOpen={setOpenEnrollBulkModal}
                    selectedStudents={selectedStudents}
                />
            )}
        </div>
    )
}

export default AdmissionActionsButtons
