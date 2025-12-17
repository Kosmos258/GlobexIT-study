import { getProcedures, getPlans, getQuestionnaires } from '../../api/api';
import {
	ProcedureType,
	PlanType,
	QuestionnaireType,
	GroupedData,
} from '../types/EvaluationProcedure';

export const fetchAndGroupData = async (): Promise<GroupedData> => {
	const [proceduresData, plansData, questionnairesData] = await Promise.all([
		getProcedures(),
		getPlans(),
		getQuestionnaires(),
	]);

	const grouped: GroupedData = {};

	proceduresData.forEach((procedure: ProcedureType) => {
		const procedurePlans = plansData.filter(
			(plan: PlanType) =>
				plan.assessment_appraise_id === procedure.procedure_id,
		);

		if (procedurePlans.length === 0) return;

		grouped[procedure.procedure_id] = {
			procedure,
			employees: {},
		};

		procedurePlans.forEach((plan: PlanType) => {
			const planQuestionnaires = questionnairesData.filter(
				(q: QuestionnaireType) => q.assessment_plan_id === plan.plan_id,
			);

			const employeeName = plan.person_fullname;

			if (!grouped[procedure.procedure_id].employees[employeeName]) {
				grouped[procedure.procedure_id].employees[employeeName] = {
					plan,
					questionnaires: [],
				};
			}

			grouped[procedure.procedure_id].employees[
				employeeName
			].questionnaires.push(...planQuestionnaires);
		});
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
