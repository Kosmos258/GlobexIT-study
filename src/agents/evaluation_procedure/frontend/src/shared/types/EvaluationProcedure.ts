export type ProcedureType = {
	procedure_id: string;
	name: string;
	start_date: string;
	end_date: string;
};

export type PlanType = {
	plan_id: string;
	person_fullname: string;
	workflow_state_name: string;
	assessment_appraise_id: string;
};

export type QuestionnaireType = {
	questionnaire_id: string;
	expert_person_fullname: string;
	overall: string;
	assessment_plan_id: string;
};

export type GroupedData = {
	[procedureId: string]: {
		procedure: ProcedureType;
		employees: {
			[employeeName: string]: {
				plan: PlanType;
				questionnaires: QuestionnaireType[];
			};
		};
	};
};
