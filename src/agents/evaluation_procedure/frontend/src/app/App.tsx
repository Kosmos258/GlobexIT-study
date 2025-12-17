import React from 'react';
import ReactDOM from 'react-dom/client';
import '@app/styles/index.scss';
import '@app/styles/normalize-wt.scss';
import { EvaluationProcedure } from '../pages/EvaluationProcedure/EvaluationProcedure';

ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<EvaluationProcedure />
	</React.StrictMode>,
);
