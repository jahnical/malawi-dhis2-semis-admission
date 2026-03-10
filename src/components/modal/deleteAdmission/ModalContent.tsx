import classNames from 'classnames';
import React, { useEffect, useState } from 'react'
import { Form } from 'react-final-form';
import styles from "./modal.module.css";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { Collapse, ListItem, ListItemText } from '@mui/material';
import { ModalContentInterface } from '../../../types/modal/ModalProps';
import { CustomForm, WithBorder, WithPadding } from 'dhis2-semis-components';
import { useGetSectionTypeLabel, useUrlParams } from 'dhis2-semis-functions';
import { Button, ButtonStrip, IconCheckmark24, IconCross24, NoticeBox } from '@dhis2/ui';

const ModalContent = (props: ModalContentInterface) => {
    const { sectionName } = useGetSectionTypeLabel();
    const { urlParameters } = useUrlParams();
    const [collapse, setCollapse] = useState<boolean>(false)
    const { schoolName } = urlParameters;
    const { formFields, onChange, onSubmit, onCancel, initialValues, loading } = props;

    useEffect(() => {
        if(!formFields[0]?.fields?.length){
            setCollapse(true)
        }
    }, [formFields]);

    return (
        <WithPadding>
            <WithBorder type='all'>
                <WithPadding>
                    <CustomForm
                        Form={Form}
                        formFields={[formFields[0]]}
                        initialValues={initialValues}
                    />
                    <WithPadding p='5px 18px'>
                        <ButtonStrip end>
                            <div dir="rtl">
                                <Button small secondary onClick={() => setCollapse(!collapse)} icon={collapse ? <ExpandLess /> : <ExpandMore />}>Admission details</Button>
                            </div>
                        </ButtonStrip>
                    </WithPadding>
                    <Collapse in={collapse}>
                        <CustomForm
                            Form={Form}
                            formFields={[formFields[1]]}
                            initialValues={initialValues}
                        />
                    </Collapse>
                    <WithPadding p='10px 18px'>
                        <WithBorder type="all">
                            {initialValues?.events?.map((event: any) =>
                                <ListItem className={classNames(styles.listItem)}>
                                    <ListItemText primary={event.name} />
                                    <span className={classNames(styles.valuesFlex)}>
                                        <span className={classNames(styles[event.class])}>
                                            {event.repeatable ? event.value : event.value ? <IconCheckmark24 /> : <IconCross24 />}
                                        </span>
                                        <span className={classNames(styles[event.class], styles.iconLabel)}>
                                            {event.label}
                                        </span>
                                    </span>
                                </ListItem>
                            )}
                        </WithBorder>
                    </WithPadding>

                    <WithPadding p='10px 18px'>
                        < NoticeBox
                            warning
                            title={`Are you sure you want to delete the selected 
                    ${sectionName.toLowerCase()} from ${schoolName}?`}
                        >
                            This {sectionName.toLowerCase()} admission will be deleted and can no longer be accessed.
                        </NoticeBox>
                    </WithPadding>

                    <CustomForm
                        Form={Form}
                        loading={loading}
                        formFields={[]}
                        onCancel={() => { onCancel() }}
                        withButtons={true}
                        destructive={true}
                        submitButtonLabel={loading ? "Deleting" : "Delete"}
                        onFormSubtmit={(e) => { onSubmit(e) }}
                    />
                </WithPadding>
            </WithBorder>
        </WithPadding>
    )
}

export default ModalContent