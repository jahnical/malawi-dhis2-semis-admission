import React from 'react';
import { Admission } from '../../pages';
import { Routes, Route } from 'react-router-dom';
import WithHeaderBarLayout from '../../layout/WithHeaderBarLayout';
import { D2I18n } from 'dhis2-semis-types';

export default function Router({ i18n, baseUrl }: { i18n: D2I18n, baseUrl: string }) {
    return (
        <Routes>
            <Route path='/'
                element={<WithHeaderBarLayout baseUrl={baseUrl} />}
            >
                <Route key={'admissions'} path={'/'} element={<Admission i18n={i18n} baseUrl={baseUrl} />} />
            </Route>
        </Routes>
    );
}