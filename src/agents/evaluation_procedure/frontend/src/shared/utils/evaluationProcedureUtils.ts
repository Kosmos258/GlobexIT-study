import { getAllData } from '../../api/api';
import {
	ProcedureWithRelationsType,
	GroupedData,
	QuestionnaireType,
} from '../types/EvaluationProcedure';

export const fetchAndGroupData = async (): Promise<GroupedData> => {
	const data: ProcedureWithRelationsType[] = await getAllData();

	const grouped: GroupedData = {};

	data.forEach((item) => {
		const procedureId = item.procedure_id;
		const employeeName = item.person_fullname;

		// Пропускаем записи без процедуры
		if (!procedureId) return;

		// Создаем процедуру, если её ещё нет
		if (!grouped[procedureId]) {
			grouped[procedureId] = {
				procedure: {
					procedure_id: item.procedure_id,
					name: item.name,
					start_date: item.start_date,
					end_date: item.end_date,
				} as ProcedureWithRelationsType,
				employees: {},
			};
		}

		// Пропускаем записи без информации о сотруднике
		if (!employeeName) return;

		// Создаем сотрудника, если его ещё нет
		if (!grouped[procedureId].employees[employeeName]) {
			grouped[procedureId].employees[employeeName] = {
				plan: {
					plan_id: item.plan_id,
					assessment_appraise_id: item.assessment_appraise_id,
					person_fullname: item.person_fullname,
					workflow_state_name: item.workflow_state_name,
				} as ProcedureWithRelationsType,
				questionnaires: [],
			};
		}

		// Добавляем анкету, если она есть
		if (item.questionnaire_id) {
			const questionnaire: QuestionnaireType = {
				questionnaire_id: item.questionnaire_id,
				assessment_plan_id: item.assessment_plan_id,
				expert_person_fullname: item.expert_person_fullname,
				overall: item.overall,
			};

			// Проверяем, чтобы не добавлять дубликаты анкет
			const exists = grouped[procedureId].employees[
				employeeName
			].questionnaires.some(
				(q) => q.questionnaire_id === questionnaire.questionnaire_id,
			);

			if (!exists) {
				grouped[procedureId].employees[
					employeeName
				].questionnaires.push(questionnaire);
			}
		}
	});

	return grouped;
};

export const fetchEvaluationData = async (): Promise<GroupedData> => {
	try {
		const groupedData = await fetchAndGroupData();
		return groupedData;
	} catch (e) {
		console.error('Ошибка при формировании отчета:', e);
		throw e;
	}
};
