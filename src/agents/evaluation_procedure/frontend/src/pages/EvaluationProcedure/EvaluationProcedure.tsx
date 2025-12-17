import { useEffect, useState } from 'react';
import { GroupedData } from '../../shared/types/EvaluationProcedure';
import { fetchEvaluationData } from '../../shared/utils/evaluationProcedureUtils';
import './EvaluationProcedure.scss';

export const EvaluationProcedure = () => {
	const [reportData, setReportData] = useState<GroupedData>({});
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchAll = async () => {
			try {
				setLoading(true);
				const grouped = await fetchEvaluationData();
				setReportData(grouped);
			} catch (e) {
				console.error('Ошибка при формировании отчета:', e);
			} finally {
				setLoading(false);
			}
		};

		fetchAll();
	}, []);

	const sortedProcedures = Object.values(reportData).sort((a, b) =>
		a.procedure.name.localeCompare(b.procedure.name),
	);

	return (
		<div className="evaluation-report">
			{loading ? (
				<div>Загрузка...</div>
			) : (
				sortedProcedures.map(({ procedure, employees }) => (
					<div
						key={procedure.procedure_id}
						className="procedure-section"
					>
						<h2>Процедура: {procedure.name}</h2>
						<p>Дата начала: {procedure.start_date}</p>
						<p>Дата завершения: {procedure.end_date}</p>

						{Object.entries(employees)
							.sort(([nameA], [nameB]) =>
								nameA.localeCompare(nameB),
							)
							.map(([employeeName, data]) => (
								<div
									key={employeeName}
									className="employee-section"
								>
									<h3>ФИО оцениваемого: {employeeName}</h3>
									<p>
										Текущий этап ДО:{' '}
										{data.plan.workflow_state_name}
									</p>

									<table>
										<thead>
											<tr>
												<th>ФИО оценивающего</th>
												<th>Оценка</th>
											</tr>
										</thead>
										<tbody>
											{data.questionnaires.map((q) => (
												<tr key={q.questionnaire_id}>
													<td>
														{
															q.expert_person_fullname
														}
													</td>
													<td>{q.overall}</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							))}
					</div>
				))
			)}
		</div>
	);
};
