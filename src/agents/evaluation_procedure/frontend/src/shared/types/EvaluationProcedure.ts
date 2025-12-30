export type QuestionnaireType = {
	questionnaire_id: number;
	assessment_plan_id: number;
	expert_person_fullname: string;
	overall: string;
};
export type ProcedureWithRelationsType = {
	questionnaire_id: number;
	expert_person_fullname: string;
	overall: string;
	assessment_plan_id: number;
	plan_id: number;
	person_fullname: string;
	workflow_state_name: string;
	assessment_appraise_id: number;
	procedure_id: number;
	name: string;
	start_date: string;
	end_date: string;
};

export type GroupedData = {
	[procedureId: string]: {
		procedure: ProcedureWithRelationsType;
		employees: {
			[employeeName: string]: {
				plan: ProcedureWithRelationsType;
				questionnaires: QuestionnaireType[];
			};
		};
	};
};
