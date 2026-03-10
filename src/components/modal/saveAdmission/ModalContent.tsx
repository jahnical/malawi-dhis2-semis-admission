import React from 'react'
import { Form } from 'react-final-form';
import { useConfig } from '@dhis2/app-runtime';
import { ModalContentInterface } from '../../../types/modal/ModalProps';
import { WithBorder, WithPadding, CustomForm } from 'dhis2-semis-components';

function ModalContent(props: ModalContentInterface) {
    const { baseUrl } = useConfig()
    const { formFields, onChange, onSubmit, onCancel, initialValues, loading, formValues = {}, setFormValues, trackedEntity  } = props;

    return (
        <WithPadding>
            <WithBorder type='all'>
                <WithPadding>
                    <CustomForm
                        Form={Form}
                        loading={loading}
                        trackedEntity={trackedEntity}
                        baseUrl={baseUrl}
                        withButtons={true}
                        formValues={formValues}
                        formFields={formFields}
                        onInputChange={onChange}
                        setFormValues={setFormValues}
                        initialValues={initialValues}
                        onCancel={() => { onCancel() }}
                        onFormSubtmit={(e) => { onSubmit(e) }}
                    />
                </WithPadding>
            </WithBorder>
        </WithPadding>
    )
}

export default ModalContent
