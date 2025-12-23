import React from 'react';
import ReactDOM from 'react-dom/client';
import '@app/styles/index.scss';
import '@app/styles/normalize-wt.scss';
import AllUsers from '@pages/AllUsers';

ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<AllUsers />
	</React.StrictMode>,
);
