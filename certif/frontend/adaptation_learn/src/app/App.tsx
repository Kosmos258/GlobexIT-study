import React from 'react';
import ReactDOM from 'react-dom/client';
import '@app/styles/index.scss';
import '@app/styles/normalize-wt.scss';
import { CertificatesList } from '@pages/adaptation_test/CertificatesList';

ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<CertificatesList />
	</React.StrictMode>,
);
