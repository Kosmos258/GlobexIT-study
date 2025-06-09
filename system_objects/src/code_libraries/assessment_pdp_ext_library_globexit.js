function log(text, arFlag, alFlag) {
    EnableLog('libAssessmentPdpExt', true);

    if (arFlag == undefined || arFlag == false) {
        LogEvent('libAssessmentPdpExt', text);
        if (alFlag != undefined || alFlag == true) alert(text);
    } else {
        LogEvent('libAssessmentPdpExt', tools.object_to_text(text, 'json'));
        if (alFlag != undefined || alFlag == true) alert(tools.object_to_text(text, 'json'));
    }
}

function InitObject(docObject) {
    var teObject = docObject.TopElem;
    var sCSSUrl = tools_app.get_cur_settings("css_url", "app", null, null, null, teObject.id.Value);
    var curWorkflowID = tools_app.get_cur_settings("workflow_id", "app", null, null, null, teObject.id.Value);


    // Заполнение карточки процедуры.
    teObject.status = 0;
    teObject.web_display = 1;
    teObject.flag_use_plan = 1;
    teObject.is_model = 0;
    teObject.assessment_object_type = "collaborator";
    teObject.workflow_id = curWorkflowID; //  было 7117145352789761944
    teObject.ignore_presence = 0;
    teObject.include_fired = 0;
    teObject.always_check_custom_experts = 0;
    teObject.is_basic_comment = 0;
    teObject.is_comment_required = 0;
    teObject.tree_custom_web_template_id = 7116793233203417579; // NEW
    teObject.player = 1;

    oParticipant = teObject.participants.AddChild();
    oParticipant.participant_id = "manager";
    oParticipant.customize.is_custom_experts = 0;

    oParticipant.customize.additional_participants_code = 'MASTERS_PACK = new Array(); _boss = tools.call_code_library_method("libAssessmentPdpExt", "getSearchAssBoss", [personID, _Assessment.id.Value, _Assessment, false]); if(_boss !=undefined && OptInt(_boss,0)>0) MASTERS_PACK.push(OptInt(_boss,0));';
    oParticipant.is_final = 0

    oAssApprType = oParticipant.assessment_appraise_types.AddChild();
    oAssApprType.assessment_appraise_type_id = "development_plan";
    oAssApprType.flag_01 = 0;
    oAssApprType.flag_02 = "basic";
    oAssApprType.flag_06 = 0;
    oAssApprType.is_formuled_result = 0;
    oAssApprType.is_formuled_result_readonly = 0;
    oAssApprType.incrementation = 0;
    oAssApprType.print_form_id = 7141379226462835861; // NEW //было 7119435900219299236
    oAssApprType.custom_web_template_id = 7136090105634061972; // NEW //было 7116805727017375850
    oAssApprType.custom_post_web_template_id = 7117142084426030177; // NEW
    oAssApprType.index = 2;

    oParticipant = teObject.participants.AddChild();

    oParticipant.participant_id = 'expert';
    oParticipant.customize.is_custom_experts = 1;
    oParticipant.customize.additional_participants_code = 'MASTERS_PACK = new Array(); _boss = tools.call_code_library_method("libAssessmentPdpExt", "getSearchAssBoss", [personID, _Assessment.id.Value, _Assessment, true]); if(_boss !=undefined && OptInt(_boss,0)>0) MASTERS_PACK.push(OptInt(_boss,0));';
    oParticipant.is_final = 0;

    if (sCSSUrl == "")
    {
        docObject.TopElem.css_template_id.Clear();
    }
    else
    {
        catCurTemplReq = ArrayOptFirstElem(XQuery("for $elem in custom_web_templates where $elem/code = 'websoft_pdp_ext_v2_application_css' return $elem/Fields('id')"));
        if (catCurTemplReq!=undefined)
        {
            docObject.TopElem.css_template_id = catCurTemplReq.id;
        }
    }
    catCurTemplReq = ArrayOptFirstElem(XQuery("for $elem in custom_web_templates where $elem/code = 'ptr_ipr_assessment_css' return $elem/Fields('id')"));
    if (catCurTemplReq!=undefined)
    {
        docObject.TopElem.css_template_id = catCurTemplReq.id;
    }


    docObject.Save();
}

function SaveAction( ID, isEdit, AppID, TE  ) { // запуск из диалога, зашитые параметры
    var docAssessmentAppraise = tools.open_doc(ID);
    var docAssessmentAppraiseTE = docAssessmentAppraise.TopElem;

    // Флаг новой процедуры.
    sNew = docAssessmentAppraiseTE.custom_elems.ObtainChildByKey('sNew').value;
    if(sNew == 'new')
    {
        InitObject(docAssessmentAppraise);
        FillObject(docAssessmentAppraise);
    } else
    {
        fnSaveAssVars(docAssessmentAppraise);
    }

    // флаг из диалога - можно ли создавать планы и анкеты
    var bCreatePlanPA = tools_web.is_true(docAssessmentAppraiseTE.custom_elems.ObtainChildByKey('bCreatePlanPA').value);
    if(bCreatePlanPA)
    {
        SetProcess(docAssessmentAppraise, docAssessmentAppraiseTE);
        docAssessmentAppraiseTE.auditorys.Clear();
        docAssessmentAppraiseTE.groups.Clear();
        docAssessmentAppraise.SetChanged( true );
    }
}

function FillObject(docObject) {

    var teObject = docObject.TopElem;
    var iApplicationInstanceIDParam = tools_app.get_cur_application_instance( tools_app.get_application('websoft_pdp_ext_v2'), null, teObject.id.Value, teObject).id;
    _doc_instance = tools.open_doc( iApplicationInstanceIDParam );
    teObject.doc_info.creation.app_instance_id = tools_app.get_str_app_instance_id( iApplicationInstanceIDParam );
    _instance = _doc_instance.TopElem;

    _instance.name = teObject.name
    _instance.code = teObject.code;
    _instance.wvars.ObtainChildByKey('users_type').value = teObject.custom_elems.ObtainChildByKey('users_type').value
    _doc_instance.Save();

    var iAssPrintFormID = OptInt(tools_app.get_cur_settings("ass_print_form_id", "instance", null, null, null, teObject.id.Value),undefined);
    var sCompProfileType = tools_app.get_cur_settings("competence_profile_type", "instance", null, null, null, teObject.id.Value);
    var iCompProfileID = OptInt(tools_app.get_cur_settings("competence_profile_id", "instance", null, null, null, teObject.id.Value),undefined);

    for(_part in docObject.TopElem.participants)
    {
        for( _type in _part.assessment_appraise_types )
        {
            if( iAssPrintFormID!=undefined)
            {
                _type.print_form_id = iAssPrintFormID;
            }
            if (sCompProfileType=="one" && iCompProfileID>0)
            {
                _type.competence_profile_id = iCompProfileID;
            }
        }
    }

    var sAuditorys = ArrayMerge(docObject.TopElem.auditorys,"This.PrimaryKey",",");
    docObject.TopElem.auditorys.Clear();
    docObject.Save();
    var sReq;
    var sFillAuditorysType = teObject.custom_elems.ObtainChildByKey('users_type').value;

    switch(sFillAuditorysType)
    {
        case 'all':
            sAuditorys = ArrayMerge( XQuery("for $elem in collaborators where $elem/is_dismiss!=true() return $elem/Fields('id')") ,"This.id",",");
            break;
        case 'group':
            sReq = "for $elem in group_collaborators where $elem/group_id=" + OptInt(teObject.custom_elems.ObtainChildByKey('users_group_id').value,0) + " return $elem/Fields('collaborator_id')";
            sAuditorys = ArrayMerge( tools.xquery(sReq) ,"This.collaborator_id",",");
            break;
        case 'file':
            sAuditorys = LoadIdsFromFile(teObject.custom_elems.ObtainChildByKey('users_file_name').value);
            break;
    }


    if (sAuditorys!='')
        fnGenerateAssPlan(docObject.DocID, sAuditorys, teObject);
    //CallServerMethod( 'tools_ass', 'generate_assessment_plan', [docObject.DocID, false, false, false, null, null, null, sAuditorys ] );
}

function fnSaveAssVars(docObject) {

    var teObject = docObject.TopElem;
    _instance_doc = tools.open_doc(teObject.doc_info.creation.app_instance_id);
    _instance = _instance_doc.TopElem;
    _instance.name = teObject.name
    _instance.code = teObject.code;
    _instance.wvars.ObtainChildByKey('users_type').value = teObject.custom_elems.ObtainChildByKey('users_type').value
    _instance_doc.Save();

    sCSSUrl = tools_app.get_cur_settings("css_url", "app", null, null, null, teObject.id.Value);

    if (sCSSUrl == "")
    {
        docObject.TopElem.css_template_id.Clear();
    }
    else
    {
        catCurTemplReq = ArrayOptFirstElem(XQuery("for $elem in custom_web_templates where $elem/code = 'websoft_pdp_ext_application_css' return $elem/Fields('id')"));
        if (catCurTemplReq!=undefined)
        {
            docObject.TopElem.css_template_id = catCurTemplReq.id;
        }
    }

    catCurTemplReq = ArrayOptFirstElem(XQuery("for $elem in custom_web_templates where $elem/code = 'ptr_ipr_assessment_css' return $elem/Fields('id')"));
    if (catCurTemplReq!=undefined)
    {
        docObject.TopElem.css_template_id = catCurTemplReq.id;
    }

    docObject.Save();
}

function PostSaveSetting( TopElem ) {
    _app = tools_app.get_cur_application();

    var sCurTemplReq = "for $elem in custom_web_templates where $elem/app_instance_id=" + CodeLiteral("0x" + StrHexInt(_app.id.Value)) + " and $elem/cwt_type='css' and contains($elem/code, " + XQueryLiteral(_app.code.Value) + ") return $elem/Fields('id')";

    var curReq = ArrayOptFirstElem(tools.xquery(sCurTemplReq));
    if(curReq != undefined)
    {
        var docCSSTemplate = tools.open_doc(OptInt(curReq.id,0));

        if(docCSSTemplate != undefined)
        {
            var  sCSSTemplateFileURL = _app.wvars.ObtainChildByKey("css_url").value;
            if(sCSSTemplateFileURL != "")
            {
                sCSSTemplateFileURL = StrReplace(sCSSTemplateFileURL, "\\", "/");
                if(!StrContains(sCSSTemplateFileURL, "/"))
                {
                    sCSSTemplateFileURL = "x-local://wtv/ui_forms/websoft_assessment_pdp_ext/" + sCSSTemplateFileURL
                }

                docCSSTemplate.TopElem.url = sCSSTemplateFileURL;
                docCSSTemplate.TopElem.exec_code.code_url = sCSSTemplateFileURL;
            }
            else
            {
                docCSSTemplate.TopElem.url.Clear();
                docCSSTemplate.TopElem.exec_code.code_url.Clear();
            }
            docCSSTemplate.Save();
        }
    }
}

function LoadIdsFromFile( sFileName ) {
    return "";
}

function toLog(Msg, LogNamePrefix, bIsDebug) {
    if(bIsDebug == undefined)
    {
        bIsDebug = global_settings.debug;
    }
    if(bIsDebug)
    {
        try
        {
            LogNamePrefix = LogName;
        }catch(err){}

        if(LogNamePrefix == undefined || LogNamePrefix == null)
        {
            LogNamePrefix = "appl_websoft_pdp_ext_v2";
            try
            {
                objData;
                var curAppl = tools_app.get_application(objData.id);
            }
            catch(err)
            {
                var curAppl = tools_app.get_application("websoft_pdp_ext_v2");
            }
            if(curAppl !=  null) LogNamePrefix = "appl_" + curAppl.code;

            EnableLog(LogNamePrefix);
        }

        LogEvent(LogNamePrefix, Msg);
    }
}

function SetProcess(docObject, _dlg) {
    var sFillAuditorysType = _dlg.custom_elems.ObtainChildByKey('users_type').value;
    var sAuditorys = "";
    switch(sFillAuditorysType)
    {
        case 'group':
            sReq = "for $elem in group_collaborators where $elem/group_id=" + OptInt(_dlg.custom_elems.ObtainChildByKey('users_group_id').value,0) + " return $elem/Fields('collaborator_id')";
            sAuditorys = ArrayMerge( tools.xquery(sReq) ,"This.collaborator_id",",");
            break;
        default:
            sAuditorys = ArrayMerge(docObject.TopElem.auditorys,"This.PrimaryKey",",");
            break;
    }
    if( sAuditorys!="" )
        fnGenerateAssPlan(docObject.DocID, sAuditorys, _dlg)
    //CallServerMethod( 'tools_ass', 'generate_assessment_plan', [docObject.DocID, false, true, false, null, null, null, sAuditorys ] );
}

function fnGenerateAssPlan(_docID,_sAuditorys, _dlg) {
    _newArrAuditorys = new Array();
    sMsgErr = "";
    var sAuditorys = "";

    for( _person_id in String(_sAuditorys).split(",") )
    {
        if( getSearchAssBoss(OptInt(_person_id,0), _docID, null, false)==undefined )
        {
            fldPerson = ArrayOptFirstElem(tools.xquery("for $elem in collaborators where $elem/id=" + OptInt(_person_id,0) + " return $elem"));
            sMsgErr+=(sMsgErr!="" ? ",":"")+(fldPerson!=undefined ? fldPerson.fullname : "")
        }
        else
            _newArrAuditorys.push(_person_id)
    }

    sAuditorys = ArrayMerge(_newArrAuditorys,"This",",");

    if ( sAuditorys != "" )
    {
        // params - ASSESSMENT_ID, PLAN_ONLY, IS_CLEAN, KILL, FLOORBOUND, ACOUNT, GROUP_ID, AUDITORIS_IDS,
        CallServerMethod( 'tools_ass', 'generate_assessment_plan', [_docID, false, true, false, null, null, null, sAuditorys ] );

        for (_pa in tools.xquery("for $elem in pas where $elem/assessment_appraise_id = " + _docID + " and MatchSome($elem/person_id,(" + sAuditorys + ")) and ForeignElem($elem/assessment_plan_id)/boss_id != $elem/expert_person_id return $elem/Fields('assessment_plan_id','expert_person_id')"))
        {
            _planDoc = tools.open_doc(_pa.assessment_plan_id);
            if (_planDoc != undefined)
            {
                _planDoc.TopElem.boss_id = _pa.expert_person_id;
                _planDoc.Save();
            }
        }

        if (tools_web.is_true(_dlg.custom_elems.ObtainChildByKey('mail_send').value))
        {
            _mail_tmpl = 'websoft_pdp_ext_v2_00';
            for (_assplan in XQuery("for $obj in assessment_plans where $obj/assessment_appraise_id=" + _docID + " and MatchSome($obj/person_id,("+sAuditorys+")) return $obj/Fields('id')"))
            {
                tools.create_notification(_mail_tmpl, _assplan.id.Value, "", _docID);
            }
        }
    }

    if( sMsgErr!="" )
        alert(i18n.t( 'dlyasotrudnikov' )+sMsgErr+i18n.t( 'nenaydenrukovo' ))
}

function fnStringToArray(sArray) {
    var s1stChar = sArray.charAt(0);
    var isThisObject = (ArrayOptFind(["<", "{", "["], "This == " + CodeLiteral(s1stChar)) != undefined)
    if(isThisObject)
    {
        return tools.read_object(sArray)
    }
    else if(String(sArray) != "")
    {
        var oArray = StrReplace(sArray, ";", ",").split(",");
        var retArray = [];
        for(item in oArray)
        {
            item = Trim(item);
            try
            {
                item = Int(item);
            }catch(e){}

            retArray.push(item);
        }
        return retArray;
    }
    else
    {
        return [];
    }
}

function getCopyObjectByValue(oObject) {
    return ParseJson(EncodeJson(oObject));
}

function appendCopyObjectByValue(oObject, oParent) {
    var _vrf = ParseJson(EncodeJson(oObject));
    for (_elem in _vrf)
    {
        oParent.SetProperty(_elem, _vrf.GetOptProperty(_elem));
    }
    return oParent;
}

function getConfigTreeTemplate(curAAPID) {
    var oConfig = new Object();

    var sWrapperClass = tools_app.get_cur_settings("wrapper_class_name", "app", null, null, null, curAAPID);
    var iHelpDocID = OptInt( tools_app.get_cur_settings( 'buttons.help.document_id', 'instance', '', null, null, curAAPID, null ), 0);
    var bHelpShow = tools_web.is_true( tools_app.get_cur_settings( 'buttons.help.is_view', 'instance', '', null, null, curAAPID, null ) );
    var sTreeTitle = tools_app.get_cur_settings("tree_title", "instance", null, null, null, curAAPID);

    oConfig.btn_users = true;
    oConfig.btn_objectives = false;
    oConfig.btn_logs = true;
    if(sWrapperClass != "")
    {
        oConfig.wta_class =  sWrapperClass;
    }

    oConfig.buttons = [];
    var sButtonUrl = "";
    var oButtonItem = {};

    if ( iHelpDocID>0 && bHelpShow )
    {
        sButtonUrl = "/custom_web_template.html?custom_web_template_id=7171079617500254226" + "&doc_id=" + iHelpDocID;
        oButtonItem = 	{
            "action": "iframe",
            "id": "help",
            "title": i18n.t( 'pomoshiinformac' ),
            "url": UrlEncode(sButtonUrl),
            "title_close_action": "none",
            "dialog_title": i18n.t( 'pomoshiinformac' ),
            "iframe_width": 90,
            "iframe_height": 100,
            "visible": true
        }
        oConfig.buttons.push(oButtonItem);
    }

    if (sTreeTitle!="")
    {
        oConfig.btn_users_title = sTreeTitle;
        oConfig.tree_header_label = sTreeTitle;
    }

    return oConfig;
}

function fnGetScoreTextColor(score) {
    try {
        if (score >= 3.2 && score <= 4) return '#008000';

        if (score >= 2.5 && score <= 3.1) return '#ffdb58';

        return '#808080';
    } catch (error) {
        throw Error("getScoreTextColor: " + error);
    }
}

function fnGetCompetenceScores(curPA, curPersonID) {
    try {
        var docAssessmentApprise = tools.open_doc(OptInt(curPA.assessment_appraise_id, 0)); // Процедура ИПР
        if (docAssessmentApprise == undefined) return null;

        var efficiencyAssessmentAppraiseID = docAssessmentApprise.TopElem.custom_elems.ObtainChildByKey("efficiency_assessment_appraise").value; // Процедура оценки эффективности
        if (efficiencyAssessmentAppraiseID == undefined || efficiencyAssessmentAppraiseID == '') return null;

        var docEfficiencyAssessmentAppraise = tools.open_doc(efficiencyAssessmentAppraiseID);
        if (docEfficiencyAssessmentAppraise == undefined) return null;

        var marksQuery = ArrayDirect(tools.xquery("sql:\
            WITH t_table AS (\
                SELECT\
                    pas.id\
                    ,pas.name\
                    ,competence.value('(competence_id)[1]', 'bigint') as competence_id\
                    ,cmps.name as competence_name\
                    ,COALESCE(competence.value('(mark_text)[1]', 'float'), 0) as mark\
                FROM pas pas\
                JOIN pa pa ON pa.id = pas.id\
                OUTER APPLY pa.data.nodes('pa/competences/competence') AS competences(competence)\
                LEFT JOIN competences cmps ON cmps.id = competence.value('(competence_id)[1]', 'bigint')\
                WHERE 1=1\
                AND competence.value('(competence_id)[1]', 'bigint') IS NOT NULL\
                AND pas.is_done = 1\
                AND pas.person_id = " + OptInt(curPersonID) + "\
                AND pas.assessment_appraise_id = " + efficiencyAssessmentAppraiseID + "\
            )\
            \
            SELECT\
                t.competence_id\
                ,t.competence_name\
                ,SUM(t.mark) as [total]\
                ,COUNT(t.id) as [count]\
            FROM t_table t\
            WHERE competence_id IS NOT NULL\
            \
            GROUP BY\
                t.competence_id\
                ,t.competence_name\
        "));

        if (ArrayCount(marksQuery) < 1) return null;

        var competenceMarks = {};
        var scoreAvg, scoreHTML, scoreColor;

        for (mark in marksQuery) {
            if (mark.total.Value != null && mark.count.Value != null) {
                scoreAvg = Math.round((Real(mark.total.Value) / Real(mark.count.Value)) * 10.0) / 10.0;
            } else {
                scoreAvg = null;
            }

            if (scoreAvg != null) {
                scoreColor = fnGetScoreTextColor(scoreAvg);
                scoreHTML = '<span style="border-radius: 4px; padding: 2px 8px; margin-left: 8px; color: ' + scoreColor + ' ">' + scoreAvg + '</span>';
            } else {
                scoreHTML = '';
            }

            competenceMarks.SetProperty(mark.competence_id.Value, {
                competence_name: mark.competence_name.Value,
                score: scoreAvg,
                score_html: scoreHTML,
                competence_name_and_score_html: mark.competence_name.Value + " " + scoreHTML
            });
        }

        return competenceMarks;
    } catch (error) {
        throw Error("fnGetCompetenceScores: " + error);
    }
}

function getConfigPATemplate(objData, docPA, curPersonID) {
    var curPA = docPA.TopElem;
    var bIsDebug = global_settings.debug;
    var LogName = "";
    var competenceScore = fnGetCompetenceScores(curPA, curPA.person_id);

    var curApplInctanceIDs = [];
    var curObjDoc = tools.open_doc(objData.id);

    if(curObjDoc != undefined) {
        curApplInctanceIDs.push(curObjDoc.TopElem.doc_info.creation.app_instance_id.Value)
    }

    var curAppl = tools_app.get_application(objData.id);
    curApplInctanceIDs.push("0x" + StrHexInt(curAppl.id.Value));

    if(bIsDebug) {
        if(curAppl !=  null) LogName = "appl_" + curAppl.code;

        EnableLog(LogName);
    }

    var sCompetenceViewType = tools_app.get_cur_settings("competence_view_type", "instance", null, null, null, objData.id); //Способ выбора развиваемых компетенций

    var arrOmnyDevelopmentMethodIDs = fnStringToArray(tools_app.get_cur_settings("omny_development_method_ids", "instance", null, null, null, objData.id));	//дополнительные, общие для всех компетенций, способы развития
    var	arrOvelayDevelopmentMethods = [];

    if (ArrayCount(arrOmnyDevelopmentMethodIDs) > 0) {
        var _hgsdhgud = ArraySelectAll(tools.xquery("for $elem in development_methods where MatchSome($elem/id, (" + ArrayMerge(arrOmnyDevelopmentMethodIDs, "OptInt(This.__value, 0)", ",") + ")) return $elem"));

        for (_gshghd in arrOmnyDevelopmentMethodIDs) {
            _hhgshewew = ArrayOptFind(_hgsdhgud, "This.id == " + OptInt(_gshghd.__value));

            if (_hhgshewew != undefined) {
                arrOvelayDevelopmentMethods.push(_hhgshewew);
            }
        }
    }

    var bOmnyDevelopmentMethodIsOverlay = tools_web.is_true(tools_app.get_cur_settings("omny_development_methods_is_overlay", "instance", null, null, null, objData.id)); // Общие способы развития перекрывают все остальные

    var arrAddObjectiveIDs = fnStringToArray(tools_app.get_cur_settings("add_category_ids", "instance", null, null, null, objData.id));	// Дополнительные категории способов развития ИПР
    var	arrAddDevelopmentMethodToPA = tools.xquery("for $elem in development_methods where MatchSome($elem/id, (" + ArrayMerge(arrAddObjectiveIDs, "OptInt(This.__value, 0)", ",") + ")) return $elem");

    var sAddObjectiveMethod = tools_app.get_cur_settings("add_category_method", "instance", null, null, null, objData.id); //Способ добавления дополнительных категорий способов развития ИПР (кнопкой или всё сразу))

    var bAddDevelopmentMethods = false;
    var bAddAllDevelopmentMethods = tools_web.is_true(tools_app.get_cur_settings("add_all_dev_methods", "instance", null, null, null, objData.id)); // Добавлять к компетенциям все допустимые способы развития
    var iMaxNumCompetences = OptInt(tools_app.get_cur_settings("max_num_competence", "instance", null, null, null, objData.id), 9999);
    var bNoDevelopmentTask = tools_web.is_true(tools_app.get_cur_settings("no_development_task", "instance", null,  null, null, objData.id));

    // By AF
    var sDevelopmentTaskSelect = tools_app.get_cur_settings("development_task_select", "instance", null, null, null, objData.id); // показывать выбор несколькких развивающих действий в переключающейся форме
    var bCommonCategorys = tools_web.is_true(tools_app.get_cur_settings("common_category", "instance", null, null, null, objData.id)); //
    var bSplitCategorys = tools_web.is_true(tools_app.get_cur_settings("split_category_into_tree", "instance", null, null, null, objData.id)); //
    var bShowDescInSection = tools_web.is_true(tools_app.get_cur_settings("show_desc_in_section", "instance", null, null, null, objData.id));
    var sDescSectionName = tools_app.get_cur_settings("desc_section_name", "instance", null, null, null, objData.id);
    var sDescNewDev = tools_app.get_cur_settings("desc_new_dev", "instance", null, null, null, objData.id);
    var bSeparatePlan = tools_web.is_true(tools_app.get_cur_settings("separate_plan", "instance", null, null, null, objData.id)); //
    var bHasOther = tools_web.is_true(tools_app.get_cur_settings("has_other", "instance", null, null, null, objData.id)); //
    var sHasOtherTitle = (tools_app.get_cur_settings("has_other_title", "instance", null, null, null, objData.id)); //
    var sHasOtherName = (tools_app.get_cur_settings("has_other_name", "instance", null, null, null, objData.id)); //
    var sHasOtherDesc = (tools_app.get_cur_settings("has_other_desc", "instance", null, null, null, objData.id)); //
    var sHasOtherScale = (tools_app.get_cur_settings("has_other_scale", "instance", null, null, null, objData.id)); //
    var bSplitTaskBlock = tools_web.is_true(tools_app.get_cur_settings("split_task_block", "instance", null, null, null, objData.id)); //

// KK
    var bFlagCourseFromProgram = tools_web.is_true(tools_app.get_cur_settings("course_from_program", "instance", null, null, null, objData.id)); // Выбирать электронные курсы из каталога учебных программ
    var bFlagCorrect = tools_web.is_true(tools_app.get_cur_settings("flag_correct", "instance", null, null, null, objData.id)); //
    var bFlagCorrectStrong = tools_web.is_true(tools_app.get_cur_settings("flag_correct_strong", "instance", null, null, null, objData.id)); //
    var bFlagEnd = tools_web.is_true(tools_app.get_cur_settings("flag_end", "instance", null, null, null, objData.id)); //
    var bFlagCancel = tools_web.is_true(tools_app.get_cur_settings("flag_cancel", "instance", null, null, null, objData.id)); //
    var sCancelState = Trim(tools_app.get_cur_settings("flag_cancel_state", "instance", null, null, null, objData.id)); //
    var bFlagOtherProf = tools_web.is_true(tools_app.get_cur_settings("flag_other_prof", "instance", null, null, null, objData.id)); //
    var sFlagTaskCollapsed = Trim(tools_app.get_cur_settings("development_task_collapsed", "instance", null, null, null, objData.id)); //
    var sPositionButton = Trim(tools_app.get_cur_settings("add_category_position_button", "instance", null, null, null, objData.id)); // Позиция кнопки на форме

    if (sPositionButton == "") {
        sPositionButton = "bottom";
    }

    var bFlagShowInstruction = tools_web.is_true(tools_app.get_cur_settings("flag_instruction_ipr", "instance", null, null, null, objData.id)); // Показывать блок i18n.t( 'instrukciyapoza' )
    var sInstructionState = Trim(tools_app.get_cur_settings("flag_instruction_ipr_expand", "instance", null, null, null, objData.id)); //
    var sInstructionTitle = Trim(tools_app.get_cur_settings("flag_instruction_ipr_title", "instance", null, null, null, objData.id)); // заголовок
    var sInstructionText = Trim(tools_app.get_cur_settings("flag_instruction_ipr_text", "instance", null, null, null, objData.id)); // сама подсказка / инструкция
    var bFlagShowInstructionError = tools_web.is_true(tools_app.get_cur_settings("flag_instruction_ipr_show_error", "instance", null, null, null, objData.id)); // Показывать ошибки формы (что еще надо заполнить для того, чтобы форму можно было отправить на согласование)
    var bFlagShowIprError = tools_web.is_true(tools_app.get_cur_settings("flag_show_ipr_error", "instance", null, null, null, objData.id)); // Показывать всплывающее сообщение при сохранении с резюме заполненности ИПР
    var sCommonErrorMessage = tools_app.get_cur_settings("error_message", "instance", null, null, null, objData.id);

    var bFlagShowIprWarn = tools_web.is_true(tools_app.get_cur_settings("flag_show_ipr_warn", "instance", null, null, null, objData.id));

    var bFlagShowProgress = tools_web.is_true(tools_app.get_cur_settings("flag_show_progress", "instance", null, null, null, objData.id));
    var sTitleProgress = tools_app.get_cur_settings("title_progress", "instance", null, null, null, objData.id);
    var bSortProgress = tools_web.is_true(tools_app.get_cur_settings("sort_progress", "instance", null, null, null, objData.id));
    var bShowDescProgress = tools_web.is_true(tools_app.get_cur_settings("show_desc_progress", "instance", null, null, null, objData.id));

    var iRoundOverall = OptInt(tools_app.get_cur_settings("round_overall", "instance", null, null, null, objData.id), 10);

    var sPersonTitle = (tools_app.get_cur_settings("person_title", "instance", null, null, null, objData.id)); //
    var sBossTitle = (tools_app.get_cur_settings("boss_title", "instance", null, null, null, objData.id)); //

    var sDescNewComp = (tools_app.get_cur_settings("desc_new_comp", "instance", null, null, null, objData.id)); //

    var sTaskGrouping = tools_app.get_cur_settings('task_grouping', "instance", null, null, null, objData.id);
    var aTaskGrouping = sTaskGrouping != '' ? ParseJson(sTaskGrouping) : [];

    var bShowEndDate = tools_web.is_true(tools_app.get_cur_settings("show_end_date", "instance", null, null, null, objData.id)); //
    var bAutoAddOneDM = tools_web.is_true(tools_app.get_cur_settings("auto_add_dev_method", "instance", null, null, null, objData.id));

    function ObjectCancel(_object_cancel , all_disabled) {
        try {
            _object_cancel.can_delete = false;

            if ( tools_web.is_true(all_disabled) ) {
                _object_cancel.editable = false;
            }

            _object_cancel.can_add_child = false;

            for (sField in _object_cancel.wfparameters.objective) {
                oField = _object_cancel.wfparameters.objective.GetProperty(sField);

                if (DataType(oField)=="object" && ObjectType(oField) == "JsObject" && (sField!="flag_cancel" || tools_web.is_true(all_disabled))) {
                    if (oField.HasProperty("editable")) {
                        oField.editable = false;
                    }
                }
            }
        } catch(er){
            alert(er);
        }
    }

    function fTaskDisabled(_object) {
        if (_object.HasProperty("objectives") ) {
            for (_o2 in _object.objectives) {
                docTack = tools.open_doc(_o2.id);

                if (tools_web.is_true(docTack.TopElem.custom_fields.ObtainChildByKey('task_disabled').value)) {
                    ObjectCancel(_o2 , true)
                }

                if (_o2.HasProperty("objectives")) {
                    for (_o3 in _o2.objectives) {
                        docTack = tools.open_doc(_o3.id);

                        if (tools_web.is_true(docTack.TopElem.custom_fields.ObtainChildByKey('task_disabled').value)) {
                            ObjectCancel(_o3 , true);
                        }
                    }
                }
            }
        }
    }

    if (objData.GetOptProperty("boss") == undefined && objData.GetOptProperty("expert") != undefined) {
        objData.boss = objData.expert;
    }

    if (sPersonTitle != "" && objData.GetOptProperty("person") != undefined) {
        objData.person.header = sPersonTitle;
        objData.person.title = sPersonTitle;
    }

    if (sBossTitle != "" && objData.GetOptProperty("expert") != undefined) {
        objData.expert.header = sBossTitle;
        objData.expert.title = sBossTitle;
    }

    if (sBossTitle != "" && objData.GetOptProperty("boss") != undefined) {
        objData.boss.header = sBossTitle;
        objData.boss.title = sBossTitle;
    }

    // план оценки
    var curAssessmentPlan = tools.open_doc(curPA.assessment_plan_id).TopElem;
    // этап ДО
    var curState = curAssessmentPlan.workflow_state.Value;
    var bVisibleStatus = StrContains("action,finish,correct",curState);
    var bHasAction = (curState == "action");

    _last_state = ArrayOptFirstElem(ArraySort(curAssessmentPlan.workflow_log_entrys, "This.create_date", "-"));

    if (_last_state != undefined && (_last_state.begin_state == "action" || _last_state.finish_state == "action")) {
        bVisibleStatus = true;
        bHasAction = true;
    }

    // кнопка комментаиев
    var bEnableComment =
        (( curState == 'approve_main' || curState == 'approve_appraise' || curState == '2' || curState == 'action') && curPersonID == curAssessmentPlan.boss_id )
        || (( curState == 'approve_main' || curState == 'approve_appraise' || curState == '2' ) && curPersonID == curAssessmentPlan.boss_id )
        || (( curState == 'approve_func' || curState == 'approve_appraise' ) && ArrayOptFind(curAssessmentPlan.custom_experts, "OptInt(This.person_type, 0) == 0 && This.person_id == " + curPersonID) != undefined  )
        || (( curState == 'approve_high' || curState == 'approve_appraise_high' ) && ArrayOptFind(curAssessmentPlan.custom_experts, "OptInt(This.person_type, 0) == 1 && This.person_id == " + curPersonID) != undefined  )
        || (( curState == 'set' || curState == '1' || curState == 'correct' || curState == 'action') && curPersonID == curAssessmentPlan.person_id );

    var bEnableWeight = false;
    var sPAViewType = "table";

    if (sPAViewType == "table") {
        objData.view_type = "table";
        // уровень, с которого включается режим таблицы
        objData.view_type_level = String(1);
    }

    var WFStatesPhase1 = [ "set", "correct", "summing_results", "coordination_results", "approve_main", "approve_high", "appraise_ipr", "1", "2", "10" ] ;

    if (ArrayOptFind(curAssessmentPlan.custom_experts, "OptInt(This.person_type, 0) == 0") != undefined) {
        WFStatesPhase1.push("approve_func")
    }

    if (bFlagCorrect) {
        WFStatesPhase1.push("correct")
    }

    var WFStatesPhase2 = [ "action", "approve_appraise", "approve_appraise_high", "finish" ]
    var arrShowWFStates = ArrayUnion(WFStatesPhase1, WFStatesPhase2) ;

    var curEditable = objData.HasProperty("editable") && objData.editable;

    objData.config = new Object();

    objData.config.btn_users = true;
    objData.config.btn_objectives = false;
    objData.config.btn_logs = true;
    objData.config.btn_iframe = true;

    if (!tools_web.is_true(objData.GetOptProperty("is_save_action",false))) {
        objData.config.obj_filter = {"value": [{"id":"expand","state":"expand","title":i18n.t( 'razvernutvse' ),"pressed":(sFlagTaskCollapsed=="expand" ? "true" : "false")},{"id":"collapse","state":"expand","title":i18n.t( 'svernutvse' ),"pressed":(sFlagTaskCollapsed=="collapsed" ? "true" : "false")},{"id":"tasks","state":"expand","title":i18n.t( 'sposobyrazvitiya' ),"pressed":"false"}] };
    }

    objData.type_title = i18n.t( 'individualnyyp' );

    if (!objData.HasProperty("dataset")) {
        objData.dataset = {};
    }

    curWorkflow = tools.open_doc( curPA.workflow_id ).TopElem;
    objData.dataset.workflow = { states: [] };

    for (oState in curWorkflow.states) {
        if (ArrayOptFind( arrShowWFStates, "This == '" + oState.code.Value + "'" ) == undefined) {
            continue;
        }

        if (oState.code == "correct" && curState != "correct") {
            if (curState == "set") {
                continue;
            }

            if (ArrayCount(curPA.workflow_log_entrys ) > 0 && ArrayOptFind( curPA.workflow_log_entrys , "StrContains(This.action_id,'correct') || This.begin_state == 'correct' || This.finish_state == 'correct'" ) == undefined) {
                continue;
            }
        }

        if (bFlagEnd && oState.code.Value == "action") {
            continue;
        }
        else if (bHasAction && oState.code.Value == "approve_main") {
            continue;
        }

        oNewState = {
            id: oState.code.Value,
            name: oState.name.Value,
            title: oState.name.Value
        };

        objData.dataset.workflow.states.push( oNewState );

        if (bHasAction && oState.code.Value == "action") {
            oNewState = {
                id: "approve_main",
                name: i18n.t( 'soglasovanie' ),
                title: i18n.t( 'soglasovanie' )
            };
            objData.dataset.workflow.states.push( oNewState );
        }
    }

    if(bFlagShowProgress) {
        objData.dataset.SetProperty("taskflow", []);
        objData.config.task_flow = { show_tasks: (curState != "set"), show_tasks_content: "text", fill_tasks_line: false, title: sTitleProgress, view_type: "progressbar"};
        objData.config.task_flow.color_null = tools_app.get_cur_settings("task_flow_color_null", "instance", null, null, null, objData.id);
        objData.config.task_flow.color_full = tools_app.get_cur_settings("task_flow_color_full", "instance", null, null, null, objData.id)
    }

    bCompetencesAllowChange = curEditable;
    bTaskPhase1AllowChange = curEditable;
    bTaskPhase2IsVisible = false;
    bTaskPhase2AllowChange = false;

    if(curState == "appraise_ipr") {
        bCompetencesAllowChange = false;
        bTaskPhase1AllowChange = false;
        bTaskPhase2IsVisible = true;
        bTaskPhase2AllowChange = curEditable;
    }

    if(ArrayOptFind(WFStatesPhase2, "This == " + CodeLiteral(curState)) != undefined) {
        bTaskPhase2IsVisible = true;
    }

    var iCurSelectedCompetenceCount = 0;
    var bCompetenceNumOverLimit = false;

    if (objData.HasProperty("objectives")) {
        if ( sCompetenceViewType == 'select') {
            iCurSelectedCompetenceCount = ArrayCount(ArraySelect(objData.objectives, "OptInt(This.GetOptProperty('competence_id',{value:0}).value,0)>0"))
        } else {
            iCurSelectedCompetenceCount = ArrayCount(ArraySelect(objData.objectives, "This.HasProperty('is_select') && tools_web.is_true(This.is_select.value)"))
        }

        bCompetenceNumOverLimit = (iCurSelectedCompetenceCount >= iMaxNumCompetences);

        var arrAddedObjectives = ArrayExtract(ArraySelect(objData.objectives, "This.HasProperty('development_method_id') && OptInt(This.development_method_id.value) != undefined"), "String(This.development_method_id.value)");
    }

    var bDiableAddButton = bCompetenceNumOverLimit ? true : false;
    var arrButtons = [];
    var oAddCompetenceButton;

    if (sCompetenceViewType == 'select') {
        oAddCompetenceButton = {
            "action":"add",
            "title": i18n.t( 'dobavitkompete' ),
            "position": sPositionButton,
            "visible": false
        };

        oAddCompetenceButton.visible = !bCompetenceNumOverLimit;
        arrButtons.push(oAddCompetenceButton);
    }

    //arrButtons.push({"action":"comment", "title":i18n.t( 'kommentariy' ), "position":"bottom", "visible": bEnableComment });

    objData.wfparameters = {};
    objData.wfparameters.objective = [];
    objData.wfparameters.buttons = [
        {
            "action":"comment",
            "title": i18n.t( 'kommentariy' ),
            "position":sPositionButton,
            "visible": bEnableComment
        },
        {
            "action": "weight",
            "title": i18n.t( 'redaktirovatve' ),
            "position": sPositionButton,
            "visible": bEnableWeight
        }
    ];

    var oViewButtons = [
        {
            "action": "cancel",
            "title": i18n.t( 'zakryt' )
        }
    ];

    var oEditButtons = [
        {
            "action": "save",
            "title": i18n.t( 'sohranit' )
        },
        {
            "action": "cancel",
            "title": i18n.t( 'zakryt' )
        }
    ];

    var addCompetenceObjective = getWFParamTemplate(
        "competence",
        {
            "sCompetenceViewType": sCompetenceViewType,
            "bCompetencesAllowChange": bCompetencesAllowChange,
            "bShowDescInSection": bShowDescInSection,
            "sDescSectionName": sDescSectionName
        }
    );

    addCompetenceObjective.buttons = arrButtons;
    addCompetenceObjective.dialog_buttons = (curEditable) ? getCopyObjectByValue(oEditButtons) : getCopyObjectByValue(oViewButtons);
    addCompetenceObjective.window_title = i18n.t( 'newelement' );
    objData.wfparameters.objective.push(addCompetenceObjective);

    if (sAddObjectiveMethod == "button") {
        var bHasThisObjective, oAddButton;

        for(itemAddToPA in arrAddDevelopmentMethodToPA) {
            bHasThisObjective = (ArrayOptFind(arrAddedObjectives, "This == " + CodeLiteral(String(itemAddToPA.id.Value))) != undefined);
            bDiableAddButton = bDiableAddButton && bHasThisObjective;
            teDevelopmentMethod = tools.open_doc(itemAddToPA.id.Value).TopElem;

            addDevMethodObjective = getWFParamTemplate("development_method", {"sCompetenceViewType": sCompetenceViewType, "bCompetencesAllowChange": bCompetencesAllowChange, "bShowDescInSection": bShowDescInSection, "sDescSectionName": sDescSectionName});
            addDevMethodObjective.instruction.label = ("<center><b>" + itemAddToPA.name.Value + "</b></center>");
            addDevMethodObjective.name.label = itemAddToPA.name.Value;
            addDevMethodObjective.richtext.label = ("<b>" + teDevelopmentMethod.comment.Value + "</b>");
            addDevMethodObjective.development_method_id.visible = false;
            addDevMethodObjective.development_method_id.SetProperty("default", String(itemAddToPA.id.Value));

            addDevMethodObjective.development_method_id.required = false;
            addDevMethodObjective.name.required = false;

            // ***************************** добавление доп вопросов *****************************

            arrSupplementaryQuestionsObject = getSupplementaryQuestionsObjectConfig(teDevelopmentMethod);
            iFieldCount = 0;

            if ( ArrayCount( arrSupplementaryQuestionsObject ) > 0 ) {
                addDevMethodObjective.SetProperty( "divider", "" );
            }

            for(itemDevMethodScales in arrSupplementaryQuestionsObject) {
                iFieldCount++;
                addDevMethodObjective.SetProperty(itemDevMethodScales.object_code, getWFParamTemplate("fieldSupplementaryQuestions"));
                _setFW = addDevMethodObjective.GetOptProperty(itemDevMethodScales.object_code);
                _setFW.label = itemDevMethodScales.object_title;
                _sQType = itemDevMethodScales.GetOptProperty("object_type", "1");
                _setFW.control_type = (_sQType == "2" ? "select" : (_sQType == "3" ? "checkbox" : "textarea"));

                if (tools_web.is_true(itemDevMethodScales.GetOptProperty("is_view", "0"))) {
                    _setFW.visible_in = "form;view";
                }

                if (tools_web.is_true(itemDevMethodScales.GetOptProperty("is_required", "0"))) {
                    _setFW.required = true;
                }

                if ( itemDevMethodScales.GetOptProperty("object_entries", "") != "" ) {
                    _setFW.scale = {"value": ParseJson(itemDevMethodScales.GetOptProperty("object_entries", []))};
                    if ( _setFW.control_type == "select") {
                        _setFW.placeholder = "---";
                    }
                }
            }

            // ***************************** добавление доп вопросов *****************************

            addDevMethodObjective.buttons = [];
            oAddButton = {
                "action": "add",
                "title": i18n.t('dobavit') + itemAddToPA.name + "\"",
                "position": sPositionButton,
                "visible": false
            };
            oAddButton.visible = !bHasThisObjective;
            addDevMethodObjective.buttons.push(oAddButton);
            addDevMethodObjective.objective = [{
                buttons: [{
                    "action": "add",
                    "title": i18n.t( 'dobavitrazviva' ),
                    "visible": true
                }]
            }];

            addDevMethodObjective.dialog_buttons = (curEditable) ? getCopyObjectByValue(oEditButtons) : getCopyObjectByValue(oViewButtons);
            objData.wfparameters.objective.push(addDevMethodObjective);
        }
    }

    var arrCompetenceInCurProfileXQuery = [];
    var iCompetenceProfileID = null;
    var curProfileComp = undefined
    var arrObjectivesCompetence, hasTask, sReqHasTask;
    var newTaskDoc, newTaskTE, newTaskID, addPATaks, newObjectives;

    if(curPA.competence_profile_id.HasValue) {
        iCompetenceProfileID = curPA.competence_profile_id.Value;
    } else {
        var curPerson = curPA.person_id.OptForeignElem;

        if (curPerson != undefined) {
            var curPositionPerson = curPerson.position_id.OptForeignElem;

            if (curPositionPerson != undefined) {
                iCompetenceProfileID = curPositionPerson.competence_profile_id.Value;
                curPA.competence_profile_id = iCompetenceProfileID;
                docPA.Save();
            }
        }

    }

    if (iCompetenceProfileID != null) {
        // профиль компетенций оцениваемого
        curProfileComp = tools.open_doc(iCompetenceProfileID);

        if (curProfileComp != undefined) {
            curProfileComp = curProfileComp.TopElem;

            // компетенции из профиля компетенций оцениваемого (профиль - в должности)
            for(_comp in curProfileComp.competences){
                arrCompetenceInCurProfileXQuery.push(ArrayFirstElem(XQuery("for $obj in competences where  $obj/id="+_comp.competence_id+" return $obj")));
            }

        }
    }

    var bHasCompetenceInCurProfile = (ArrayOptFirstElem(arrCompetenceInCurProfileXQuery) != undefined);

    var arrDevelopmentMethodScales = [];
    var arrFreeCompetence = [];
    var arrFullDevelopmentMethodsInComp = [];
    var arrScalesDevelopmentMethod;
    var curObjectivesCompetence, curCompetenceInProfileXML, sCurObjectiveDevelopmentMethods, docCurCompetenceInProfile;
    var bHasOvelayDevelopmentMethods =(ArrayOptFirstElem(arrOvelayDevelopmentMethods) != undefined);
    var arrOtherObjectives, iOtherObjectID;

    if (objData.HasProperty("objectives")) {
        for (itemCompetenceInProfile in arrCompetenceInCurProfileXQuery) {
            // цели/задачи по данной компетенции
            curObjectivesCompetence = ArrayOptFind(ArraySelect(objData.objectives, "This.HasProperty('competence_id') && This.competence_id.HasProperty('value')"),"OptInt(This.competence_id.value,0)==" + OptInt(itemCompetenceInProfile.id.Value,99));

            if(curObjectivesCompetence != undefined) {
                curCompetenceInProfileXML = curProfileComp.competences.GetOptChildByKey(itemCompetenceInProfile.id.Value);

                if (curCompetenceInProfileXML != undefined) {
                    sCurObjectiveDevelopmentMethods = "0";
                    arrScalesDevelopmentMethod = [];

                    if (curObjectivesCompetence.HasProperty("objectives")) {
                        sCurObjectiveDevelopmentMethods = ArrayMerge(curObjectivesCompetence.objectives,"This.development_method_id.value",",");
                    }

                    if(bHasOvelayDevelopmentMethods) {
                        arrScalesDevelopmentMethod = ArrayUnion(arrScalesDevelopmentMethod,
                            ArrayExtract(
                                arrOvelayDevelopmentMethods,
                                "({'id': This.id.Value,'name': (This.name.Value != '' ? This.name.Value : This.code.Value)})"
                            )
                        );
                    }

                    if(!(bHasOvelayDevelopmentMethods && bOmnyDevelopmentMethodIsOverlay)) {
                        if (ArrayOptFirstElem(curCompetenceInProfileXML.development_methods) != undefined) {
                            arrScalesDevelopmentMethod = ArrayUnion(arrScalesDevelopmentMethod,
                                ArrayExtract(
                                    ArraySelect(
                                        curCompetenceInProfileXML.development_methods,
                                        "!StrContains('" + sCurObjectiveDevelopmentMethods + "',String(This.development_method_id))"
                                    ),"({'id': This.development_method_id.Value,'name': (This.development_method_id.OptForeignElem==undefined ? '----' : This.development_method_id.OptForeignElem.name.Value)})"
                                )
                            );
                        } else {
                            docCurCompetenceInProfile = tools.open_doc(itemCompetenceInProfile.id.Value);

                            if (docCurCompetenceInProfile != undefined) {
                                arrFullDevelopmentMethodsInComp = [];

                                for (itemLevelInComp in docCurCompetenceInProfile.TopElem.levels) {
                                    arrFullDevelopmentMethodsInComp = ArrayUnion(arrFullDevelopmentMethodsInComp, itemLevelInComp.development_methods);
                                }

                                if (ArrayOptFirstElem(arrFullDevelopmentMethodsInComp) != undefined) {
                                    arrScalesDevelopmentMethod = ArrayUnion(arrScalesDevelopmentMethod,
                                        ArrayExtract(
                                            ArraySelect(
                                                arrFullDevelopmentMethodsInComp,
                                                "!StrContains('"+sCurObjectiveDevelopmentMethods+"',String(This.development_method_id))"
                                            ),
                                            "({'id':This.development_method_id.Value, 'name':(This.development_method_id.OptForeignElem == undefined ? '----' : This.development_method_id.OptForeignElem.name.Value)})"
                                        )
                                    );
                                }
                            }
                        }
                    }

                    arrDevelopmentMethodScales.push(
                        {
                            "object_id":OptInt(itemCompetenceInProfile.id.Value,99),
                            "type":"development_method",
                            "scale": arrScalesDevelopmentMethod
                        }
                    );
                }
            } else {
                arrFreeCompetence.push(itemCompetenceInProfile);
            }

            // если Oтметить в общем списке, то добавление всех компетенций из профиля
            if (sCompetenceViewType == 'check') {
                newObjectives = getNewObjectives(null, itemCompetenceInProfile, "", docPA)

                if (newObjectives != null) {
                    objData.objectives.push(newObjectives);
                }
            }
        }
    } else {
        arrFreeCompetence = ArraySelectAll(arrCompetenceInCurProfileXQuery);
    }
    // dataset для выбора компетенций
    objData.dataset.competences = ArrayExtract(arrFreeCompetence,"({'id': This.id.Value+'', 'name': This.name.Value})");
    toLog("arrDevelopmentMethodScales : " + tools.object_to_text(arrDevelopmentMethodScales, "json"), LogName, false);

    // dataset для категорий развивающих действий
    var sAllowedObjectNameTypes = tools_app.get_cur_settings('allowed_object_types', 'app', null, null, null, objData.id);
    var arrAllowedObjectNameTypes = sAllowedObjectNameTypes != '' ? ParseJson(sAllowedObjectNameTypes) : [];

    var bUseKnowledge = tools_web.is_true( tools_app.get_cur_settings('use_knowledge', 'instance', null, null, null, objData.id) );

    var sReq;
    var aReqData;
    var aReqDataSet = [];
    var aReqDataSet2 = [];

    for(itemObjectNameType in arrAllowedObjectNameTypes) {
        aReqDataSet = [];
        aReqDataSet2 = [];
        _svCatalog = itemObjectNameType.name;

        if (bFlagCourseFromProgram && _svCatalog=="course") {
            _svCatalog = "education_method";
        }

        sReq = "for $elem in roles where $elem/catalog_name=" + CodeLiteral(_svCatalog) + " and $elem/code=" + CodeLiteral(curAppl.code) + " order by $elem/name return $elem";
        aReqData = ArraySelectAll(tools.xquery(sReq));

        if (ArrayCount(aReqData) == 1) {
            oRegItem = ArrayOptFirstElem(aReqData);
            sReq = "for $elem in roles where $elem/catalog_name=" + CodeLiteral(_svCatalog) + " and $elem/parent_role_id=" + oRegItem.id.Value + " order by $elem/name return $elem";
            aReqData = tools.xquery(sReq);
        }

        for (_req in aReqData) {
            if (bSplitCategorys) {
                aReqDataSet.push(({'id': _req.id.Value+'', 'name': _req.name.Value}));
            } else {
                if (_req.parent_role_id.HasValue) {
                    aReqDataSet2.push({'id': _req.id.Value+'', 'name': ('&nbsp;&nbsp;&nbsp;' + _req.name.Value)});
                } else {
                    aReqDataSet.push({'id': _req.id.Value+'', 'name': ('&nbsp;&nbsp;&nbsp;' + _req.name.Value)});
                }
            }
        }
        objData.dataset.SetProperty(itemObjectNameType.name + "_catalog", aReqDataSet);
        objData.dataset.SetProperty(itemObjectNameType.name + "_catalog2", aReqDataSet2);
        //objData.dataset.SetProperty(itemObjectNameType.name + "_catalog", ArrayExtract(tools.xquery(sReq),"({'id': This.id.Value+'', 'name': This.name.Value})"));
    }

    // dataset для кастомных оценок
    var _level_scale_xml = tools_app.get_cur_settings("levels_scale_default", "app", null,  null, null, objData.id);
    var arrLevelScale = new Array();

    if ( _level_scale_xml != '') {
        _level_scale_arr = OpenDocFromStr(_level_scale_xml);

        for (_velem in _level_scale_arr.TopElem) {
            try {
                if(ArrayOptFind(arrLevelScale,"This.type=='" + _velem.scale_type + "' || OptInt(This.type,0)==OptInt('" + _velem.scale_type + "',99)") == undefined) {
                    _level = new Object();
                    _level.name = _velem.OptChild("scale_name");
                    _level.type = _velem.OptChild("scale_type");
                    _level.editable = (_velem.GetOptProperty('editable')!=undefined ? tools_web.is_true(_velem.editable.Value) : true );
                    _level.scale = Array();

                    for(_scale in _velem.scales) {
                        if( _scale.GetOptProperty('name') != undefined ) {
                            //if( (_scale.GetOptProperty('disabled')!=undefined ? !tools_web.is_true(_scale.disabled.Value) : true ) )  // - скрытие крашит оценки - вывод и расчеты.
                            _level.scale.push({
                                'id': _scale.id.Value + '',
                                'name': ('&nbsp;&nbsp;&nbsp;' + _scale.name.Value),
                                'percent': (_scale.GetOptProperty('percent') != undefined ? _scale.percent.Value : ''),
                                'disabled' : (_scale.GetOptProperty('disabled') != undefined ? tools_web.is_true(_scale.disabled.Value) : false)
                            });
                        }
                    }

                    arrLevelScale.push(_level)
                    objData.dataset.SetProperty(_velem.scale_type + "_status_mark", _level.scale);
                }
            } catch(er) {
                alert(er);
            }
        }
    }

    function fAddStatusMark(_object,_catalog , _parent_catalog,_parent_object) {
        if(_object.HasProperty("task_type")) {
            if (!_object.wfparameters.objective.HasProperty("status_mark")) {
                _object.wfparameters.objective = addRequiredFields(_object.wfparameters.objective, getWFParamTemplate("status_mark"));
            }

            if (_object.HasProperty("development_task_id") && _object.development_task_id.HasProperty("value") && _object.development_task_id.value!="" && ArrayOptFind(arrLevelScale,"This.type=='"+_object.development_task_id.value+"' || OptInt(This.type,0)==OptInt('"+_object.development_task_id.value+"',99)")!=undefined )
            {
                _object.wfparameters.objective.status_mark.data_src = ArrayOptFind(arrLevelScale,"This.type=='"+_object.development_task_id.value+"' || OptInt(This.type,0)==OptInt('"+_object.development_task_id.value+"',99)").type+"_status_mark";
                _object.wfparameters.objective.status_mark.editable = curEditable && tools_web.is_true(ArrayOptFind(arrLevelScale,"This.type=='"+_object.development_task_id.value+"' || OptInt(This.type,0)==OptInt('"+_object.development_task_id.value+"',99)").editable) ;
            }
            else if ( _object.HasProperty(_catalog+"_id") && _object.GetProperty(_catalog+"_id").HasProperty("value") && _object.GetProperty(_catalog+"_id").value!="" && ArrayOptFind(arrLevelScale,"This.type=='"+_object.GetProperty(_catalog+"_id").value+"' || OptInt(This.type,0)==OptInt('"+_object.GetProperty(_catalog+"_id").value+"',99)")!=undefined )
            {
                _scale = ArrayOptFind(arrLevelScale,"This.type=='"+_object.GetProperty(_catalog+"_id").value+"' || OptInt(This.type,0)==OptInt('"+_object.GetProperty(_catalog+"_id").value+"',99)")
                _object.wfparameters.objective.status_mark.data_src = _scale.type+"_status_mark";
                _object.wfparameters.objective.status_mark.editable = curEditable && tools_web.is_true(_scale.editable) ;
            }
            else if( ArrayOptFind(arrLevelScale,"This.type=='"+_catalog+"' || OptInt(This.type,0)==OptInt('"+_catalog+"',99)")!=undefined )
            {
                _object.wfparameters.objective.status_mark.data_src = ArrayOptFind(arrLevelScale,"This.type=='"+_catalog+"' || OptInt(This.type,0)==OptInt('"+_catalog+"',99)").type+"_status_mark";
                _object.wfparameters.objective.status_mark.editable = curEditable && tools_web.is_true(ArrayOptFind(arrLevelScale,"This.type=='"+_catalog+"' || OptInt(This.type,0)==OptInt('"+_catalog+"',99)").editable) ;
            }
            else if ( _object.HasProperty(_parent_catalog+"_id") && _object.GetProperty(_parent_catalog+"_id").HasProperty("value") && _object.GetProperty(_parent_catalog+"_id").value!="" && ArrayOptFind(arrLevelScale,"This.type=='"+_object.GetProperty(_parent_catalog+"_id").value+"' || OptInt(This.type,0)==OptInt('"+_object.GetProperty(_parent_catalog+"_id").value+"',99)")!=undefined )
            {
                _scale = ArrayOptFind(arrLevelScale,"This.type=='"+_object.GetProperty(_parent_catalog+"_id").value+"' || OptInt(This.type,0)==OptInt('"+_object.GetProperty(_parent_catalog+"_id").value+"',99)")
                _object.wfparameters.objective.status_mark.data_src = _scale.type+"_status_mark";
                _object.wfparameters.objective.status_mark.editable = curEditable && tools_web.is_true(_scale.editable) ;
            }
            else if( ArrayOptFind(arrLevelScale,"This.type=='"+_parent_catalog+"' || OptInt(This.type,0)==OptInt('"+_parent_catalog+"',99)")!=undefined )
            {
                _object.wfparameters.objective.status_mark.data_src = ArrayOptFind(arrLevelScale,"This.type=='"+_parent_catalog+"' || OptInt(This.type,0)==OptInt('"+_parent_catalog+"',99)").type+"_status_mark";
                _object.wfparameters.objective.status_mark.editable = curEditable && tools_web.is_true(ArrayOptFind(arrLevelScale,"This.type=='"+_parent_catalog+"' || OptInt(This.type,0)==OptInt('"+_parent_catalog+"',99)").editable) ;
            }
            else if( ArrayOptFind(arrLevelScale,"This.type=='default'")!=undefined )
            {
                _object.wfparameters.objective.status_mark.data_src = "default_status_mark";
            }

            if( curState!="action" && curState!="correct" ) {
                _object.wfparameters.objective.status_mark.editable = false;
            }

            // if( _catalog=="course" || _catalog=="education_method" ) // перенесли настройку в приложение
            //	_object.wfparameters.objective.status_mark.editable = false;

            if (_object.wfparameters.objective.HasProperty("date_fact") && bShowEndDate) {
                _object.wfparameters.objective.date_fact.visible = _object.wfparameters.objective.status_mark.visible;
                _object.wfparameters.objective.date_fact.editable = _object.wfparameters.objective.status_mark.editable;
            }

            try {
                if( IsArray(_parent_object) ) {
                    for (_arr_parent_object in _parent_object) {
                        if( !_arr_parent_object.HasProperty("status_mark") ) {
                            _arr_parent_object = addRequiredFields(_arr_parent_object, getWFParamTemplate("status_mark"));
                        }

                        _arr_parent_object.date_fact.visible = _arr_parent_object.status_mark.visible;
                        _arr_parent_object.date_fact.editable = _arr_parent_object.status_mark.editable;
                    }
                }
                else if( DataType(_parent_object)=="object" && !_parent_object.HasProperty("status_mark") )
                {
                    _parent_object = addRequiredFields(_parent_object, getWFParamTemplate("status_mark"));
                    _parent_object.date_fact.visible = _parent_object.status_mark.visible;
                    _parent_object.date_fact.editable = _parent_object.status_mark.editable;
                }
            } catch(er) {
                alert(er)
            }
        }

        try {
            if ( _object.wfparameters.objective.HasProperty("status_mark") && _object.wfparameters.objective.status_mark.editable && curState!="correct" ) {
                _object.wfparameters.objective.status_mark.required = true;
            }

            if ( _object.wfparameters.objective.HasProperty("date_fact") && _object.wfparameters.objective.date_fact.editable && curState!="correct" ) {
                _object.wfparameters.objective.date_fact.required = true;
            }
        } catch(err) {
        }
    }

    function fCalkMark (_status,_catalog, _object) {
        var _mark = 0.0;
        var fldLevel = undefined;

        if ( fldLevel==undefined && _object.HasProperty("development_task_id") && _object.development_task_id.HasProperty("value") ) {
            fldLevel = ArrayOptFind(arrLevelScale,"This.type=='"+_object.development_task_id.value+"' || OptInt(This.type,0)==OptInt('"+_object.development_task_id.value+"',99)");
        }

        if ( fldLevel==undefined && _object.HasProperty(_catalog+"_id") && _object.GetProperty(_catalog+"_id").HasProperty("value") ) {
            fldLevel = ArrayOptFind(arrLevelScale,"This.type=='"+_object.GetProperty(_catalog+"_id").value+"' || OptInt(This.type,0)==OptInt('"+_object.GetProperty(_catalog+"_id").value+"',99)");
        }

        if ( fldLevel==undefined && _catalog!="" ) {
            fldLevel = ArrayOptFind(arrLevelScale,"This.type=='"+_catalog+"' || OptInt(This.type,0)==OptInt('"+_catalog+"',99)");
        }

        if ( fldLevel==undefined ) {
            fldLevel = ArrayOptFind(arrLevelScale,"This.type=='default' || OptInt(This.type,0)==OptInt('"+_catalog+"',99)");
        }

        if ( fldLevel==undefined ) {
            return null;
        }

        if (_status == "") {
            if (_object.HasProperty("wfparameters")) {
                if (_object.wfparameters.HasProperty("objective")) {
                    if (!_object.wfparameters.objective.HasProperty("status_mark") || !tools_web.is_true(_object.wfparameters.objective.status_mark.GetOptProperty("visible","true"))) {
                        return null;
                    }
                }
            }
        }

        _fldMark = ArrayOptFind(fldLevel.scale, "This.id=='" + _status + "'");

        if (_fldMark != undefined) {
            _mark = OptReal(_fldMark.percent,0.0);
        }

        return _mark;
    }

    function fCalcObjectMark (_object) {
        try {
            var _mark = 0.0;
            var _count = 0;
            var	_mark2=0.0;
            var	_count2=0;
            var	_real_mark = 0.0;
            var _mark_array = [];

            if (_object.HasProperty("objectives")) {
                for (_o2 in _object.objectives) {
                    if (_o2.HasProperty("flag_cancel") && tools_web.is_true(_o2.flag_cancel.value)) continue;

                    sCurTaskObjectCatalog2 = "default";
                    itemCurTask = ArrayOptFind(arrCurPATasks, "This.id==" + OptInt(_o2.id,0));

                    if (itemCurTask != undefined && String(itemCurTask.target_object_type) != "") {
                        sCurTaskObjectCatalog2 = itemCurTask.target_object_type;
                    }

                    _mark2=0.0;
                    _count2=0;
                    _o2_count = 0;

                    if (_o2.HasProperty("objectives")) {
                        _o2_count = ArrayCount(_o2.objectives);

                        for (_o3 in _o2.objectives) {
                            if (_o3.HasProperty("flag_cancel") && tools_web.is_true(_o3.flag_cancel.value)) continue;

                            sCurTaskObjectCatalog3 = "default";
                            itemCurTask = ArrayOptFind(arrCurPATasks, "This.id==" + OptInt(_o3.id,0));

                            if (itemCurTask != undefined && String(itemCurTask.target_object_type) != "") {
                                sCurTaskObjectCatalog3 = itemCurTask.target_object_type;
                            }

                            if (_o3.HasProperty("status_mark")) {
                                _cur_mark = fCalkMark(_o3.status_mark.value,sCurTaskObjectCatalog3, _o3);

                                if (_cur_mark!=null) {
                                    _mark2 += _cur_mark;

                                    if ( curState != "set" && bFlagShowProgress ) {
                                        if (bShowDescProgress) {
                                            vsName = "";
                                            vsTitle = "(" + StrReal(_cur_mark, iRoundOverall) + "%) " + _o3.name.value;
                                        } else {
                                            vsName = "";
                                            vsTitle = "";
                                        }
                                        objData.dataset.taskflow.push({"id": _o3.id, "name": vsName, "state": (_cur_mark==0?"n":(_cur_mark==100?"c":"i")), "icon": "", "class": "","title": vsTitle});
                                    }
                                }
                            }
                            _count2++;
                        }
                    }

                    if (_o2.HasProperty("name") && _o2.HasProperty("name_title") && curState != "set") {
                        _o2.wfparameters.objective.name.visible = false;
                        _o2.wfparameters.objective.name_title.visible = true;
                        _o2.name_title.value= _o2.name.value + (_count2 > 0 ? (i18n.t('vypolnenona') + StrReal(Real(_mark2)/Real(_count2), iRoundOverall) + "%") : "");
                    }

                    // компитенции считаем отдельно
                    if(_count2!=0) {
                        if(StrContains(_o2.name.value,"70")) {
                            _mark+=(_count2!=0 ? _mark2/Real(_count2) : 0)*0.7;
                            _mark_array.push({k: 0.7, m: _mark2, c: _count2});
                        }
                        else if(StrContains(_o2.name.value,"20")) {
                            _mark+=(_count2!=0 ? _mark2/Real(_count2) : 0)*0.2;
                            _mark_array.push({k: 0.2, m: _mark2, c: _count2});
                        }
                        else if(StrContains(_o2.name.value,"10")) {
                            _mark+=(_count2!=0 ? _mark2/Real(_count2) : 0)*0.1;
                            _mark_array.push({k: 0.1, m: _mark2, c: _count2});
                        }
                        else {
                            _mark+=(_count2!=0 ? _mark2/Real(_count2) : 0)*(1.0/Real(ArrayCount(_object.objectives)));
                            _mark_array.push({k: (1.0/Real(ArrayCount(_object.objectives))), m: _mark2, c: _count2});
                        }

                        _count++;
                    }
                    else if (_o2.HasProperty("status_mark") && _o2_count == 0) {
                        _cur_mark = fCalkMark(_o2.status_mark.value,sCurTaskObjectCatalog2, _o2);

                        if (_cur_mark != null) {
                            _mark += _cur_mark;
                            _mark_array.push({k: (1.0/Real(ArrayCount(_object.objectives))), m: _cur_mark, c: 1});

                            if (curState != "set" && bFlagShowProgress) {
                                if (bShowDescProgress) {
                                    vsName = "";
                                    vsTitle = "(" + StrReal(_cur_mark, iRoundOverall) + "%) " + _o2.name.value;
                                } else {
                                    vsName = "";
                                    vsTitle = "";
                                }

                                objData.dataset.taskflow.push({"id": _o2.id, "name": vsName, "state": (_cur_mark==0?"n":(_cur_mark==100?"c":"i")), "icon": "", "class": "","title": vsTitle});
                            }
                            _count++;
                        }
                    }
                }
            } else {
                if (!_object.HasProperty("flag_cancel") || !tools_web.is_true(_object.flag_cancel.value)) {
                    if (_object.HasProperty("status_mark")) {
                        sCurTaskObjectCatalog2 = "default";
                        itemCurTask = ArrayOptFind(arrCurPATasks, "This.id==" + OptInt(_object.id,0));

                        if (itemCurTask != undefined && String(itemCurTask.target_object_type)!="") {
                            sCurTaskObjectCatalog2 = itemCurTask.target_object_type;
                        }

                        _cur_mark = fCalkMark(_object.status_mark.value, sCurTaskObjectCatalog2, _object);

                        if (_cur_mark!=null) {
                            _mark += _cur_mark;

                            if (curState != "set" && bFlagShowProgress) {
                                if (bShowDescProgress) {
                                    vsName = "";
                                    vsTitle = "(" + StrReal(_cur_mark, iRoundOverall) + "%) " + _object.name.value;
                                } else {
                                    vsName = "";
                                    vsTitle = "";
                                }

                                objData.dataset.taskflow.push({"id": _object.id, "name": vsName, "state": (_cur_mark==0?"n":(_cur_mark==100?"c":"i")), "icon": "", "class": "","title": vsTitle});
                            }

                            _count++;
                        }
                    }
                }
            }

            if (ArrayCount(_mark_array) == 0) {
                _real_mark = (_count2!=0 ? _mark : _count!=0 ? _mark/Real(_count) : 0);
            } else {
                _ks = ArraySum(_mark_array, "This.k");
                _real_mark = ArraySum(_mark_array, "Real(This.m) * (Real(This.k) / (Real("+_ks+") * Real(This.c) ))")
            }

            if(_object.HasProperty("name") && _object.HasProperty("name_title") && curState != "set") {
                _object.wfparameters.objective.name.visible = false;
                _object.wfparameters.objective.name_title.visible = true;
                _object.name_title.value= _object.name.value + (_count > 0 ? (i18n.t('vypolnenona') + StrReal(_real_mark, iRoundOverall) + "%") : "");
            }
        } catch(er) {
            alert("fCalcObjectMark - " + er)
        }
        return (_count == 0 ? null : _real_mark);
    }

    function fnBlockEditableObjectFields(_object, _mode) {
        if (_object.HasProperty("objectives")) {
            for (_o1 in _object.objectives) {
                if (_o1.HasProperty("wfparameters") && _o1.wfparameters.HasProperty("objective")) {
                    fnBlockEditableObjectiveFields(_o1, _mode);

                    if (_o1.HasProperty("objectives")) {
                        for (_o2 in _o1.objectives) {
                            if (_o2.HasProperty("wfparameters") && _o2.wfparameters.HasProperty("objective")) {
                                fnBlockEditableObjectiveFields(_o2, _mode);

                                if (_o2.HasProperty("objectives")) {
                                    for (_o3 in _o2.objectives) {
                                        if (_o3.HasProperty("wfparameters") && _o3.wfparameters.HasProperty("objective")) {
                                            fnBlockEditableObjectiveFields(_o3, _mode)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        if (_mode != "plan" && _mode != "correct") {
            _object.can_delete = false;
            _object.can_add_child = false;

            if (_object.HasProperty("wfparameters") && _object.wfparameters.HasProperty("objective")) {
                _object.wfparameters.can_delete = false;
                _object.wfparameters.can_add_child = false;

                if (ObjectType(_object.wfparameters.objective) == "JsArray") {
                    for (_sfw in _object.wfparameters.objective) {
                        _sfw.can_delete = false;
                        _sfw.can_add_child = false;
                        _sbtns = _sfw.GetOptProperty("buttons");

                        if (_sbtns!=undefined && ObjectType(_sbtns) == "JsArray") {
                            for (_btn in _sbtns) {
                                if (_btn.action=="add") {
                                    _btn.visible = false;
                                }
                            }
                        }
                    }
                } else {
                    _sfw = _object.wfparameters.objective;
                    _sfw.can_delete = false;
                    _sfw.can_add_child = false;
                    _sbtns = _sfw.GetOptProperty("buttons");

                    if (_sbtns!=undefined && ObjectType(_sbtns) == "JsArray") {
                        for (_btn in _sbtns) {
                            if (_btn.action=="add") {
                                _btn.visible = false;
                            }
                        }
                    }
                }
            }
        }
    }

    function fnHideNewFields(_wfp) {
        if (_wfp.HasProperty("status_mark") && _wfp.status_mark.HasProperty("visible_in"))
        {
            _wfp.status_mark.visible_in = StrReplace(_wfp.status_mark.visible_in, "form", "");
        }
        if (_wfp.HasProperty("date_fact") && _wfp.date_fact.HasProperty("date_fact"))
        {
            _wfp.date_fact.visible_in = StrReplace(_wfp.date_fact.visible_in, "form", "");
        }
        if (_wfp.HasProperty("flag_cancel") && _wfp.flag_cancel.HasProperty("visible_in"))
        {
            _wfp.flag_cancel.visible_in = StrReplace(_wfp.flag_cancel.visible_in, "form", "");
        }
    }

    function fnBlockEditableObjectiveFields(_objective, _mode) {
        _score_fields = ["status","status_mark","date_fact","flag_cancel"];
        _block_fields = ["name","plan","competence_id","development_method_id","development_task_id","set_other_checkbox","task_type","CustomField_","SupplementaryQuestions_"];
        _block_fields_1 = ["date_plan"];
        _block_delete = "block_delete";
        _block_strong = "block_strong";
        _block_cancel = "flag_cancel";

        if (_mode == "plan") {
            for (_sf in _score_fields) {
                _sfw = _objective.wfparameters.objective.GetOptProperty(_sf);

                if (_sfw != undefined && DataType(_sfw) == "object" && ObjectType(_sfw) == "JsObject" && _sfw.HasProperty("editable") && tools_web.is_true( _sfw.editable )) {
                    _sfw.editable = false;
                    _sfw.visible = false;
                }
            }

            if (_objective.wfparameters.objective.HasProperty("objective")) {
                if (IsArray(_objective.wfparameters.objective.objective)) {
                    for (_owfp in _objective.wfparameters.objective.objective) {
                        fnHideNewFields(_owfp);
                    }
                } else {
                    fnHideNewFields(_objective.wfparameters.objective.objective);
                }
            }
        }
        else if ( _mode == "correct" ) {
            _bdv = _objective.GetOptProperty(_block_delete);
            _bds = _objective.GetOptProperty(_block_strong);
            _is_restrictv = (_bdv != undefined && DataType(_bdv) == "object" && ObjectType(_bdv) == "JsObject" && _bdv.HasProperty("value") && tools_web.is_true( _bdv.value ));
            _is_restricts = (_bds != undefined && DataType(_bds) == "object" && ObjectType(_bds) == "JsObject" && _bds.HasProperty("value") && tools_web.is_true( _bds.value ));

            if (_is_restricts) {
                _block_fields = ArrayUnion(_block_fields, ["date_plan", "date_fact", "status_mark"]);

                for (_sf in _block_fields) {
                    if (StrEnds(_sf,"_")) {
                        for (_iv=1; _iv<20; _iv++) {
                            _sfw = _objective.wfparameters.objective.GetOptProperty(_sf + _iv);

                            if (_sfw != undefined && DataType(_sfw) == "object" && ObjectType(_sfw) == "JsObject" && _sfw.HasProperty("editable") && tools_web.is_true( _sfw.editable )) {
                                _sfw.editable = false;
                            }
                        }
                    } else {
                        _sfw = _objective.wfparameters.objective.GetOptProperty(_sf);

                        if (_sfw != undefined && DataType(_sfw) == "object" && ObjectType(_sfw) == "JsObject" && _sfw.HasProperty("editable") && tools_web.is_true( _sfw.editable )) {
                            _sfw.editable = false;
                        }
                    }
                }
            }

            if ( _is_restrictv ) {
                _objective.can_delete = false;
            }

            if (_objective.wfparameters.objective.HasProperty("objective")) {
                if (IsArray(_objective.wfparameters.objective.objective)) {
                    for (_owfp in _objective.wfparameters.objective.objective) {
                        fnHideNewFields(_owfp);
                    }
                } else {
                    fnHideNewFields(_objective.wfparameters.objective.objective);
                }
            }
        } else {
            for (_sf in _block_fields) {
                if (StrEnds(_sf,"_")) {
                    for (_iv=1; _iv<20; _iv++) {
                        _sfw = _objective.wfparameters.objective.GetOptProperty(_sf + _iv);

                        if (_sfw != undefined && DataType(_sfw) == "object" && ObjectType(_sfw) == "JsObject" && _sfw.HasProperty("editable") && tools_web.is_true( _sfw.editable )) {
                            _sfw.editable = false;
                        }
                    }
                } else {
                    _sfw = _objective.wfparameters.objective.GetOptProperty(_sf);

                    if (_sfw != undefined && DataType(_sfw) == "object" && ObjectType(_sfw) == "JsObject" && _sfw.HasProperty("editable") && tools_web.is_true( _sfw.editable )) {
                        _sfw.editable = false;
                    }
                }
            }

            for (_sf in _block_fields_1) {
                if (StrEnds(_sf,"_")) {
                    for (_iv=1; _iv<20; _iv++) {
                        _sfw = _objective.wfparameters.objective.GetOptProperty(_sf + _iv);

                        if (_sfw != undefined && DataType(_sfw) == "object" && ObjectType(_sfw) == "JsObject" && _sfw.HasProperty("editable") && tools_web.is_true( _sfw.editable )) {
                            _sfw.editable = false;
                        }
                    }
                } else {
                    _sfw = _objective.wfparameters.objective.GetOptProperty(_sf);

                    if (_sfw != undefined && DataType(_sfw) == "object" && ObjectType(_sfw) == "JsObject" && _sfw.HasProperty("editable") && tools_web.is_true( _sfw.editable )) {
                        _sfw.editable = false;
                    }
                }
            }

            _sfd = _objective.GetOptProperty(_block_cancel);

            if (_sfd!=undefined && _sfd.HasProperty("value") && !tools_web.is_true(_sfd.value) && !(bFlagCancel && sCancelState == 'all')) {
                _sfw = _objective.wfparameters.objective.GetOptProperty(_block_cancel);

                if (_sfw!=undefined) {
                    _sfw.visible = false;
                }
            }

            _objective.can_delete = false;
            _objective.can_add_child = false;
        }
    }

    if (objData.HasProperty("wfbuttons")) {
        for (oWFButtonItem in  objData.wfbuttons) {
            oWFButtonItem.confirm_msg = i18n.t( 'vynazhimaetekno' );
        }
    }

    //__sReq = "for $elem in task_types where MatchSome($elem/id, (" + ArrayMerge(curApplInctanceIDs, "CodeLiteral(This)", ",") + ")) return $elem";
    __sReq = "for $elem in task_types return $elem";
    var arrTaskTypes = [];
    var teTaskType, oTaskType, sCurTaskDescription;

    for (itemTaskType in tools.xquery(__sReq)) {
        teTaskType = tools.open_doc(itemTaskType.id).TopElem;

        if (true || ArrayOptFind(curApplInctanceIDs, "This == " + CodeLiteral(teTaskType.doc_info.creation.app_instance_id.Value)) != undefined) {
            sCurTaskDescription = "<p><b>" + teTaskType.name.Value + "</b></p><p>" + teTaskType.comment.Value + "</p>";
            oTaskType = {"id": "0x" + StrHexInt(itemTaskType.id.Value), "name": itemTaskType.name.Value, "descr": sCurTaskDescription};
            arrTaskTypes.push(oTaskType);
        }
    }

    var curObjectivesDevelopmentMethod, curDevelopmentMethod
    var sDeveloperObjectLimitsJSON = "";

    // если дополнительные способы развития добавлять все сразу, а не кнопками
    if(sAddObjectiveMethod == "add_all")
    {
        for(itemAddToPA in arrAddDevelopmentMethodToPA)
        {
            newObjectives = getNewObjectives(null, itemAddToPA, "development_method", docPA, 1000)

            if ( newObjectives != null )
            {
                objData.objectives.push(newObjectives);
            }
        }
    }

    objData.wfparameters.dialog_buttons = (curEditable) ? getCopyObjectByValue(oEditButtons) : getCopyObjectByValue(oViewButtons);

    var arrCurPATasks = ArraySelectAll(XQuery("for $obj in tasks where MatchSome($obj/id,(" + ArrayMerge(curPA.tasks,"This.task_id",",") + ")) return $obj"));

    var itemCurCompetenceInProfileXml, itemCurCompetenceDoc, itemCurDevMethod, itemCurTask;
    var iCurTopObjectID, sTypeObjectiveL1, sTypeObjectiveL2, sTypeObjectiveL3;
    var bHasDevelopmentAction = false
    var arrDevelopmentActionConfig = [];
    var arrDevMethodScales, oDevMethodScale, arrExistsChildIDs, sExistsChildIDs, arrCurScale;
    var sCurTaskObjectCatalog, sCurTaskObjectCatalogTitle, xCurTaskType;

    var _over_percent = 0.0;
    var _over_count = 0;

    if (objData.HasProperty("objectives") ) {
        var bCompetenceIsSelected, textSelected, xTopObjectDoc, itemTaskDoc;

        for (itemObjectiveLev1 in objData.objectives) {
            itemCurCompetenceInProfileXml = undefined;
            itemCurCompetenceDoc = undefined;

            bCompetenceIsSelected = sCompetenceViewType == 'select' || (itemObjectiveLev1.HasProperty("is_select") && tools_web.is_true(itemObjectiveLev1.is_select.value));
            textSelected = itemObjectiveLev1.name.value + (sCompetenceViewType == 'check' && bCompetenceIsSelected ? i18n.t( 'vybranadlyarazv' ):"");

            itemObjectiveLev1.desc.value = sCompetenceViewType == 'check' ? (bCompetenceNumOverLimit ? i18n.t( 'kolichestvovybr' ) : i18n.t( 'otmettekompete' )) : "";

            iCurTopObjectID = 0;
            sTypeObjectiveL1 = "competence";
            sTypeObjectiveL2 = "development_method";
            sTypeObjectiveL3 = "development_task";

            if(itemObjectiveLev1.HasProperty("competence_id") && itemObjectiveLev1.competence_id.value != "") {
                iCurTopObjectID = OptInt(itemObjectiveLev1.competence_id.value, 0);
                itemCurCompetenceInProfileXml = curProfileComp.competences.GetOptChildByKey(OptInt(itemObjectiveLev1.competence_id.value,0));

                sTypeObjectiveL1 = "competence";
                sTypeObjectiveL2 = "development_method";
                sTypeObjectiveL3 = "development_task";
            }
            else if(itemObjectiveLev1.HasProperty("development_method_id") && itemObjectiveLev1.development_method_id.value != "") {
                iCurTopObjectID = OptInt(itemObjectiveLev1.development_method_id.value, 0);
                sTypeObjectiveL1 = "development_method";
                sTypeObjectiveL2 = "development_task";
                sTypeObjectiveL3 = "none";
            }
            else if(itemObjectiveLev1.HasProperty("development_task_id") && itemObjectiveLev1.development_task_id.value != "") {
                iCurTopObjectID = OptInt(itemObjectiveLev1.development_task_id.value, 0);
                sTypeObjectiveL1 = "development_task";
                sTypeObjectiveL2 = "none";
                sTypeObjectiveL3 = "none";
            }

            arrDevelopmentActionConfig = getDevelopmentObjectConfig(iCurTopObjectID);
            bHasDevelopmentAction = (ArrayCount(arrDevelopmentActionConfig) > 0);
            bNoCancelObject = false;
            xTopObjectDoc = tools.open_doc(iCurTopObjectID);

            if(xTopObjectDoc != undefined) {
                if(xTopObjectDoc.TopElem.ChildExists("comment") && xTopObjectDoc.TopElem.comment.HasValue) {
                    itemObjectiveLev1.desc.value = xTopObjectDoc.TopElem.comment.Value;
                }
                else if(xTopObjectDoc.TopElem.ChildExists("desc") && xTopObjectDoc.TopElem.desc.HasValue)
                {
                    itemObjectiveLev1.desc.value = xTopObjectDoc.TopElem.desc.Value;
                }

                bNoCancelObject = tools_web.is_true(xTopObjectDoc.TopElem.custom_elems.ObtainChildByKey("not_cancel_tasks").value);

                if (itemObjectiveLev1.HasProperty("date_plan") && xTopObjectDoc.TopElem.ChildExists("end_date_plan") && xTopObjectDoc.TopElem.end_date_plan.HasValue) {
                    itemObjectiveLev1.date_plan.value = StrXmlDate(xTopObjectDoc.TopElem.end_date_plan.Value);
                }
            }

            itemObjectiveLev1.wfparameters = {
                "objective" : getWFParamTemplate(sTypeObjectiveL1, {
                    "sCompetenceViewType": sCompetenceViewType,
                    "bCompetencesAllowChange": bCompetencesAllowChange,
                    "bShowDescInSection": bShowDescInSection,
                    "sDescSectionName": sDescSectionName,
                    "sDescNewDev": sDescNewDev
                })
            };

            itemObjectiveLev1.wfparameters.dialog_buttons = (curEditable) ? getCopyObjectByValue(oEditButtons) : getCopyObjectByValue(oViewButtons);

            if ( bEnableWeight != true ) {
                itemObjectiveLev1.wfparameters.SetProperty( "sum_weight", { show: "none" } );
            }

            itemObjectiveLev1.wfparameters.objective.instruction.label = ("<center><b>" + textSelected + "</b></center>");

            itemObjectiveLev1.wfparameters.objective.richtext.label =  itemObjectiveLev1.desc.value;

            itemObjectiveLev1.class = itemObjectiveLev1.GetOptProperty("class","") + " wt-" + sTypeObjectiveL1;

            switch(sTypeObjectiveL1) {
                case "competence":
                    itemObjectiveLev1.wfparameters.objective.competence_id.editable = false;
                    itemObjectiveLev1.wfparameters.objective.competence_id.visible = false;
                    itemObjectiveLev1.wfparameters.objective.is_select.editable = curEditable && !bCompetenceNumOverLimit;

// ***************************** добавление доп вопросов *****************************
                    arrSupplementaryQuestionsObject = getSupplementaryQuestionsObjectConfig(itemObjectiveLev1.competence_id.value);
                    iFieldCount = 0;

                    if ( ArrayCount( arrSupplementaryQuestionsObject ) > 0 ) {
                        itemObjectiveLev1.wfparameters.objective.SetProperty( "divider", "" );
                    }

                    for(itemDevMethodScales in arrSupplementaryQuestionsObject) {
                        iFieldCount++;
                        itemObjectiveLev1.wfparameters.objective.SetProperty(itemDevMethodScales.object_code, getWFParamTemplate("fieldSupplementaryQuestions"));
                        _setFW = itemObjectiveLev1.wfparameters.objective.GetOptProperty(itemDevMethodScales.object_code);
                        _setFW.label = itemDevMethodScales.object_title;
                        _sQType = itemDevMethodScales.GetOptProperty("object_type", "1");
                        _setFW.control_type = (_sQType == "2" ? "select" : (_sQType == "3" ? "checkbox" : "textarea"));

                        if (tools_web.is_true(itemDevMethodScales.GetOptProperty("is_view", "0"))) {
                            _setFW.visible_in = "form;view";
                        }

                        if (tools_web.is_true(itemDevMethodScales.GetOptProperty("is_required", "0"))) {
                            _setFW.required = true;
                        }

                        if ( itemDevMethodScales.GetOptProperty("object_entries", "") != "" ) {
                            _setFW.scale = {"value": ParseJson(itemDevMethodScales.GetOptProperty("object_entries", []))};

                            if ( _setFW.control_type == "select") {
                                _setFW.placeholder = "---";
                            }
                        }
                    }
                    // ***************************** добавление доп вопросов *****************************

                    itemObjectiveLev1.editable = curEditable && ( ( bCompetencesAllowChange && sCompetenceViewType == 'check') || ( iFieldCount > 0 ) )  ;

                    break;

                case "development_method":
                    itemObjectiveLev1.wfparameters.objective.development_method_id.editable = false;
                    itemObjectiveLev1.wfparameters.objective.development_method_id.visible = false;

                    // ***************************** добавление доп вопросов *****************************
                    arrSupplementaryQuestionsObject = getSupplementaryQuestionsObjectConfig(itemObjectiveLev1.development_method_id.value);
                    iFieldCount = 0;
                    if ( ArrayCount( arrSupplementaryQuestionsObject ) > 0 ) {
                        itemObjectiveLev1.wfparameters.objective.SetProperty( "divider", "" );
                    }

                    for(itemDevMethodScales in arrSupplementaryQuestionsObject) {
                        iFieldCount++;
                        itemObjectiveLev1.wfparameters.objective.SetProperty(itemDevMethodScales.object_code, getWFParamTemplate("fieldSupplementaryQuestions"));
                        _setFW = itemObjectiveLev1.wfparameters.objective.GetOptProperty(itemDevMethodScales.object_code);
                        _setFW.label = itemDevMethodScales.object_title;
                        _sQType = itemDevMethodScales.GetOptProperty("object_type", "1");
                        _setFW.control_type = (_sQType == "2" ? "select" : (_sQType == "3" ? "checkbox" : "textarea"));

                        if (tools_web.is_true(itemDevMethodScales.GetOptProperty("is_view", "0"))) {
                            _setFW.visible_in = "form;view";
                        }

                        if (tools_web.is_true(itemDevMethodScales.GetOptProperty("is_required", "0"))) {
                            _setFW.required = true;
                        }

                        if ( itemDevMethodScales.GetOptProperty("object_entries", "") != "" ) {
                            _setFW.scale = {"value": ParseJson(itemDevMethodScales.GetOptProperty("object_entries", []))};

                            if ( _setFW.control_type == "select") {
                                _setFW.placeholder = "---";
                            }
                        }
                    }
                    // ***************************** добавление доп вопросов *****************************

                    itemObjectiveLev1.editable = curEditable && iFieldCount > 0  ;

                    break;
            }

            itemObjectiveLev1.can_add_child = bCompetenceIsSelected && bCompetencesAllowChange;
            itemObjectiveLev1.can_delete = (sCompetenceViewType == 'select') && (!itemObjectiveLev1.HasProperty("block_delete") || !tools_web.is_true(itemObjectiveLev1.block_delete.value));
            itemObjectiveLev1.name.editable = false;
            itemObjectiveLev1.class += " objective-no-weight";

            itemObjectiveLev1.wfparameters.objective.objective = getWFParamTemplate(
                sTypeObjectiveL2,
                {
                    "sCompetenceViewType": sCompetenceViewType,
                    "bCompetencesAllowChange": bCompetencesAllowChange,
                    "bShowDescInSection": bShowDescInSection,
                    "sDescSectionName": sDescSectionName,
                    "sDescNewDev": sDescNewDev
                }
            );

            itemCurTask = ArrayOptFind(arrCurPATasks, "This.id==" + OptInt(itemObjectiveLev1.id,0));

            if (itemCurTask != undefined) {
                sCurTaskObjectCatalog = itemCurTask.target_object_type;
                sCurTaskObjectCatalogTitle = (sCurTaskObjectCatalog == "" || sCurTaskObjectCatalog.OptForeignElem == undefined) ? "" : sCurTaskObjectCatalog.OptForeignElem.title.Value;

                if (sCurTaskObjectCatalog != "" && sCurTaskObjectCatalogTitle != "" && sPAViewType != "table") {
                    itemObjectiveLev1.name.value = sCurTaskObjectCatalogTitle + ": " + itemObjectiveLev1.name.value;
                }
            }

            itemCurDevMethod = ArrayOptFind(arrDevelopmentMethodScales, "This.object_id==" + iCurTopObjectID);

            if (itemCurDevMethod != undefined && ArrayCount(itemCurDevMethod.scale) > 0) {
                bAddDevelopmentMethods = ( bAddAllDevelopmentMethods || bAutoAddOneDM && ArrayOptSize(itemCurDevMethod.scale) == 1 )

                if (!bAddDevelopmentMethods) {
                    if (sTypeObjectiveL1 == "competence") {
                        if ( itemObjectiveLev1.HasProperty("objectives") ) {
                            arrDevMethodsSelected = ArraySelect(itemObjectiveLev1.objectives, "This.HasProperty('development_method_id') && This.development_method_id.value != ''");
                            arrDevMethods = ArraySelectDistinct( ArrayExtract(itemCurDevMethod.scale,"({'id': String(This.id),'name':This.name})"), "This.id");
                            arrDevMethodsCanSelect = [];

                            for( oDevMethod in arrDevMethods ) {
                                if( ArrayOptFind( arrDevMethodsSelected, 'This.development_method_id.value == oDevMethod.id' ) == undefined ) {
                                    arrDevMethodsCanSelect.push( oDevMethod );
                                }
                            }
                        } else {
                            arrDevMethodsCanSelect = ArraySelectDistinct( ArrayExtract(itemCurDevMethod.scale,"({'id': String(This.id),'name':This.name})"), "This.id");
                        }

                        objData.dataset.SetProperty(iCurTopObjectID + "_development_method", arrDevMethodsCanSelect);
                        itemObjectiveLev1.wfparameters.objective.objective.development_method_id.data_src = iCurTopObjectID + "_development_method";
                    }
                    itemObjectiveLev1.wfparameters.objective.buttons = [{"action": "add", "title": i18n.t( 'dobavitsposobr' ), "visible": true}];
                } else {
                    if(bCompetenceIsSelected) {
                        for(itemScale in itemCurDevMethod.scale) {
                            newObjectives = getNewObjectives(itemObjectiveLev1, itemScale, itemCurDevMethod.type, docPA)

                            if ( newObjectives != null ) {
                                if(!itemObjectiveLev1.HasProperty("objectives")) {
                                    itemObjectiveLev1.objectives = [];
                                }

                                //newObjectives.editable = false;
                                itemObjectiveLev1.objectives.push(newObjectives);
                            }
                        }
                        itemObjectiveLev1.wfparameters.objective.buttons = null;
                        itemObjectiveLev1.can_add_child = false;
                    }
                }
            } else {
                if (bHasDevelopmentAction) {
                    itemObjectiveLev1.wfparameters.objective.buttons = [{"action": "add", "title": i18n.t( 'dobavitrazviva' )}];
                    itemObjectiveLev1.wfparameters.view_type_level = String(0);
                    itemObjectiveLev1.can_add_child = true;
                    itemObjectiveLev1.wfparameters.objective.objective.can_delete = true;
                    arrDevMethodScales = getDevelopmentMethodChildScales(xTopObjectDoc.TopElem, null, false, null, bUseKnowledge, bFlagCourseFromProgram);
                    arrExistsChildIDs = [];

                    if(itemObjectiveLev1.HasProperty("objectives") && ArrayCount(itemObjectiveLev1.objectives) > 0) {
                        sExistsChildIDs = ArrayMerge(itemObjectiveLev1.objectives, "This.development_task_id.value", ",")
                    } else {
                        sExistsChildIDs = "";
                    }

                    if(ArrayCount(arrDevMethodScales) > 0 && sDevelopmentTaskSelect=="single") {
                        _newFW = getCopyObjectByValue(itemObjectiveLev1.wfparameters.objective.objective);
                        itemObjectiveLev1.wfparameters.objective.objective = [];
                        _scale = ArrayExtract(arrDevMethodScales,"({'id': This.task_title, 'name': This.task_title})");
                        _defType = "";

                        for(itemDevMethodScales in arrDevMethodScales) {
                            if (_defType == "") {
                                _defType = itemDevMethodScales.task_title;
                            }

                            _setFW = {}; //getCopyObjectByValue(_newFW);
                            _setFW.SetProperty("task_type", getWFParamTemplate("fieldradiomultiple"));
                            _setFW.task_type.scale.value = _scale;
                            //_setFW.task_type.control_type = "radio";
                            //_setFW.task_type.layout = "col";
                            _setFW.task_type.SetProperty("default", _defType);
                            _setFW.task_type.SetProperty("key_value",itemDevMethodScales.task_title);
                            _setFW.task_type.placeholder = null;
                            _setFW.task_type.visible = ArrayCount(arrDevMethodScales)>1;
                            arrCurScale = ArraySelect(itemDevMethodScales.scale, "!StrContains(sExistsChildIDs, String(This.id))");

                            if(tools_web.is_true(itemDevMethodScales.is_by_category)) {
                                _setFW.SetProperty(itemDevMethodScales.task_type + "_catalog", getWFParamTemplate("set_category_field"));
                                _setFW[itemDevMethodScales.task_type + "_catalog"].data_src = itemDevMethodScales.task_type + "_catalog";
                                _setFW[itemDevMethodScales.task_type + "_catalog"].label = i18n.t( 'kategoriyadlya' ) + itemDevMethodScales.task_title;
                                _setFW[itemDevMethodScales.task_type + "_catalog"].depend_datasets = [{name: (iCurTopObjectID + "_" + itemDevMethodScales.task_type), collection: (curAppl.code + "_getdataset")}];

                                if (!bSplitCategorys) {
                                    _setFW[itemDevMethodScales.task_type + "_catalog"].depend_datasets.push({name: (itemDevMethodScales.task_type + "_catalog2"), collection: (curAppl.code + "_getdataset")});
                                    _setFW.SetProperty(itemDevMethodScales.task_type + "_catalog2", getWFParamTemplate("set_category_field"));
                                    _setFW[itemDevMethodScales.task_type + "_catalog2"].data_src = itemDevMethodScales.task_type + "_catalog2";
                                    _setFW[itemDevMethodScales.task_type + "_catalog2"].label = i18n.t( 'podkategoriyadl' ) + itemDevMethodScales.task_title;
                                    _setFW[itemDevMethodScales.task_type + "_catalog2"].depend_datasets = [{name: (iCurTopObjectID + "_" + itemDevMethodScales.task_type), collection: (curAppl.code + "_getdataset")}];
                                    _setFW[itemDevMethodScales.task_type + "_catalog2"].visible = true;
                                }
                                else if (_setFW.HasProperty(itemDevMethodScales.task_type + "_catalog2")) {
                                    _setFW[itemDevMethodScales.task_type + "_catalog2"].visible = false;
                                }
                            }

                            _setFW.SetProperty(itemDevMethodScales.task_type + "_id", getWFParamTemplate("field4multiple"));
                            _setFW = addRequiredFields(_setFW, getWFParamTemplate("notasktype"));
                            _setFW[itemDevMethodScales.task_type + "_id"].label = itemDevMethodScales.task_title;
                            objData.dataset.SetProperty(iCurTopObjectID + "_" + itemDevMethodScales.task_type, arrCurScale);
                            _setFW[itemDevMethodScales.task_type + "_id"].data_src = iCurTopObjectID + "_" + itemDevMethodScales.task_type;
                            _setFW = appendCopyObjectByValue(_newFW, _setFW);
                            _setFW = addRequiredFields(_setFW, getWFParamTemplate("required"));

                            if (_setFW.HasProperty("development_task_id")) {
                                _setFW.development_task_id.visible = false;
                            }

                            if ( itemDevMethodScales.task_type == "education_method" ) {
                                if ( bHasOther ) {
                                    _setFW = addRequiredFields(_setFW, getWFParamTemplate("set_other_checkbox", {"sHasOtherScale": sHasOtherScale}));
                                    _setFW.set_other_checkbox.SetProperty("key_value","other");
                                    _setFW.set_other_checkbox.key_value = "true";
                                    _setFW.set_other_text.visible = true;
                                    _setFW.set_other_plan.visible = true;
                                    _setFW.set_other_text.required = true;
                                    _setFW.set_other_plan.required = true;

                                    // if (sHasOtherScale!="" && false)
                                    // {
                                    // 	ArrayOptFirstElem(_setFW.set_other_checkbox.scale.value).value = sHasOtherTitle;
                                    // }

                                    if (sHasOtherName!="") {
                                        _setFW.set_other_text.label = sHasOtherName;
                                    }

                                    if (sHasOtherTitle!="") {
                                        _setFW.richtext = {label: sHasOtherTitle, visible: true, visible_in:"form" }
                                    }

                                    _newSetWF = {};

                                    for (_tmpP in _setFW) {
                                        if (_tmpP == "richtext")
                                            continue;

                                        if (_tmpP == "set_other_checkbox")
                                            _newSetWF.SetProperty("richtext", getCopyObjectByValue(_setFW.GetOptProperty("richtext")));
                                        _newSetWF.SetProperty(_tmpP, getCopyObjectByValue(_setFW.GetOptProperty(_tmpP)));
                                    }

                                    _newSetWF.set_other_checkbox.key_value = "";
                                    _newSetWF.set_other_text.visible = false;
                                    _newSetWF.set_other_plan.visible = false;
                                    itemObjectiveLev1.wfparameters.objective.objective.push(_newSetWF);

                                    if (_setFW.HasProperty(itemDevMethodScales.task_type + "_catalog"))
                                    {
                                        _setFW.GetProperty(itemDevMethodScales.task_type + "_catalog").visible = false;
                                    }

                                    if (_setFW.HasProperty(itemDevMethodScales.task_type + "_catalog2"))
                                    {
                                        _setFW.GetProperty(itemDevMethodScales.task_type + "_catalog2").visible = false;
                                    }

                                    if (_setFW.HasProperty(itemDevMethodScales.task_type + "_id"))
                                    {
                                        _setFW.GetProperty(itemDevMethodScales.task_type + "_id").visible = false;
                                    }

                                    if (_setFW.HasProperty("plan"))
                                    {
                                        _setFW.GetProperty("plan").visible = false;
                                    }

                                    if (sHasOtherDesc!="")
                                    {
                                        _setFW.richtext = {label: sHasOtherDesc, visible: true, visible_in:"form" }
                                    }

                                    _dws = {};
                                    _prd = null;
                                    _prd1 = null;

                                    for (_drw in _setFW)
                                    {
                                        if (_drw=="date_plan" && _prd==null)
                                        {
                                            _prd = getCopyObjectByValue(_setFW.GetProperty(_drw));
                                            continue;
                                        }

                                        if (_drw=="richtext" && _prd1==null)
                                        {
                                            _prd1 = getCopyObjectByValue(_setFW.GetProperty(_drw));
                                            continue;
                                        }

                                        if (_drw=="set_other_checkbox" && _prd1!=null)
                                        {
                                            _dws.SetProperty("richtext", _prd1);
                                        }

                                        _dws.SetProperty(_drw, _setFW.GetProperty(_drw));
                                    }

                                    _dws.SetProperty("date_plan", _prd);
                                    _setFW = getCopyObjectByValue(_dws);
                                }
                            }
                            itemObjectiveLev1.wfparameters.objective.objective.push(_setFW);
                        }
// end AF
                    }
                    else if(ArrayCount(arrDevMethodScales) > 0)
                    {
                        itemObjectiveLev1.wfparameters.objective.objective = getWFParamTemplate("multiple");
                        _category_is_first = "";
                        for(itemDevMethodScales in arrDevMethodScales)
                        {
                            arrCurScale = ArraySelect(itemDevMethodScales.scale, "!StrContains(sExistsChildIDs, String(This.id))");
                            if(tools_web.is_true(itemDevMethodScales.is_by_category))
                            {
                                if ((!bCommonCategorys || _category_is_first==""))
                                {
                                    itemObjectiveLev1.wfparameters.objective.objective.SetProperty(itemDevMethodScales.task_type + "_catalog", getWFParamTemplate("set_category_field"));
                                    itemObjectiveLev1.wfparameters.objective.objective[itemDevMethodScales.task_type + "_catalog"].data_src = itemDevMethodScales.task_type + "_catalog";
                                    itemObjectiveLev1.wfparameters.objective.objective[itemDevMethodScales.task_type + "_catalog"].label = i18n.t( 'kategoriyadlya' ) + itemDevMethodScales.task_title;
                                    itemObjectiveLev1.wfparameters.objective.objective[itemDevMethodScales.task_type + "_catalog"].depend_datasets = [{name: (iCurTopObjectID + "_" + itemDevMethodScales.task_type), collection: (curAppl.code + "_getdataset")}];
                                    if (_category_is_first=="")
                                    {
                                        _category_is_first = itemDevMethodScales.task_type + "_catalog";
                                    }
                                    if (!bSplitCategorys)
                                    {
                                        itemObjectiveLev1.wfparameters.objective.objective[itemDevMethodScales.task_type + "_catalog"].depend_datasets.push({name: (itemDevMethodScales.task_type + "_catalog2"), collection: (curAppl.code + "_getdataset")});
                                        itemObjectiveLev1.wfparameters.objective.objective.SetProperty(itemDevMethodScales.task_type + "_catalog2", getWFParamTemplate("set_category_field"));
                                        itemObjectiveLev1.wfparameters.objective.objective[itemDevMethodScales.task_type + "_catalog2"].data_src = itemDevMethodScales.task_type + "_catalog2";
                                        itemObjectiveLev1.wfparameters.objective.objective[itemDevMethodScales.task_type + "_catalog2"].label = i18n.t( 'podkategoriyadl' ) + itemDevMethodScales.task_title;
                                        itemObjectiveLev1.wfparameters.objective.objective[itemDevMethodScales.task_type + "_catalog2"].depend_datasets = [{name: (iCurTopObjectID + "_" + itemDevMethodScales.task_type), collection: (curAppl.code + "_getdataset")}];
                                        itemObjectiveLev1.wfparameters.objective.objective[itemDevMethodScales.task_type + "_catalog2"].visible = true;
                                    }
                                    else if (itemObjectiveLev1.wfparameters.objective.objective.HasProperty(itemDevMethodScales.task_type + "_catalog2"))
                                    {
                                        itemObjectiveLev1.wfparameters.objective.objective[itemDevMethodScales.task_type + "_catalog2"].visible = false;
                                    }
                                }
                                else if (bCommonCategorys)
                                {
                                    itemObjectiveLev1.wfparameters.objective.objective[_category_is_first].depend_datasets.push({name: (iCurTopObjectID + "_" + itemDevMethodScales.task_type), collection: (curAppl.code + "_getdataset")});
                                    if (itemObjectiveLev1.wfparameters.objective.objective.HasProperty(_category_is_first + "2"))
                                    {
                                        itemObjectiveLev1.wfparameters.objective.objective[_category_is_first + "2"].depend_datasets.push({name: (iCurTopObjectID + "_" + itemDevMethodScales.task_type), collection: (curAppl.code + "_getdataset")});
                                    }
                                }
                            }
                            itemObjectiveLev1.wfparameters.objective.objective.SetProperty(itemDevMethodScales.task_type + "_id", getWFParamTemplate("field4multiple"));
                            itemObjectiveLev1.wfparameters.objective.objective[itemDevMethodScales.task_type + "_id"].label = itemDevMethodScales.task_title;

                            //itemObjectiveLev1.wfparameters.objective.objective[itemDevMethodScales.task_type + "_id"].scale.value = arrCurScale;
                            objData.dataset.SetProperty(iCurTopObjectID + "_" + itemDevMethodScales.task_type, arrCurScale);
                            itemObjectiveLev1.wfparameters.objective.objective[itemDevMethodScales.task_type + "_id"].data_src = iCurTopObjectID + "_" + itemDevMethodScales.task_type;

                            if ( bSeparatePlan )
                            {
                                itemObjectiveLev1.wfparameters.objective.objective = addRequiredFields(itemObjectiveLev1.wfparameters.objective.objective, getWFParamTemplate("required", {sId: itemDevMethodScales.task_type}));
                                itemObjectiveLev1.wfparameters.objective.objective.GetOptProperty( "plan_" + itemDevMethodScales.task_type, ({}) ).label = i18n.t( 'obosnovanievyb' );
                                itemObjectiveLev1.wfparameters.objective.objective.GetOptProperty( "plan_" + itemDevMethodScales.task_type, ({}) ).required = false;
                            }
                        }

                        if ( bHasOther )
                        {
                            itemObjectiveLev1.wfparameters.objective.objective = addRequiredFields(itemObjectiveLev1.wfparameters.objective.objective, getWFParamTemplate("set_other_checkbox", {"sHasOtherScale": sHasOtherScale}));
                            itemObjectiveLev1.wfparameters.objective.objective.set_other_checkbox.SetProperty("key_value","other");
                        }

                        itemObjectiveLev1.wfparameters.objective.objective = addRequiredFields(itemObjectiveLev1.wfparameters.objective.objective, getWFParamTemplate("required"));

                        if( bFlagCancel && !bNoCancelObject )
                            itemObjectiveLev1.wfparameters.objective.objective = addRequiredFields(itemObjectiveLev1.wfparameters.objective.objective, getWFParamTemplate("task_flag_cancel", {curState: curState, sCancelState: sCancelState}));

                        if ( !bSeparatePlan )
                        {
                            itemObjectiveLev1.wfparameters.objective.objective.plan.label = i18n.t( 'obosnovanievyb' );
                            itemObjectiveLev1.wfparameters.objective.objective.plan.visible_in = "view;form";
                        }
                        else
                        {
                            itemObjectiveLev1.wfparameters.objective.objective.plan.label = i18n.t( 'obosnovanievyb' );
                            itemObjectiveLev1.wfparameters.objective.objective.plan.visible_in = "view";
                        }

                        if ( bHasOther )
                        {
                            _vTmp = [];
                            _vTmp.push( getCopyObjectByValue(itemObjectiveLev1.wfparameters.objective.objective) );
                            _vTmp.push( getCopyObjectByValue(itemObjectiveLev1.wfparameters.objective.objective) );
                            itemObjectiveLev1.wfparameters.objective.objective = _vTmp;
                            itemObjectiveLev1.wfparameters.objective.objective[0].set_other_checkbox.key_value = "";
                            itemObjectiveLev1.wfparameters.objective.objective[0].set_other_text.visible = false;
                            itemObjectiveLev1.wfparameters.objective.objective[0].set_other_plan.visible = false;
                            itemObjectiveLev1.wfparameters.objective.objective[1].set_other_checkbox.key_value = "true";
                            itemObjectiveLev1.wfparameters.objective.objective[1].set_other_text.visible = true;
                            itemObjectiveLev1.wfparameters.objective.objective[1].set_other_plan.visible = bSeparatePlan;
                        }
                    }
                }
                else
                {
                    itemObjectiveLev1.wfparameters.objective.buttons = null;
                    itemObjectiveLev1.can_add_child = false;
                    if( bVisibleStatus )
                    {
                        fAddStatusMark(itemObjectiveLev1,sCurTaskObjectCatalog,null,null);
                        if( curEditable && itemObjectiveLev1.wfparameters.objective.HasProperty("status_mark") && tools_web.is_true(itemObjectiveLev1.wfparameters.objective.status_mark.GetOptProperty("editable")) )
                        {
                            itemObjectiveLev1.editable = true;
                        }
                    }
                    else if( itemObjectiveLev1.wfparameters.objective.HasProperty("status_mark") )
                    {
                        itemObjectiveLev1.wfparameters.objective.GetProperty("status_mark").visible = false;
                        if( itemObjectiveLev1.wfparameters.objective.HasProperty("date_fact") )
                        {
                            itemObjectiveLev1.wfparameters.objective.GetProperty("date_fact").visible = false;
                        }
                    }
                    if( bFlagCancel && !bNoCancelObject )
                    {
                        itemObjectiveLev1.wfparameters.objective = addRequiredFields(itemObjectiveLev1.wfparameters.objective, getWFParamTemplate("task_flag_cancel", {curState: curState, sCancelState: sCancelState}));
                    }
                }
            }


            if (itemObjectiveLev1.HasProperty("objectives"))
            {
                itemObjectiveLev1.can_delete = bAddDevelopmentMethods && bCompetenceIsSelected && (!itemObjectiveLev1.HasProperty("block_delete") || !tools_web.is_true(itemObjectiveLev1.block_delete.value));
                // itemObjectiveLev1.editable = false ;
                // коррекция интерфейса компетенции
                if(sTypeObjectiveL1 == "competence")
                    itemObjectiveLev1.wfparameters.objective.is_select.editable = false;

                for (itemObjectiveLev2 in itemObjectiveLev1.objectives)
                {
                    toLog("Lev1 : " + itemObjectiveLev1.name.value + " ---> Lev2 : " + itemObjectiveLev2.name.value, LogName, false);

                    itemObjectiveLev2.wfparameters = {
                        "objective" : getWFParamTemplate(
                            sTypeObjectiveL2,
                            {
                                "sCompetenceViewType": sCompetenceViewType,
                                "bCompetencesAllowChange": bCompetencesAllowChange,
                                "bShowDescInSection": bShowDescInSection,
                                "sDescSectionName": sDescSectionName,
                                "sDescNewDev": sDescNewDev
                            }
                        )
                    };
                    itemObjectiveLev2.wfparameters.dialog_buttons = (curEditable) ? getCopyObjectByValue(oEditButtons) : getCopyObjectByValue(oViewButtons);

                    if ( bEnableWeight != true )
                    {
                        itemObjectiveLev2.wfparameters.SetProperty( "sum_weight", { show: "none" } );
                    }

                    itemObjectiveLev2.wfparameters.objective.instruction.label = ("<center><b>" + itemObjectiveLev2.name.value + "</b></center>");
                    itemObjectiveLev2.wfparameters.objective.richtext.label = itemObjectiveLev2.desc.value;
                    itemObjectiveLev2.wfparameters.objective.name.editable = false;

                    itemObjectiveLev2.editable = curEditable && !bAddDevelopmentMethods && (bTaskPhase1AllowChange || bTaskPhase2AllowChange);
                    itemObjectiveLev2.can_delete = !bAddDevelopmentMethods && (!itemObjectiveLev2.HasProperty("block_delete") || !tools_web.is_true(itemObjectiveLev2.block_delete.value)) //bTaskPhase1AllowChange;
                    itemObjectiveLev2.class = itemObjectiveLev2.GetOptProperty("class","") + " wt-" + sTypeObjectiveL2;

                    if( bNoDevelopmentTask )
                    {
                        itemObjectiveLev2.wfparameters.objective.buttons = null
                        itemObjectiveLev2.can_add_child = false;
                    }
                    else
                    {
                        itemObjectiveLev2.wfparameters.objective.buttons = [{"action": "add", "title": i18n.t( 'dobavitrazviva' ), "visible": true}];
                        itemObjectiveLev2.can_add_child = true;
                    }

                    // перезапись start_date_plan и end_date_plan из карточки задачи
                    itemTaskDoc = tools.open_doc(itemObjectiveLev2.id);
                    bNoCancelObject2 = false;
                    bHasSuppQ = false;
                    if(itemTaskDoc != undefined)
                    {
                        itemTaskTE = itemTaskDoc.TopElem;
                        if(itemObjectiveLev2.HasProperty("start_date_plan"))
                            itemObjectiveLev2.start_date_plan.value = itemTaskTE.start_date_plan.Value;
                        if(itemObjectiveLev2.HasProperty("end_date_plan"))
                            itemObjectiveLev2.end_date_plan.value = itemTaskTE.end_date_plan.Value;

                        if (itemObjectiveLev2.HasProperty("date_plan") && itemTaskTE.ChildExists("end_date_plan") && itemTaskTE.end_date_plan.HasValue)
                        {
                            itemObjectiveLev2.date_plan.value = StrXmlDate(itemTaskTE.end_date_plan.Value);
                        }

                        if (itemTaskTE.desc.HasValue)
                        {
                            itemObjectiveLev2.desc.value = itemTaskTE.desc.Value;
                        }
                        else
                        {
                            _oTargetObjDoc = tools.open_doc(itemTaskTE.target_object_id);
                            if (_oTargetObjDoc!=undefined)
                            {
                                if (_oTargetObjDoc.TopElem.ChildExists("desc") && _oTargetObjDoc.TopElem.desc.HasValue)
                                {
                                    itemObjectiveLev2.desc.value = _oTargetObjDoc.TopElem.desc.Value;
                                }
                                else if (_oTargetObjDoc.TopElem.ChildExists("comment") && _oTargetObjDoc.TopElem.comment.HasValue)
                                {
                                    itemObjectiveLev2.desc.value = _oTargetObjDoc.TopElem.comment.Value;
                                }
                            }
                        }
                        itemObjectiveLev2.wfparameters.objective.richtext.label = itemObjectiveLev2.desc.value;

                        bNoCancelObject2 = tools_web.is_true(itemTaskDoc.TopElem.custom_elems.ObtainChildByKey("not_cancel_tasks").value);

                        // ***************************** добавление доп вопросов *****************************
                        //arrSupplementaryQuestionsScales = getSupplementaryQuestionsChildScales(itemTaskTE, xTopObjectDoc, bHasCompetenceInCurProfile, itemCurCompetenceInProfileXml);
                        arrSupplementaryQuestionsObject = getSupplementaryQuestionsObjectConfig(itemTaskTE, xTopObjectDoc, bHasCompetenceInCurProfile, itemCurCompetenceInProfileXml);
                        iFieldCount = 0;

                        if (ArrayCount(arrSupplementaryQuestionsObject) > 0 ) {
                            for(itemDevMethodScales in arrSupplementaryQuestionsObject) {
                                iFieldCount++;
                                bHasSuppQ = true;
                                itemObjectiveLev2.wfparameters.objective.SetProperty(itemDevMethodScales.object_code, getWFParamTemplate("fieldSupplementaryQuestions"));
                                _setFW = itemObjectiveLev2.wfparameters.objective.GetOptProperty(itemDevMethodScales.object_code);
                                _setFW.label = itemDevMethodScales.object_title;
                                _sQType = itemDevMethodScales.GetOptProperty("object_type", "1");
                                _setFW.control_type = (_sQType == "2" ? "select" : (_sQType == "3" ? "checkbox" : "textarea"));

                                if (tools_web.is_true(itemDevMethodScales.GetOptProperty("is_view", "0"))) {
                                    _setFW.visible_in = "form;view";
                                }

                                if (tools_web.is_true(itemDevMethodScales.GetOptProperty("is_required", "0"))) {
                                    _setFW.required = true;
                                }

                                if ( itemDevMethodScales.GetOptProperty("object_entries", "") != "" ) {
                                    _setFW.scale = {"value": ParseJson(itemDevMethodScales.GetOptProperty("object_entries", []))};

                                    if ( _setFW.control_type == "select") {
                                        _setFW.placeholder = "---";
                                    }
                                }
                            }

                            if( curEditable && iFieldCount > 0 ) {
                                itemObjectiveLev2.editable = true;
                            }
                            // ***************************** добавление доп вопросов *****************************
                        }
                    }

                    switch(sTypeObjectiveL2) {
                        case "development_method":
                            itemObjectiveLev2.wfparameters.objective.development_method_id.editable = false;
                            itemObjectiveLev2.wfparameters.objective.development_method_id.visible = false;
                            break;
                        case "development_task":
                            itemObjectiveLev2.wfparameters.objective.development_task_id.editable = false;
                            itemObjectiveLev2.wfparameters.objective.development_task_id.visible = false;
                            itemObjectiveLev2.wfparameters.objective.name.editable = false;
                            itemObjectiveLev2.wfparameters.objective.name.visible = true;
                            itemObjectiveLev2.wfparameters.objective.name.visible_in = "title;form";
                            itemObjectiveLev2.can_delete =  (!itemObjectiveLev2.HasProperty("block_delete") || !tools_web.is_true(itemObjectiveLev2.block_delete.value));
                            itemObjectiveLev2.editable = curEditable && true;
                            itemObjectiveLev2.wfparameters.objective = addRequiredFields(itemObjectiveLev2.wfparameters.objective, getWFParamTemplate("required"))
                            itemObjectiveLev2.wfparameters.objective.plan.label = i18n.t( 'obosnovanievyb' )
                            if(!itemObjectiveLev2.wfparameters.objective.HasProperty("task_type"))
                            {
                                itemObjectiveLev2.wfparameters.objective.task_type = {"label": i18n.t( 'tip' ), "visible": true, "visible_in": "view", "editable": false, "required": false, "control_type": "text"};
                            }

                            if( bFlagCancel && !bNoCancelObject && !bNoCancelObject2)
                                itemObjectiveLev2.wfparameters.objective = addRequiredFields(itemObjectiveLev2.wfparameters.objective, getWFParamTemplate("task_flag_cancel", {curState: curState, sCancelState: sCancelState}));
                            break;
                    }

                    itemObjectiveLev2.wfparameters.objective.objective = addRequiredFields(getWFParamTemplate(sTypeObjectiveL3, {"sCompetenceViewType": sCompetenceViewType, "bCompetencesAllowChange": bCompetencesAllowChange, "bShowDescInSection": bShowDescInSection, "sDescSectionName": sDescSectionName, "sDescNewDev": sDescNewDev}), getWFParamTemplate("required"));


                    itemCurTask = ArrayOptFind(arrCurPATasks, "This.id==" + OptInt(itemObjectiveLev2.id,0));
                    if (itemCurTask != undefined)
                    {
                        sCurTaskObjectCatalog = itemCurTask.target_object_type;
                        if(sCurTaskObjectCatalog=="" || sCurTaskObjectCatalog.OptForeignElem == undefined )
                        {
                            sCurTaskObjectCatalogTitle = "";
                            sCurTaskObjectCatalogWebTemplate = "";
                        }
                        else
                        {
                            sCurTaskObjectCatalogWebTemplate = sCurTaskObjectCatalog.OptForeignElem.web_template.Value;

                            oCurDevelopmentMethodConfig = getTaskTypeConfig(itemCurTask);
                            sCurTaskObjectCatalogTitle = oCurDevelopmentMethodConfig == null ? sCurTaskObjectCatalog.OptForeignElem.title.Value : oCurDevelopmentMethodConfig.object_title;
                        }
                        if (sCurTaskObjectCatalogTitle!="")
                        {
                            itemObjectiveLev2.wfparameters.objective.name.label = sCurTaskObjectCatalogTitle;
                            //if(ArrayCount(arrDevMethodScales) == 1)
                            //	itemObjectiveLev1.wfparameters.objective.objective.name.label = sCurTaskObjectCatalogTitle;
                            if (sPAViewType!="table")
                            {
                                itemObjectiveLev2.name.value = sCurTaskObjectCatalogTitle+": "+itemObjectiveLev2.name.value;
                            }
                            else if(sCurTaskObjectCatalogWebTemplate != "")
                            {
                                if(itemObjectiveLev2.HasProperty("url"))
                                {
                                    itemObjectiveLev2.url.link_text = itemObjectiveLev2.name.value;
                                    itemObjectiveLev2.url.value = "/" + sCurTaskObjectCatalogWebTemplate + "&object_id=" + itemCurTask.target_object_id;
                                }
                                else
                                    itemObjectiveLev2.url = {"link_text":itemObjectiveLev2.name.value, "value":"/" + sCurTaskObjectCatalogWebTemplate + "&object_id=" + itemCurTask.target_object_id};

                                itemObjectiveLev2.wfparameters.objective.url.visible = true;
                                //itemObjectiveLev1.wfparameters.objective.objective.url.label = sCurTaskObjectCatalogTitle;
                                if (itemObjectiveLev1.wfparameters.objective.HasProperty("objective"))
                                {
                                    if (IsArray(itemObjectiveLev1.wfparameters.objective.objective))
                                    {
                                        for (itemL1WFParamObjective in itemObjectiveLev1.wfparameters.objective.objective)
                                        {
                                            if (itemL1WFParamObjective.HasProperty("url"))
                                                itemL1WFParamObjective.url.visible = true;
                                            itemL1WFParamObjective.name.visible = false;
                                        }
                                    }
                                    else
                                    {
                                        if (itemObjectiveLev1.wfparameters.objective.objective.HasProperty("url"))
                                            itemObjectiveLev1.wfparameters.objective.objective.url.visible = true;
                                        itemObjectiveLev1.wfparameters.objective.objective.name.visible = false;
                                    }
                                }
                            }
                            if(itemObjectiveLev2.HasProperty("task_type"))
                                itemObjectiveLev2.task_type.value = sCurTaskObjectCatalogTitle;
                            else
                                itemObjectiveLev2.task_type = {"value": sCurTaskObjectCatalogTitle, "editable": false, "visible": true};

                        }

                        if(itemObjectiveLev2.HasProperty("task_type") && itemObjectiveLev2.task_type.value=="other")
                        {
                            itemObjectiveLev2.task_type.value = i18n.t( 'drugoe' );
                            if (!itemObjectiveLev2.HasProperty("plan") || DataType(itemObjectiveLev2.plan)!="object")
                            {
                                itemObjectiveLev2.plan = {};
                            }
                            if (!itemObjectiveLev2.plan.HasProperty("value"))
                            {
                                itemObjectiveLev2.plan = {"value": ""};
                            }
                            if (itemObjectiveLev2.plan.value == "" && itemObjectiveLev2.HasProperty("set_other_plan") && itemObjectiveLev2.set_other_plan.HasProperty("value"))
                            {
                                itemObjectiveLev2.plan = {"value": itemObjectiveLev2.set_other_plan.value};
                            }
                            if ( !itemObjectiveLev2.HasProperty("url") )
                            {
                                itemObjectiveLev2.url = {};
                            }
                            itemObjectiveLev2.url.value = itemObjectiveLev2.name.value;
                            itemObjectiveLev2.wfparameters.objective.name.label = itemObjectiveLev2.task_type.value;
                        }


                        // добавление кастомных оценок
                        if( sTypeObjectiveL2 == "development_task" && bVisibleStatus )
                        {
                            fAddStatusMark(itemObjectiveLev2,sCurTaskObjectCatalog,null,itemObjectiveLev1.wfparameters.objective.objective)
                        }
                        else if( itemObjectiveLev2.wfparameters.objective.HasProperty("status_mark") )
                        {
                            itemObjectiveLev2.wfparameters.objective.GetProperty("status_mark").visible = false;
                            if( itemObjectiveLev2.wfparameters.objective.HasProperty("date_fact") )
                            {
                                itemObjectiveLev2.wfparameters.objective.GetProperty("date_fact").visible = false;
                            }
                        }
                    }

                    if (curEditable || true)
                    {
                        itemObjectiveLev2.wfparameters.objective.objective.buttons = [{"action": "add", "title": i18n.t( 'aktivnost' )}];
                        itemCurLev2ObjectDoc = tools.open_doc(OptInt(itemObjectiveLev2[sTypeObjectiveL2 + "_id"].value,0));
                        bNoCancelObject2 = false;
                        if (itemCurLev2ObjectDoc != undefined)
                        {
                            arrDevMethodScales = getDevelopmentMethodChildScales(
                                itemCurLev2ObjectDoc.TopElem,
                                xTopObjectDoc,
                                bHasCompetenceInCurProfile,
                                itemCurCompetenceInProfileXml,
                                bUseKnowledge,
                                bFlagCourseFromProgram
                            );

                            if(itemObjectiveLev2.HasProperty("objectives") && ArrayCount(itemObjectiveLev2.objectives) > 0)
                            {
                                sExistsChildIDs = ArrayMerge(ArraySelect(itemObjectiveLev2.objectives, "This.HasProperty('development_task_id')"), "This.development_task_id.value", ",")
                            }
                            else
                            {
                                sExistsChildIDs = "";
                            }
                            bNoCancelObject2 = tools_web.is_true(itemCurLev2ObjectDoc.TopElem.custom_elems.ObtainChildByKey("not_cancel_tasks").value)

                            if(ArrayCount(arrDevMethodScales) == 0)
                            {
                                if(sTypeObjectiveL3 == "development_task")
                                {
                                    itemObjectiveLev2.wfparameters.objective.objective.development_task_id.visible = false;
                                    itemObjectiveLev2.wfparameters.objective.objective.name.visible_in = "title;form";
                                    itemObjectiveLev2.wfparameters.objective.objective.name.editable = curEditable && true;
                                    itemObjectiveLev2.wfparameters.objective.objective.name.required = true;
                                }
                            }
                            else if(ArrayCount(arrDevMethodScales) == 1)
                            {
                                oDevMethodScale = ArrayOptFirstElem(arrDevMethodScales);
                                sCatTaskDst = "development_task";
                                if(oDevMethodScale.task_type == "task")
                                {
                                    arrCurScale =  oDevMethodScale.scale
                                    itemObjectiveLev2.wfparameters.objective.objective.richtext.label = ArrayMerge(ArrayIntersect(arrTaskTypes, arrCurScale, "This.id", "This.id"), "This.descr", "<p>&nbsp;</p>");
                                    if ( ArrayCount(arrCurScale) == 1 )
                                    {
                                        itemObjectiveLev2.wfparameters.objective.objective.development_task_id.visible = false;
                                        itemObjectiveLev2.wfparameters.objective.objective.name.visible_in = "title;form";
                                        itemObjectiveLev2.wfparameters.objective.objective.name.editable = curEditable && true;
                                        itemObjectiveLev2.wfparameters.objective.objective.name.required = true;
                                        itemObjectiveLev2.wfparameters.objective.objective.development_task_id.SetProperty("default", ArrayOptFirstElem(arrCurScale).id);
                                    }
                                }
                                else
                                {
                                    arrCurScale = ArraySelect(oDevMethodScale.scale, "!StrContains(sExistsChildIDs, String(This.id))");
                                    if(tools_web.is_true(oDevMethodScale.is_by_category))
                                    {
                                        _tmpFW = {};
                                        for (_tmp in itemObjectiveLev2.wfparameters.objective.objective)
                                        {
                                            if (_tmp == "development_task_catalog")
                                            {
                                                _tmpP = getCopyObjectByValue(itemObjectiveLev2.wfparameters.objective.objective.GetProperty(_tmp));
                                                _tmpP.visible = true;
                                                _tmpP.data_src = oDevMethodScale.task_type + "_catalog";
                                                _tmpP.label = i18n.t( 'kategoriyadlya' ) + oDevMethodScale.task_title;
                                                _tmpP.depend_datasets = [{name: (iCurTopObjectID + "_" + itemCurLev2ObjectDoc.DocID + "_" + oDevMethodScale.task_type), collection: (curAppl.code + "_getdataset")}];
                                                _tmpFW.SetProperty(oDevMethodScale.task_type + "_catalog", getCopyObjectByValue(_tmpP));
                                                if (OptInt(oDevMethodScale.GetOptProperty("cat_level",0),0)==2)
                                                {
                                                    _tmpP = getWFParamTemplate("set_category_field");
                                                    _tmpP.data_src = oDevMethodScale.task_type + "_catalog2";
                                                    _tmpP.label = i18n.t( 'podkategoriyadl' ) + oDevMethodScale.task_title;
                                                    _tmpP.depend_datasets = [{name: (iCurTopObjectID + "_" + itemCurLev2ObjectDoc.DocID + "_" + oDevMethodScale.task_type), collection: (curAppl.code + "_getdataset")}];
                                                    _tmpFW.SetProperty(oDevMethodScale.task_type + "_catalog2", getCopyObjectByValue(_tmpP));
                                                    _tmpFW[oDevMethodScale.task_type + "_catalog"].depend_datasets.push({name: (oDevMethodScale.task_type + "_catalog2"), collection: (curAppl.code + "_getdataset")});
                                                }
                                            }
                                            _tmpFW.SetProperty(_tmp, getCopyObjectByValue(itemObjectiveLev2.wfparameters.objective.objective.GetProperty(_tmp)));
                                        }
                                        itemObjectiveLev2.wfparameters.objective.objective = getCopyObjectByValue(_tmpFW);
                                    }
                                }
                                objData.dataset.SetProperty(iCurTopObjectID + "_" + itemCurLev2ObjectDoc.DocID + "_" + oDevMethodScale.task_type, arrCurScale);
                                itemObjectiveLev2.wfparameters.objective.objective.development_task_id.data_src = iCurTopObjectID + "_" + itemCurLev2ObjectDoc.DocID + "_" + oDevMethodScale.task_type;
                                itemObjectiveLev2.wfparameters.objective.objective.development_task_id.label = oDevMethodScale.task_title;
                                //itemObjectiveLev2.wfparameters.objective.objective.task_type.visible = false;
                                if (oDevMethodScale.GetOptProperty("in_control","select")=="list")
                                {
                                    itemObjectiveLev2.wfparameters.objective.objective.SetProperty("development_task_id", getWFParamTemplate("field4multiple"));
                                    itemObjectiveLev2.wfparameters.objective.objective["development_task_id"].label = oDevMethodScale.task_title;
                                    objData.dataset.SetProperty(iCurTopObjectID + "_" + itemCurLev2ObjectDoc.DocID + "_" + oDevMethodScale.task_type, arrCurScale);
                                    itemObjectiveLev2.wfparameters.objective.objective["development_task_id"].data_src = iCurTopObjectID + "_" + itemCurLev2ObjectDoc.DocID + "_" + oDevMethodScale.task_type;
                                    itemObjectiveLev2.wfparameters.objective.objective["development_task_id"].placeholder = null;
                                    _tmpFW = {};
                                    for (_tmp in itemObjectiveLev2.wfparameters.objective.objective)
                                    {
                                        if (_tmp == "development_task_id")
                                        {
                                            _tmpP = getCopyObjectByValue(itemObjectiveLev2.wfparameters.objective.objective.GetProperty(_tmp));
                                            _tmpFW.SetProperty(oDevMethodScale.task_type + "_id", getCopyObjectByValue(_tmpP));
                                            itemObjectiveLev2.wfparameters.objective.objective.GetProperty(_tmp).visible = false;
                                            itemObjectiveLev2.wfparameters.objective.objective.GetProperty(_tmp).required = false;
                                        }
                                        _tmpFW.SetProperty(_tmp, getCopyObjectByValue(itemObjectiveLev2.wfparameters.objective.objective.GetProperty(_tmp)));
                                    }
                                    _tmpO = _tmpFW.SetProperty("type", {label: "", visible: false, visible_in: "form", editable: false, required: false, control_type: "text", "default": "group"});
                                    itemObjectiveLev2.wfparameters.objective.objective = getCopyObjectByValue(_tmpFW);
                                }
                                if ( ( bSplitTaskBlock && ArrayCount(arrCurScale)>0 )  || ArrayCount(arrCurScale) == 1 )
                                {
                                    arrCustomFieldsObject = getCustomFieldsObjectConfig(ArrayOptFirstElem(arrCurScale).id)
                                    if( ArrayCount(arrCustomFieldsObject)>0)
                                    {
                                        _tempObjects = ParseJson(EncodeJson(itemObjectiveLev2.wfparameters.objective.objective));
                                        itemObjectiveLev2.wfparameters.objective.objective = {};
                                        if (_tempObjects.HasProperty("instruction"))
                                        {
                                            itemObjectiveLev2.wfparameters.objective.objective.instruction = _tempObjects.GetProperty("instruction")
                                        }
                                        if (_tempObjects.HasProperty("richtext"))
                                        {
                                            itemObjectiveLev2.wfparameters.objective.objective.richtext = _tempObjects.GetProperty("richtext")
                                        }
                                        for( _field in arrCustomFieldsObject)
                                        {
                                            if (_tempObjects.HasProperty(_field.code))
                                            {
                                                itemObjectiveLev2.wfparameters.objective.objective.SetProperty(_field.code ,ParseJson(EncodeJson(_tempObjects.GetProperty(_field.code))));
                                            }
                                            if( !itemObjectiveLev2.wfparameters.objective.objective.HasProperty(_field.code) )
                                                itemObjectiveLev2.wfparameters.objective.objective.SetProperty(_field.code , getWFParamTemplate("fieldSupplementaryQuestions"));

                                            _setFW = itemObjectiveLev2.wfparameters.objective.objective.GetOptProperty(_field.code);
                                            _setFW.label = (_field.GetOptProperty("name") != undefined ?_field.name:"");
                                            _setFW.control_type = _field.type;
                                            _setFW.required = (_field.GetOptProperty("required") != undefined?_field.required:"");
                                            if ( _field.GetOptProperty("entries") != undefined && Trim(_field.entries) != '' )
                                            {
                                                _setFW.scale = {"value": []};
                                                if ( _setFW.control_type == "select")
                                                {
                                                    _setFW.placeholder = "---";
                                                }
                                                for ( _scale in String(_field.entries).split("\n") )
                                                {
                                                    _setFW.scale.value.push({id: _scale,name: _scale});
                                                }
                                            }
                                        }
                                        for (_tempO in _tempObjects)
                                        {
                                            if (!itemObjectiveLev2.wfparameters.objective.objective.HasProperty(_tempO))
                                            {
                                                itemObjectiveLev2.wfparameters.objective.objective.SetProperty(_tempO, _tempObjects.GetProperty(_tempO));
                                                if (DataType(itemObjectiveLev2.wfparameters.objective.objective.GetProperty(_tempO))=="object" && ObjectType(itemObjectiveLev2.wfparameters.objective.objective.GetProperty(_tempO))=="JsObject")
                                                {
                                                    itemObjectiveLev2.wfparameters.objective.objective.GetProperty(_tempO).visible = false;
                                                }
                                            }
                                        }

                                        for( _code in String("name,plan,date_plan").split(",") )
                                        {
                                            if( ArrayOptFind(arrCustomFieldsObject,"This.code=='"+_code+"'")==undefined)
                                                itemObjectiveLev2.wfparameters.objective.objective.GetOptProperty(_code).visible = false;
                                        }
                                    }
                                }
                                else if ( ArrayCount(arrCurScale) > 0 && oDevMethodScale.task_type == "task")
                                {
                                    _tmpFW = getCopyObjectByValue( itemObjectiveLev2.wfparameters.objective.objective );
                                    itemObjectiveLev2.wfparameters.objective.objective = [];
                                    for ( _tmpScale in arrCurScale )
                                    {
                                        _tempObjects = getCopyObjectByValue( _tmpFW );

                                        _tmpObj = {};

                                        _tmpObj.SetProperty("development_task_id", getCopyObjectByValue(_tempObjects.GetProperty("development_task_id")) )

                                        arrCustomFieldsObject = getCustomFieldsObjectConfig(_tmpScale.id);
                                        if( ArrayCount(arrCustomFieldsObject)>0)
                                        {
                                            if (_tempObjects.HasProperty("instruction"))
                                            {
                                                _tmpObj.instruction = getCopyObjectByValue(_tempObjects.GetProperty("instruction"));
                                            }
                                            if (_tempObjects.HasProperty("richtext"))
                                            {
                                                _tmpObj.richtext = getCopyObjectByValue(_tempObjects.GetProperty("richtext"));
                                            }
                                            for( _field in arrCustomFieldsObject)
                                            {
                                                if (_tempObjects.HasProperty(_field.code))
                                                {
                                                    _tmpObj.SetProperty(_field.code ,ParseJson(EncodeJson(_tempObjects.GetProperty(_field.code))));
                                                }
                                                if( !_tmpObj.HasProperty(_field.code) )
                                                {
                                                    _tmpObj.SetProperty(_field.code , getWFParamTemplate("fieldSupplementaryQuestions"));
                                                }
                                                _setFW = _tmpObj.GetOptProperty(_field.code);
                                                _setFW.label = (_field.GetOptProperty("name") != undefined?_field.name:"");
                                                _setFW.control_type = _field.type;
                                                _setFW.required = (_field.GetOptProperty("required") != undefined?_field.required:"");
                                                _setFW.visible = true;
                                                _setFW.visible_in = _setFW.HasProperty("visible_in") ? (_setFW.visible_in + ";" + "form"): ("form");
                                                _setFW.ediatble = true;
                                                if ( _field.GetOptProperty("entries") != undefined && Trim(_field.entries) != '' )
                                                {
                                                    _setFW.scale = {"value": []};
                                                    if ( _setFW.control_type == "select")
                                                    {
                                                        _setFW.placeholder = "---";
                                                    }
                                                    for ( _scale in String(_field.entries).split("\n") )
                                                    {
                                                        _setFW.scale.value.push({id: _scale,name: _scale});
                                                    }
                                                }
                                            }

                                            for (_tempO in _tempObjects)
                                            {
                                                if (!_tmpObj.HasProperty(_tempO))
                                                {
                                                    _tmpObj.SetProperty(_tempO, getCopyObjectByValue(_tempObjects.GetProperty(_tempO)));
                                                    if (DataType(_tmpObj.GetProperty(_tempO))=="object" && ObjectType(_tmpObj.GetProperty(_tempO))=="JsObject")
                                                    {
                                                        _tmpObj.GetProperty(_tempO).visible = false;
                                                    }
                                                }
                                            }

                                            for( _code in String("name,plan,date_plan").split(",") )
                                            {
                                                if( ArrayOptFind(arrCustomFieldsObject,"This.code=='"+_code+"'")==undefined)
                                                {
                                                    _tmpObj.GetOptProperty(_code).visible = false;
                                                }
                                            }
                                        }
                                        else
                                        {
                                            _tmpObj = _tempObjects;
                                        }

                                        _tmpObj.development_task_id.SetProperty("default", ArrayOptFirstElem(arrCurScale).id);
                                        _tmpObj.development_task_id.SetProperty("placeholder", null);
                                        _tmpObj.development_task_id.SetProperty("control_type", "radio");
                                        _tmpObj.development_task_id.SetProperty("layout", "col");
                                        _tmpObj.development_task_id.SetProperty("key_value", _tmpScale.id);
                                        if (_tmpObj.HasProperty("richtext") && ArrayOptFind(arrTaskTypes, "String(This.id) == String(" + CodeLiteral( _tmpScale.id ) + ")")!=undefined)
                                        {
                                            _tmpObj.richtext.label = ArrayOptFind(arrTaskTypes, "String(This.id) == String(" + CodeLiteral( _tmpScale.id ) + ")").descr;
                                        }
                                        itemObjectiveLev2.wfparameters.objective.objective.push( getCopyObjectByValue( _tmpObj ) );
                                    }

                                }
                            }
                            else if(ArrayCount(arrDevMethodScales) > 0 && sDevelopmentTaskSelect=="single")
                            {
// by AF
                                _newFW = getCopyObjectByValue(itemObjectiveLev2.wfparameters.objective.objective);
                                itemObjectiveLev2.wfparameters.objective.objective = [];
                                _scale = ArrayExtract(arrDevMethodScales,"({'id': This.task_title, 'name': This.task_title})");
                                _defType = "";
                                for(itemDevMethodScales in arrDevMethodScales)
                                {
                                    if (_defType=="")
                                    {
                                        _defType = itemDevMethodScales.task_title;
                                    }
                                    _setFW = {}; //getCopyObjectByValue(_newFW);
                                    _setFW.SetProperty("task_type", getWFParamTemplate("fieldradiomultiple"));
                                    _setFW.task_type.scale.value = _scale;
//									_setFW.task_type.control_type = "radio";
//									_setFW.task_type.layout = "col";
                                    _setFW.task_type.SetProperty("default", _defType);
                                    _setFW.task_type.SetProperty("key_value",itemDevMethodScales.task_title);
                                    _setFW.task_type.placeholder = null;
                                    arrCurScale = itemDevMethodScales.task_type == "task" ? itemDevMethodScales.scale : ArraySelect(itemDevMethodScales.scale, "!StrContains(sExistsChildIDs, String(This.id))");
                                    if(tools_web.is_true(itemDevMethodScales.is_by_category))
                                    {
                                        _setFW.SetProperty(itemDevMethodScales.task_type + "_catalog", getWFParamTemplate("set_category_field"));
                                        _setFW[itemDevMethodScales.task_type + "_catalog"].data_src = itemDevMethodScales.task_type + "_catalog";
                                        _setFW[itemDevMethodScales.task_type + "_catalog"].label = i18n.t( 'kategoriyadlya' ) + itemDevMethodScales.task_title;
                                        _setFW[itemDevMethodScales.task_type + "_catalog"].depend_datasets = [{name: (iCurTopObjectID + "_" + itemCurLev2ObjectDoc.DocID + "_" + itemDevMethodScales.task_type), collection: (curAppl.code + "_getdataset")}];
                                        if (!bSplitCategorys)
                                        {
                                            _setFW[itemDevMethodScales.task_type + "_catalog"].depend_datasets.push({name: (itemDevMethodScales.task_type + "_catalog2"), collection: (curAppl.code + "_getdataset")});
                                            _setFW.SetProperty(itemDevMethodScales.task_type + "_catalog2", getWFParamTemplate("set_category_field"));
                                            _setFW[itemDevMethodScales.task_type + "_catalog2"].data_src = itemDevMethodScales.task_type + "_catalog2";
                                            _setFW[itemDevMethodScales.task_type + "_catalog2"].label = i18n.t( 'podkategoriyadl' ) + itemDevMethodScales.task_title;
                                            _setFW[itemDevMethodScales.task_type + "_catalog2"].depend_datasets = [{name: (iCurTopObjectID + "_" + itemCurLev2ObjectDoc.DocID + "_" + itemDevMethodScales.task_type), collection: (curAppl.code + "_getdataset")}];
                                            _setFW[itemDevMethodScales.task_type + "_catalog2"].visible = true;
                                        }
                                        else if (_setFW.HasProperty(itemDevMethodScales.task_type + "_catalog2"))
                                        {
                                            _setFW[itemDevMethodScales.task_type + "_catalog2"].visible = false;
                                        }
                                    }
                                    _setFW.SetProperty(itemDevMethodScales.task_type + "_id", getWFParamTemplate("field4multiple"));
                                    _setFW = addRequiredFields(_setFW, getWFParamTemplate("notasktype"));
                                    _setFW[itemDevMethodScales.task_type + "_id"].label = itemDevMethodScales.task_title;
                                    objData.dataset.SetProperty(iCurTopObjectID + "_" + itemCurLev2ObjectDoc.DocID + "_" + itemDevMethodScales.task_type, arrCurScale);
                                    _setFW[itemDevMethodScales.task_type + "_id"].data_src = iCurTopObjectID + "_" + itemCurLev2ObjectDoc.DocID + "_" + itemDevMethodScales.task_type;
                                    _setFW = appendCopyObjectByValue(_newFW, _setFW);
                                    if (_setFW.HasProperty("development_task_id"))
                                    {
                                        _setFW.development_task_id.visible = false;
                                    }
                                    itemObjectiveLev2.wfparameters.objective.objective.push(_setFW);
                                }
// end AF
                            }
                            else if(ArrayCount(arrDevMethodScales) > 0)
                            {
                                itemObjectiveLev2.wfparameters.objective.objective = getWFParamTemplate("multiple");
                                _category_is_first = "";
                                for(itemDevMethodScales in arrDevMethodScales)
                                {
                                    arrCurScale = ArraySelect(itemDevMethodScales.scale, "!StrContains(sExistsChildIDs, String(This.id))");
                                    if(tools_web.is_true(itemDevMethodScales.is_by_category))
                                    {
                                        if ((!bCommonCategorys || _category_is_first==""))
                                        {
                                            itemObjectiveLev2.wfparameters.objective.objective.SetProperty(itemDevMethodScales.task_type + "_catalog", getWFParamTemplate("set_category_field"));
                                            itemObjectiveLev2.wfparameters.objective.objective[itemDevMethodScales.task_type + "_catalog"].data_src = itemDevMethodScales.task_type + "_catalog";
                                            itemObjectiveLev2.wfparameters.objective.objective[itemDevMethodScales.task_type + "_catalog"].label = i18n.t( 'kategoriyadlya' ) + itemDevMethodScales.task_title;
                                            itemObjectiveLev2.wfparameters.objective.objective[itemDevMethodScales.task_type + "_catalog"].depend_datasets = [{name: (iCurTopObjectID + "_" + itemCurLev2ObjectDoc.DocID + "_" + itemDevMethodScales.task_type), collection: (curAppl.code + "_getdataset")}];
                                            if (_category_is_first=="")
                                            {
                                                _category_is_first = itemDevMethodScales.task_type + "_catalog";
                                            }
                                            if (!bSplitCategorys)
                                            {
                                                itemObjectiveLev2.wfparameters.objective.objective[itemDevMethodScales.task_type + "_catalog"].depend_datasets.push({name: (itemDevMethodScales.task_type + "_catalog2"), collection: (curAppl.code + "_getdataset")});
                                                itemObjectiveLev2.wfparameters.objective.objective.SetProperty(itemDevMethodScales.task_type + "_catalog2", getWFParamTemplate("set_category_field"));
                                                itemObjectiveLev2.wfparameters.objective.objective[itemDevMethodScales.task_type + "_catalog2"].data_src = itemDevMethodScales.task_type + "_catalog2";
                                                itemObjectiveLev2.wfparameters.objective.objective[itemDevMethodScales.task_type + "_catalog2"].label = i18n.t( 'podkategoriyadl' ) + itemDevMethodScales.task_title;
                                                itemObjectiveLev2.wfparameters.objective.objective[itemDevMethodScales.task_type + "_catalog2"].depend_datasets = [{name: (iCurTopObjectID + "_" + itemDevMethodScales.task_type), collection: (curAppl.code + "_getdataset")}];
                                                itemObjectiveLev2.wfparameters.objective.objective[itemDevMethodScales.task_type + "_catalog2"].visible = false;
                                            }
                                            else if (itemObjectiveLev2.wfparameters.objective.objective.HasProperty(itemDevMethodScales.task_type + "_catalog2"))
                                            {
                                                itemObjectiveLev2.wfparameters.objective.objective[itemDevMethodScales.task_type + "_catalog2"].visible = true;
                                            }
                                        }
                                        else if (bCommonCategorys)
                                        {
                                            itemObjectiveLev2.wfparameters.objective.objective[_category_is_first].depend_datasets.push({name: (iCurTopObjectID + "_" + itemDevMethodScales.task_type), collection: (curAppl.code + "_getdataset")});
                                            if (itemObjectiveLev2.wfparameters.objective.objective.HasProperty(_category_is_first + "2"))
                                            {
                                                itemObjectiveLev2.wfparameters.objective.objective[_category_is_first + "2"].depend_datasets.push({name: (iCurTopObjectID + "_" + itemDevMethodScales.task_type), collection: (curAppl.code + "_getdataset")});
                                            }
                                        }
                                    }
                                    itemObjectiveLev2.wfparameters.objective.objective.SetProperty(itemDevMethodScales.task_type + "_id", getWFParamTemplate("field4multiple"));
                                    itemObjectiveLev2.wfparameters.objective.objective[itemDevMethodScales.task_type + "_id"].label = itemDevMethodScales.task_title;

                                    //itemObjectiveLev2.wfparameters.objective.objective[itemDevMethodScales.task_type + "_id"].scale.value = arrCurScale;
                                    objData.dataset.SetProperty(iCurTopObjectID + "_" + itemCurLev2ObjectDoc.DocID + "_" + itemDevMethodScales.task_type, arrCurScale);
                                    itemObjectiveLev2.wfparameters.objective.objective[itemDevMethodScales.task_type + "_id"].data_src = iCurTopObjectID + "_" + itemCurLev2ObjectDoc.DocID + "_" + itemDevMethodScales.task_type;
                                }
                                itemObjectiveLev2.wfparameters.objective.objective = addRequiredFields(itemObjectiveLev2.wfparameters.objective.objective, getWFParamTemplate("required"));
                                if( bFlagCancel && !bNoCancelObject && !bNoCancelObject2)
                                    itemObjectiveLev2.wfparameters.objective.objective = addRequiredFields(itemObjectiveLev2.wfparameters.objective.objective, getWFParamTemplate("task_flag_cancel", {curState: curState, sCancelState: sCancelState}));
                                // множественный выбор развивающих действий
                            }
                        }
                    }
                    if( bFlagCancel && !bNoCancelObject)
                    {
                        if ( IsArray( itemObjectiveLev2.wfparameters.objective.objective ) )
                        {
                            for ( _tmpObj in itemObjectiveLev2.wfparameters.objective.objective )
                            {
                                _tmpObj = addRequiredFields(_tmpObj, getWFParamTemplate("task_flag_cancel", {curState: curState, sCancelState: sCancelState}));
                            }
                        }
                        else
                        {
                            itemObjectiveLev2.wfparameters.objective.objective = addRequiredFields(itemObjectiveLev2.wfparameters.objective.objective, getWFParamTemplate("task_flag_cancel", {curState: curState, sCancelState: sCancelState}));
                        }
                    }
                    if (itemObjectiveLev2.HasProperty("objectives"))
                    {
                        itemObjectiveLev2.can_delete =  (!itemObjectiveLev2.HasProperty("block_delete") || !tools_web.is_true(itemObjectiveLev2.block_delete.value));
                        if (itemObjectiveLev2.editable && !bHasSuppQ)
                        {
                            itemObjectiveLev2.editable = false;
                        }
                        for (itemObjectiveLev3 in itemObjectiveLev2.objectives)
                        {
                            toLog("Lev1 : " + itemObjectiveLev1.name.value + " ---> Lev2 : " + itemObjectiveLev2.name.value + " ---> Lev3 : " + itemObjectiveLev3.name.value, LogName, false);
                            itemObjectiveLev3.wfparameters = {"objective" : addRequiredFields(getWFParamTemplate(sTypeObjectiveL3, {"sCompetenceViewType": sCompetenceViewType, "bCompetencesAllowChange": bCompetencesAllowChange, "bShowDescInSection": bShowDescInSection, "sDescSectionName": sDescSectionName, "sDescNewDev": sDescNewDev}), getWFParamTemplate("required"))};
                            itemObjectiveLev3.wfparameters.dialog_buttons = (curEditable) ? getCopyObjectByValue(oEditButtons) : getCopyObjectByValue(oViewButtons);
                            if ( bEnableWeight != true )
                            {
                                itemObjectiveLev3.wfparameters.SetProperty( "sum_weight", { show: "none" } );
                            }

                            itemObjectiveLev3.wfparameters.objective.development_task_id.visible = false;
                            itemObjectiveLev3.wfparameters.objective.name.visible_in = "title;form";

                            itemObjectiveLev3.wfparameters.objective.name.editable = curEditable && (OptInt(itemObjectiveLev3.development_task_id.value) == undefined );
                            itemObjectiveLev3.can_add_child = false;
                            itemObjectiveLev3.can_delete = curEditable && (!itemObjectiveLev3.HasProperty("block_delete") || !tools_web.is_true(itemObjectiveLev3.block_delete.value));
                            itemObjectiveLev3.editable = curEditable;
                            if (!curEditable)
                            {
                                itemObjectiveLev3.wfparameters.objective.instruction.label = ("<center><b>"+itemObjectiveLev3.name.value+"</b></center>");
                            }

                            itemObjectiveLev3.class = itemObjectiveLev3.GetOptProperty("class","") + " wt-" + sTypeObjectiveL3;

                            arrCustomFieldsObject = new Array();
                            itemCurTask = ArrayOptFind(arrCurPATasks,"This.id==" + OptInt(itemObjectiveLev3.id,0));
                            if (itemCurTask != undefined)
                            {
                                if (itemObjectiveLev3.HasProperty("date_plan") && itemCurTask.ChildExists("end_date_plan") && itemCurTask.end_date_plan.HasValue)
                                {
                                    itemObjectiveLev3.date_plan.value = StrXmlDate(itemCurTask.end_date_plan.Value);
                                }

                                xCurTaskType = itemCurTask.task_type_id.OptForeignElem;
                                if( itemCurTask.target_object_type=="task_type" && xCurTaskType!=undefined)
                                {
                                    if ( curEditable && !itemObjectiveLev3.wfparameters.objective.name.editable )
                                    {
                                        itemObjectiveLev3.wfparameters.objective.name.editable = true;
                                    }

                                    // ***************************** добавление доп полей *****************************
                                    arrCustomFieldsObject = getCustomFieldsObjectConfig(itemCurTask.task_type_id)
                                    if( ArrayCount(arrCustomFieldsObject)>0)
                                    {
                                        _tempObjects = ParseJson(EncodeJson(itemObjectiveLev3.wfparameters.objective));
                                        itemObjectiveLev3.wfparameters.objective = {};
                                        if (_tempObjects.HasProperty("instruction"))
                                        {
                                            itemObjectiveLev3.wfparameters.objective.instruction = _tempObjects.GetProperty("instruction")
                                        }
                                        if (_tempObjects.HasProperty("richtext"))
                                        {
                                            itemObjectiveLev3.wfparameters.objective.richtext = _tempObjects.GetProperty("richtext")
                                        }
                                        for( _field in arrCustomFieldsObject)
                                        {
                                            if (_tempObjects.HasProperty(_field.code))
                                            {
                                                itemObjectiveLev3.wfparameters.objective.SetProperty(_field.code ,ParseJson(EncodeJson(_tempObjects.GetProperty(_field.code))));
                                            }
                                            if( !itemObjectiveLev3.wfparameters.objective.HasProperty(_field.code) )
                                                itemObjectiveLev3.wfparameters.objective.SetProperty(_field.code , getWFParamTemplate("fieldSupplementaryQuestions"));

                                            _setFW = itemObjectiveLev3.wfparameters.objective.GetOptProperty(_field.code);
                                            _setFW.label = (_field.GetOptProperty("name") != undefined?_field.name:"");
                                            _setFW.control_type = _field.type;
                                            _setFW.required = (_field.GetOptProperty("required") != undefined?_field.required:"");
                                            if ( _setFW.control_type == "select")
                                            {
                                                _setFW.placeholder = "---";
                                            }
                                            if ( _field.GetOptProperty("entries") != undefined && Trim(_field.entries) != '' )
                                            {
                                                _setFW.scale = {"value": []};
                                                for ( _scale in String(_field.entries).split("\n") )
                                                {
                                                    _setFW.scale.value.push({id: _scale,name: _scale});
                                                }
                                            }
                                        }
                                        for (_tempO in _tempObjects)
                                        {
                                            if (!itemObjectiveLev3.wfparameters.objective.HasProperty(_tempO))
                                            {
                                                itemObjectiveLev3.wfparameters.objective.SetProperty(_tempO, _tempObjects.GetProperty(_tempO));
                                                if (DataType(itemObjectiveLev3.wfparameters.objective.GetProperty(_tempO))=="object" && ObjectType(itemObjectiveLev3.wfparameters.objective.GetProperty(_tempO))=="JsObject")
                                                {
                                                    itemObjectiveLev3.wfparameters.objective.GetProperty(_tempO).visible = false;
                                                }
                                            }
                                        }
                                        for( _code in String("name,plan,date_plan").split(",") )
                                        {
                                            if( ArrayOptFind(arrCustomFieldsObject,"This.code=='"+_code+"'")==undefined)
                                                itemObjectiveLev3.wfparameters.objective.GetOptProperty(_code).visible = false;
                                        }
                                    }
                                    // ***************************** добавление доп полей *****************************
                                }

                                sCurTaskObjectCatalog = itemCurTask.target_object_type;
                                sCurTaskObjectCatalogTitle = sCurTaskObjectCatalog == "" || sCurTaskObjectCatalog.OptForeignElem == undefined ? (itemObjectiveLev3.HasProperty("task_type") && itemObjectiveLev3.task_type.value != "" ? itemObjectiveLev3.task_type.value : i18n.t( 'zadacha' )) : sCurTaskObjectCatalog.OptForeignElem.title.Value;
                                sCurTaskObjectCatalogWebTemplate = (sCurTaskObjectCatalog == "" || sCurTaskObjectCatalog.OptForeignElem == undefined) ? "" : sCurTaskObjectCatalog.OptForeignElem.web_template.Value;

                                if(sCurTaskObjectCatalog == "" || sCurTaskObjectCatalog.OptForeignElem == undefined )
                                {
                                    sCurTaskObjectCatalogTitle = "";
                                    sCurTaskObjectCatalogWebTemplate = "";
                                }
                                else
                                {
                                    sCurTaskObjectCatalogWebTemplate = sCurTaskObjectCatalog.OptForeignElem.web_template.Value;

                                    oCurDevelopmentMethodConfig = getTaskTypeConfig(itemCurTask);
                                    sCurTaskObjectCatalogTitle = oCurDevelopmentMethodConfig == null ? sCurTaskObjectCatalog.OptForeignElem.title.Value : oCurDevelopmentMethodConfig.object_title;
                                }

                                xCurTaskType = itemCurTask.task_type_id.OptForeignElem;
                                if (xCurTaskType != undefined)
                                {
                                    if(sCurTaskObjectCatalogTitle == "")
                                        sCurTaskObjectCatalogTitle = xCurTaskType.name.Value;
                                }

                                __oCurDescription = ArrayOptFind(arrTaskTypes, "This.id == '0x" + StrHexInt(itemCurTask.task_type_id) + "'");
                                if(itemObjectiveLev3.desc.value != "")
                                {
                                    itemObjectiveLev3.wfparameters.objective.richtext.label = itemObjectiveLev3.desc.value
                                }
                                else if(__oCurDescription != undefined)
                                {
                                    itemObjectiveLev3.wfparameters.objective.richtext.label = __oCurDescription.descr;
                                }


                                if (sCurTaskObjectCatalogTitle!="")
                                {
                                    itemObjectiveLev3.wfparameters.objective.name.label = (itemObjectiveLev3.wfparameters.objective.name.label!="" ? itemObjectiveLev3.wfparameters.objective.name.label : (sCurTaskObjectCatalogTitle == i18n.t( 'tipzadachi' ) ? i18n.t( 'zadacha' ) : sCurTaskObjectCatalogTitle));
                                    if(IsArray(arrDevMethodScales) && ArrayCount(arrDevMethodScales) == 1 && !IsArray( itemObjectiveLev2.wfparameters.objective.objective ) )
                                    {
                                        itemObjectiveLev2.wfparameters.objective.objective.name.label = (itemObjectiveLev2.wfparameters.objective.objective.name.label!="" ? itemObjectiveLev2.wfparameters.objective.objective.name.label : (sCurTaskObjectCatalogTitle == i18n.t( 'tipzadachi' ) ? i18n.t( 'zadacha' ) : sCurTaskObjectCatalogTitle));
//										itemObjectiveLev2.wfparameters.objective.objective.development_task_id.label = sCurTaskObjectCatalogTitle;
//										itemObjectiveLev2.wfparameters.objective.objective.development_task_id.placeholder = "--" + sCurTaskObjectCatalogTitle + "--";
                                    }

                                    if (sPAViewType!="table")
                                    {
                                        itemObjectiveLev3.name.value = sCurTaskObjectCatalogTitle+": "+itemObjectiveLev3.name.value;
                                    }
                                    else if(sCurTaskObjectCatalogWebTemplate != "")
                                    {
                                        if(itemObjectiveLev3.HasProperty("url"))
                                        {
                                            itemObjectiveLev3.url.link_text = itemObjectiveLev3.name.value;
                                            itemObjectiveLev3.url.value = "/_wt/" + itemCurTask.target_object_id;
                                        }
                                        else
                                            itemObjectiveLev3.url = {"link_text":itemObjectiveLev3.name.value, "value":"/_wt/" + itemCurTask.target_object_id};

                                        itemObjectiveLev3.wfparameters.objective.url.visible = true;
                                        itemObjectiveLev3.wfparameters.objective.url.label = sCurTaskObjectCatalogTitle;
                                        if (itemObjectiveLev2.wfparameters.objective.HasProperty("objective"))
                                        {
                                            if (IsArray(itemObjectiveLev2.wfparameters.objective.objective))
                                            {
                                                for (oVrItem in itemObjectiveLev2.wfparameters.objective.objective)
                                                {
                                                    if (oVrItem.HasProperty("url"))
                                                    {
                                                        oVrItem.url.visible = true;
                                                    }
                                                    oVrItem.name.visible = false;
                                                }
                                            }
                                            else if (itemObjectiveLev2.wfparameters.objective.objective.HasProperty("url"))
                                            {
                                                //itemObjectiveLev2.wfparameters.objective.objective.url.label = sCurTaskObjectCatalogTitle;
                                                itemObjectiveLev2.wfparameters.objective.objective.url.visible = true;
                                                itemObjectiveLev2.wfparameters.objective.objective.name.visible = false;
                                            }
                                        }
                                    }

                                    if(!itemObjectiveLev3.wfparameters.objective.HasProperty("task_type"))
                                    {
                                        itemObjectiveLev3.wfparameters.objective.task_type = {"label": i18n.t( 'tip' ), "visible": true, "visible_in": "view", "editable": false, "required": false, "control_type": "text"};
                                    }
                                    if(itemObjectiveLev3.HasProperty("task_type"))
                                        itemObjectiveLev3.task_type.value = sCurTaskObjectCatalogTitle;
                                    else
                                        itemObjectiveLev3.task_type = {"value": sCurTaskObjectCatalogTitle, "editable": false, "visible": true};
                                }
                            }


                            if( bFlagCancel && !bNoCancelObject && !bNoCancelObject2)
                                itemObjectiveLev3.wfparameters.objective = addRequiredFields(itemObjectiveLev3.wfparameters.objective, getWFParamTemplate("task_flag_cancel", {curState: curState, sCancelState: sCancelState}));

                            // добавление кастомных оценок
                            if( bVisibleStatus )
                            {
                                itemCurTaskParent = ArrayOptFind(arrCurPATasks,"This.id==" + OptInt(itemObjectiveLev2.id,0));
                                sCurTaskObjectCatalogParent = undefined;
                                if (itemCurTaskParent != undefined)
                                {
                                    sCurTaskObjectCatalogParent = itemCurTaskParent.target_object_id;
                                }
                                fAddStatusMark(itemObjectiveLev3,sCurTaskObjectCatalog , sCurTaskObjectCatalogParent ,itemObjectiveLev2.wfparameters.objective.objective)
                            }
                            else if( itemObjectiveLev3.wfparameters.objective.HasProperty("status_mark") )
                            {
                                itemObjectiveLev3.wfparameters.objective.GetProperty("status_mark").visible = false;
                                if( itemObjectiveLev3.wfparameters.objective.HasProperty("date_fact") )
                                {
                                    itemObjectiveLev3.wfparameters.objective.GetProperty("date_fact").visible = false;
                                }
                            }
                        }
                    }
                }
            }

            // вычисление и показ процента выполнения по способам развития
            _cur_percent = fCalcObjectMark(itemObjectiveLev1);
            if (_cur_percent != null)
            {
                _over_percent += _cur_percent;
                _over_count ++;
            }

            // «Не актуально/Отменено» flag_cancel
            if( bFlagCancel )
            {
                try{
                    if(itemObjectiveLev1.HasProperty("flag_cancel") && tools_web.is_true(itemObjectiveLev1.flag_cancel.value) )
                        ObjectCancel(itemObjectiveLev1);

                    if (itemObjectiveLev1.HasProperty("objectives") )
                        for (_o2 in itemObjectiveLev1.objectives)
                        {
                            if(_o2.HasProperty("flag_cancel") && tools_web.is_true(_o2.flag_cancel.value) )
                                ObjectCancel(_o2);

                            if (_o2.HasProperty("objectives") )
                                for (_o3 in _o2.objectives)
                                {
                                    if(_o3.HasProperty("flag_cancel") && tools_web.is_true(_o3.flag_cancel.value) )
                                        ObjectCancel(_o3);
                                }
                        }
                }
                catch(er)
                {
                    alert(er)
                }
            }

            // проверим блокировку задач - поле - task_disabled
            fTaskDisabled(itemObjectiveLev1)

        }
    }

    curStateMode = "";
    if (curState=="set")
    {
        curStateMode = "plan";
    }
    else if (curState=="correct")
    {
        curStateMode = "correct";
    }

    fnBlockEditableObjectFields(objData, curStateMode)

    rOverallPercent=null;
    objData.overall_view = "none";

    if (_over_count > 0)
    {
        rOverallPercent = Real(_over_percent) / Real(_over_count);
    }
    if (rOverallPercent != null && rOverallPercent != docPA.TopElem.overall)
    {
        docPA.TopElem.overall = rOverallPercent;
        docPA.Save();
    }

    if (curState == "set" || !bFlagShowProgress)
    {
        objData.dataset.taskflow = [];
    }
    else if (bFlagShowProgress)
    {
        if (ArrayCount( objData.dataset.taskflow ) > 0 && bSortProgress)
        {
            objData.dataset.taskflow = ArraySort( objData.dataset.taskflow, "This.state=='c' ? 2: (This.state=='i' ? 1:0)", "+" );
        }
    }
    if ( curState != "set" && _over_count>0)
    {
        objData.overall_percent = rOverallPercent;
    }


    if( bFlagShowInstruction )
    {
        objData.wfcomment_title = sInstructionTitle;
        objData.wfcomment = sInstructionText;
        objData.wfcomment_state = sInstructionState;

        if( bFlagShowInstructionError  )
        {
            sErrorMsg = fCheckIsDoneForm(objData.id, docPA)
            if( sErrorMsg!="" )
                objData.wfcomment+="<br>"+sCommonErrorMessage+"<br>"+sErrorMsg
        }
    }

    objData.custom_experts = [];

    if (objData.HasProperty("objectives"))
    {
        for (_o in objData.objectives)
        {
            if ( _o.HasProperty("status_mark") && _o.status_mark.HasProperty("value") && _o.status_mark.value != "" )
            {
                if ( _o.HasProperty("status_object_id") && _o.status_object_id.HasProperty("value") && _o.status_object_id.value != "" )
                {
                    if ( _o.HasProperty("status_object_type") && _o.status_object_type.HasProperty("value") && _o.status_object_type.value != "" )
                    {
                        if ( _o.HasProperty("wfparameters") && _o.wfparameters.HasProperty("objective") )
                        {
                            _o.wfparameters.objective.status_url = {"control_type": "url", "label": "", "visible": true, "visible_in": "form;view", "edutable": false};
                            _o.status_url = {"value": tools_web.get_object_link(_o.status_object_type.value, _o.status_object_id.value, null, ""), "link_text": i18n.t( 'ssylkanarezult' )}
                        }
                    }
                }
                if ( _o.HasProperty("wfparameters") && _o.wfparameters.HasProperty("objective") && _o.wfparameters.objective.HasProperty("status_mark") && _o.wfparameters.objective.status_mark.GetOptProperty("data_src","")!="" )
                {
                    if ( objData.HasProperty("dataset") && objData.dataset.HasProperty(_o.wfparameters.objective.status_mark.data_src) )
                    {
                        for ( _scale in objData.dataset.GetProperty(_o.wfparameters.objective.status_mark.data_src) )
                        {
                            if ( _scale.id == _o.status_mark.value && _scale.disabled )
                            {
                                _o.can_delete = false;
                                if ( _o.wfparameters.objective.HasProperty("flag_cancel") )
                                {
                                    _o.wfparameters.objective.flag_cancel.editable = false;
                                }
                            }
                        }
                    }
                }
            }
            if (_o.HasProperty("objectives"))
            {
                for (_o1 in _o.objectives)
                {
                    if ( _o1.HasProperty("status_mark") && _o1.status_mark.HasProperty("value") && _o1.status_mark.value != "" )
                    {
                        if ( _o1.HasProperty("status_object_id") && _o1.status_object_id.HasProperty("value") && _o1.status_object_id.value != "" )
                        {
                            if ( _o1.HasProperty("status_object_type") && _o1.status_object_type.HasProperty("value") && _o1.status_object_type.value != "" )
                            {
                                if ( _o1.HasProperty("wfparameters") && _o1.wfparameters.HasProperty("objective") )
                                {
                                    _o1.wfparameters.objective.status_url = {"control_type": "url", "label": "", "visible": true, "visible_in": "form;view", "edutable": false};
                                    _o1.status_url = {"value": tools_web.get_object_link(_o1.status_object_type.value, _o1.status_object_id.value, null, ""), "link_text": i18n.t( 'ssylkanarezult' )}
                                }
                            }
                        }
                        if ( _o1.HasProperty("wfparameters") && _o1.wfparameters.HasProperty("objective") && _o1.wfparameters.objective.HasProperty("status_mark") && _o1.wfparameters.objective.status_mark.GetOptProperty("data_src","")!="" )
                        {
                            if ( objData.HasProperty("dataset") && objData.dataset.HasProperty(_o1.wfparameters.objective.status_mark.data_src) )
                            {
                                for ( _scale in objData.dataset.GetProperty(_o1.wfparameters.objective.status_mark.data_src) )
                                {
                                    if ( _scale.id == _o1.status_mark.value && _scale.disabled )
                                    {
                                        _o1.can_delete = false;
                                        if ( _o1.wfparameters.objective.HasProperty("flag_cancel") )
                                        {
                                            _o1.wfparameters.objective.flag_cancel.editable = false;
                                        }
                                    }
                                }
                            }
                        }
                    }
                    if (_o1.HasProperty("objectives"))
                    {
                        for (_o2 in _o1.objectives)
                        {
                            if ( _o2.HasProperty("status_mark") && _o2.status_mark.HasProperty("value") && _o2.status_mark.value != "" )
                            {
                                if ( _o2.HasProperty("status_object_id") && _o2.status_object_id.HasProperty("value") && _o2.status_object_id.value != "" )
                                {
                                    if ( _o2.HasProperty("status_object_type") && _o2.status_object_type.HasProperty("value") && _o2.status_object_type.value != "" )
                                    {
                                        if ( _o2.HasProperty("wfparameters") && _o2.wfparameters.HasProperty("objective") )
                                        {
                                            _o2.wfparameters.objective.status_url = {"control_type": "url", "label": "", "visible": true, "visible_in": "form;view", "edutable": false};
                                            _o2.status_url = {"value": tools_web.get_object_link(_o2.status_object_type.value, _o2.status_object_id.value, null, ""), "link_text": i18n.t( 'ssylkanarezult' )}
                                        }
                                    }
                                }
                                if ( _o2.HasProperty("wfparameters") && _o2.wfparameters.HasProperty("objective") && _o2.wfparameters.objective.HasProperty("status_mark") && _o2.wfparameters.objective.status_mark.GetOptProperty("data_src","")!="" )
                                {
                                    if ( objData.HasProperty("dataset") && objData.dataset.HasProperty(_o2.wfparameters.objective.status_mark.data_src) )
                                    {
                                        for ( _scale in objData.dataset.GetProperty(_o2.wfparameters.objective.status_mark.data_src) )
                                        {
                                            if ( _scale.id == _o2.status_mark.value && _scale.disabled )
                                            {
                                                _o2.can_delete = false;
                                                if ( _o2.wfparameters.objective.HasProperty("flag_cancel") )
                                                {
                                                    _o2.wfparameters.objective.flag_cancel.editable = false;
                                                }
                                            }
                                        }
                                    }
                                }
                            }

                        }
                    }
                }
            }
        }
    }

    // if (objData.HasProperty("objectives") && false )
    // {
    // 	objData.objective_blocks = [{id:"comps", name: i18n.t( 'kompetencii' ), weight:"", mark:""},{id:"profs", name: i18n.t( 'professionalno' ), weight:"", mark:""}];
    // 	for (_o in objData.objectives)
    // 	{
    // 		if (_o.competence_id.value!="" || _o.name.value==i18n.t( 'kouching' ))
    // 		{
    // 			_o.objective_block_id = "comps";
    // 		}
    // 		else
    // 		{
    // 			_o.objective_block_id = "profs";
    // 		}
    // 	}
    // }

    if (sDescNewComp!="" && objData.HasProperty("wfparameters") && objData.wfparameters.HasProperty("objective") && tools_web.is_true(objData.GetOptProperty("editable","")))
    {
        oWFObj = {};
        oWFObjA = objData.wfparameters.objective;
        if (ObjectType(oWFObjA) == "JsArray")
        {
            for (_oObj in objData.wfparameters.objective)
            {
                if (_oObj.HasProperty("competence_id") && tools_web.is_true(_oObj.competence_id.GetOptProperty("visible")) && tools_web.is_true(_oObj.competence_id.GetOptProperty("editable")) )
                {
                    oWFObj = _oObj;
                    break;
                }
            }
        }
        else
        {
            oWFObj = oWFObjA;
        }
        if (oWFObj.HasProperty("competence_id") && tools_web.is_true(oWFObj.competence_id.GetOptProperty("visible")) && tools_web.is_true(oWFObj.competence_id.GetOptProperty("editable")) )
        {
            oWFObj.instruction = {"label": sDescNewComp, "visible": true, "visible_in": "form"};
            _oObj = {};
        }
    }


    if (objData.HasProperty("objectives") && ArrayCount(aTaskGrouping)>0)
    {
        _gtps = [];
        _ig = 0;
        _devs = ArraySelectAll(XQuery("for $obj in development_methods where MatchSome($obj/code,("+ArrayMerge(aTaskGrouping,"XQueryLiteral(This.code)",",")+")) return $obj"));
        for (_gr in aTaskGrouping)
        {
            _ig++;
            _gcode = "group_"+_ig;
            _gtp = ArrayOptFind(_gtps,"This.name == " + CodeLiteral(_gr.group));
            if (_gtp==undefined)
            {
                _gtp = {"id": _gcode, "name": _gr.group, "expadable": false, "collapsed": false, "mark": null, "weight": null};
                _gtps.push(_gtp);
            }
            _o1 = undefined;
            for (_o in objData.objectives)
            {
                if (_gr.code == "competences" && _o.HasProperty("competence_id") && _o.competence_id.HasProperty("value") && OptInt(_o.competence_id.value)>0)
                {
                    _o.objective_block_id = _gtp.id;
                }
                else if (ArrayOptFind(_devs,"This.code == " + CodeLiteral(_gr.code))!=undefined && _o.HasProperty("development_method_id") && _o.development_method_id.HasProperty("value") && OptInt(_o.development_method_id.value,0)>0 && OptInt(ArrayOptFind(_devs,"This.code == " + CodeLiteral(_gr.code)).id, 0) == OptInt(_o.development_method_id.value, 999))
                {
                    _o.objective_block_id = _gtp.id;
                }
                else if (_gr.code == "all")
                {
                    _o.objective_block_id = _gtp.id;
                }
            }
        }
        objData.objective_blocks = _gtps;
    }


    if ( bEnableWeight != true )
    {
        objData.wfparameters.SetProperty( "sum_weight", null );
    }


    if (OptInt(objData.person.id) == OptInt(curPersonID) && (curState == "action" || curState == "summing_results")) {
        objData.editable = true
        for (obj1 in objData.objectives) {
            obj1.editable = false
            obj1.can_delete = false
            obj1.wfparameters.objective.buttons = []
            obj1.can_add_child = false
            obj1.wfparameters.objective.can_add_child = false

            if (obj1.GetOptProperty("objectives") == undefined) continue
            for (obj2 in obj1.objectives) {
                obj2.wfparameters.objective.buttons = []
                obj2.can_delete = false
                obj2.can_add_child = false
                obj2.wfparameters.objective.can_add_child = false

                if (obj2.GetOptProperty("objectives") == undefined) continue
                for (obj3 in obj2.objectives) {
                    obj3.editable = true
                    obj3.can_delete = false
                    obj3.wfparameters.objective.status_mark.editable = true
                    obj3.wfparameters.objective.date_fact.editable = true
                    obj3.wfparameters.dialog_buttons = [{"action": "save", "title": i18n.t( 'sohranit' )},{"action": "cancel", "title": i18n.t( 'zakryt' )}];
                }
            }
        }
    }

    if (objData.HasProperty("objectives"))
    {
        for (_o in objData.objectives)
        {

            if(!_o.HasProperty('name_title'))
            {
                _o.name_title = {}
                _o.name_title.visible = true;

            }
            if (competenceScore != null && competenceScore.HasProperty(_o.competence_id.value))
            {
                _o.name_title.value = _o.name.value + ' ' + competenceScore.GetProperty(_o.competence_id.value).score_html;
            }
            else
            {
                _o.name_title.value = _o.name.value
            }

            _owf = _o.wfparameters.objective
            _owf.name.visible=false;
            _owf.name_title.visible=true;
        }
    }

    return objData;
}

function getSavePATemplate(objData, xmlPartData, docPA) {
    //return {is_done: false, is_ready: false};

    function findInTree(arrTreeObject, sID, bClearObjectives)
    {
        var oRequiredBranch = null;
        for(itemBranch in arrTreeObject)
        {
            if(String(itemBranch.id) == String(sID))
            {
                if(tools_web.is_true(bClearObjectives))
                    itemBranch.objectives = null;
                oRequiredBranch = itemBranch;
                //return itemBranch;
            }
            else if(itemBranch.HasProperty("objectives") && IsArray(itemBranch.objectives))
            {
                oRequiredBranch = findInTree(itemBranch.objectives, sID, bClearObjectives)
            }
            if(oRequiredBranch != null)
                break;
        }
        return oRequiredBranch;
    }

    curPA = docPA.TopElem;
    var bIsDebug = global_settings.debug;

    var LogName = "";
    if(bIsDebug)
    {
        var curAppl = tools_app.get_application(objData.id);
        if(curAppl !=  null) LogName = "appl_" + curAppl.code;
        EnableLog(LogName);
    }

    var sCompetenceViewType = tools_app.get_cur_settings("competence_view_type", "instance", null, null, null, objData.id);
    var arrOmnyDevelopmentMethodIDs = fnStringToArray(tools_app.get_cur_settings("omny_development_method_ids", "instance", null, null, null, objData.id));
    var bOmnyDevelopmentMethodIsOverlay = tools_web.is_true(tools_app.get_cur_settings("omny_development_methods_is_overlay", "instance", null, null, null, objData.id));
    var arrAddObjectiveIDs = fnStringToArray(tools_app.get_cur_settings("add_category_ids", "instance", null, null, null, objData.id));
    var bAddAllDevelopmentMethods = tools_web.is_true(tools_app.get_cur_settings("add_all_dev_methods", "instance", null, null, null, objData.id));
    var bCalculateCompetenceOnly = tools_web.is_true(tools_app.get_cur_settings("is_competence_only", "instance", null, null, null, objData.id));
    var sCommonErrorMessage = tools_app.get_cur_settings("error_message", "instance", null, null, null, objData.id);
    var bFlagShowIprError = tools_web.is_true(tools_app.get_cur_settings("flag_show_ipr_error", "instance", null, null, null, objData.id)); // Показывать всплывающее сообщение при сохранении с резюме заполненности ИПР

    var xmlReturnData = {};

    var bAutoopenDevMethod = false;
    var iTaskAutoopen = 0;

    var iMaxCompDM = OptInt( tools_app.get_cur_settings("max_num_dev_method_in_competence", "instance", null, null, null, objData.id), 0 );
    var bErrMaxCompDM = false;

    var bFlagShowIprWarn = tools_web.is_true(tools_app.get_cur_settings("flag_show_ipr_warn", "instance", null, null, null, objData.id));

    var bSeparatePlan = tools_web.is_true(tools_app.get_cur_settings("separate_plan", "instance", null, null, null, objData.id)); //

    var bShowEndDate = tools_web.is_true(tools_app.get_cur_settings("show_end_date", "instance", null, null, null, objData.id)); //

    //sCommonErrorMessage = i18n.t( 'vymozhetevybrat' );

    var iCountSelectedCompetence = 0;
    var iCountTaskSumTotal = 0;
    var arrCountsTaskInCompetences = [];
    var bIsReady = true;
    var bIsDeveloperTaskCountCorrect = true;
    var arrErrorMsg = [];
    var arrWarnMsg = [];
    var bHasIsSelect = false;
    objData.SetProperty("is_save_action",true);

    if(xmlPartData.HasProperty("save_obj_id"))
    {
        var tasksCollection = [];

        if(xmlPartData.save_obj_id == '_newobj')
        {
            tasksCollection = ArraySelectAll(XQuery("for $obj in tasks where MatchSome($obj/id,(" + ArrayMerge(objData.objectives,"This.id",",") + ")) return $obj"));
        }
        else if(StrEnds(xmlPartData.save_obj_id, "_new"))
        {
            var oCurObject, newTaskDoc, newTaskTE;

            xmlReturnData = findInTree(xmlPartData.objectives, xmlPartData.save_obj_id, true);
            var oRequiredFields = {};

            bAutoopenDevMethod = tools_web.is_true(tools_app.get_cur_settings("edit_dev_method_after_add", "instance", null, null, null, objData.id));
            tasksCollection = ArraySelectAll(XQuery("for $obj in tasks where $obj/parent_task_id = " + XQueryLiteral(OptInt(xmlPartData.save_obj_id.split("_")[0], 0)) + " return $obj"));

            if(xmlReturnData.HasProperty("type") && xmlReturnData.type.value != "task")
            {
                for(itemRequredFields in getWFParamTemplate("required"))
                {
                    oRequiredFields.SetProperty(itemRequredFields, xmlReturnData.GetOptProperty(itemRequredFields));
                }

                var sParentTaskID = StrReplace(xmlPartData.save_obj_id, "_new", "");
                var oParentObjective = findInTree(objData.objectives, sParentTaskID, false);
                var iParentTaskID = Int(sParentTaskID);
                var xParentTask = tools.open_doc(iParentTaskID).TopElem;
                var arrDevObjectConfig = getDevelopmentObjectConfig(xParentTask.target_object_id.Value)
                var iCount = 0;
                for(itemConfig in arrDevObjectConfig)
                {
                    if(xmlReturnData.HasProperty(itemConfig.object_name + "_id") && xmlReturnData[itemConfig.object_name + "_id"].HasProperty("value") && xmlReturnData[itemConfig.object_name + "_id"].value != "")
                    {
                        if ( bSeparatePlan )
                        {
                            oRequiredFields.SetProperty("plan", xmlReturnData.GetOptProperty("plan_" + itemConfig.object_name, xmlReturnData.GetOptProperty("plan", xmlReturnData.GetOptProperty("set_other_plan", {"value": ""}))));
                        }
                        if (xmlReturnData.HasProperty(itemConfig.object_name + "_id"))
                        {
                            for(itemObjectID in String(xmlReturnData[itemConfig.object_name + "_id"].value).split(";"))
                            {

                                oCurObject = tools.open_doc(Int(itemObjectID)).TopElem;

                                newObjectives = getNewObjectives(oParentObjective, {"id": itemObjectID, "name": oCurObject.name.Value}, itemConfig.object_name, docPA, null, oRequiredFields)
                                //newObjectives = getNewObjectives(oParentObjective, {"id": itemObjectID, "name": oCurObject.name.Value}, itemConfig.object_name, docPA)
                                if ( newObjectives != null )
                                {
                                    if(!oParentObjective.HasProperty("objectives"))
                                        oParentObjective.objectives = [];

                                    oParentObjective.objectives.push(newObjectives);
                                }
                            }
                        }
                    }
                    else if(xmlReturnData.HasProperty("set_other_checkbox") && xmlReturnData["set_other_checkbox"].HasProperty("value") && tools_web.is_true(xmlReturnData["set_other_checkbox"].value))
                    {
                        iCount++;
                        if( iCount==1 )
                        {
                            sName = (xmlReturnData.HasProperty("set_other_text") && xmlReturnData["set_other_text"].HasProperty("value") ? Trim(xmlReturnData["set_other_text"].value) : "");
                            sPlan = (xmlReturnData.HasProperty("set_other_plan") && xmlReturnData["set_other_plan"].HasProperty("value") ? Trim(xmlReturnData["set_other_plan"].value) : "");
                            oRequiredFields.SetProperty("plan", {"value": sPlan});
                            newObjectives = getNewOtherObjectives(oParentObjective, sName, "other", docPA, null, oRequiredFields)
                            if ( newObjectives != null  )
                            {
                                if(!oParentObjective.HasProperty("objectives"))
                                    oParentObjective.objectives = [];
                                oParentObjective.objectives.push(newObjectives);
                            }
                        }
                    }
                }
            }
        }
        else
        {
            tasksCollection = ArraySelectAll(XQuery("for $obj in tasks where $obj/id = " + XQueryLiteral(OptInt(xmlPartData.save_obj_id, 0)) + " return $obj"));
        }

        var itemTaskDoc, objectDoc, iCurCompetenceID, bIsSelect;
        var iParentID;
        var oIsSelect = {};

        for (itemTask in tasksCollection)
        {
            itemTaskDoc = tools.open_doc(itemTask.id);
            itemTaskTE = itemTaskDoc.TopElem;
            //itemTaskTE.name = itemTaskTE.custom_fields.ObtainChildByKey("task_type").value;

            try
            {
                itemTaskTE.end_date_plan.Value = itemTaskTE.date_plan.Value;
                itemTaskTE.date_plan.Value = itemTaskTE.doc_info.creation.date.Value;
//				itemTaskTE.start_date_plan = Date(itemTaskTE.custom_fields.ObtainChildByKey("start_date_plan").value);
            }
            catch(e)
            {
//				itemTaskTE.start_date_plan.Clear();
            }

            try
            {
                _last_data = itemTaskTE.custom_fields.ObtainChildByKey("last_data").value;
                if (_last_data=="")
                {
                    _last_data = {};
                }
                else
                {
                    _last_data = ParseJson(_last_data);
                }
                if (itemTaskTE.custom_fields.ObtainChildByKey("status_mark").value != _last_data.GetOptProperty("status_mark","") || itemTaskTE.custom_fields.ObtainChildByKey("flag_cancel").value != _last_data.GetOptProperty("flag_cancel","") || itemTaskTE.custom_fields.ObtainChildByKey("flag_cancel").value != _last_data.GetOptProperty("flag_cancel",""))
                {
                    if (!bShowEndDate)
                    {
                        itemTaskTE.date_fact = String(Date());
                    }
                }
//				itemTaskTE.end_date_plan = Date(itemTaskTE.custom_fields.ObtainChildByKey("end_date_plan").value);
            }
            catch(e)
            {
//				itemTaskTE.end_date_plan.Clear();
            }

            iCurCompetenceID = OptInt(itemTaskTE.custom_fields.ObtainChildByKey("competence_id").value,0);
            if (iCurCompetenceID > 0)
            {
                objectDoc = tools.open_doc(iCurCompetenceID);
                if (objectDoc!=undefined)
                {
                    objectTE = objectDoc.TopElem;
                    itemTaskTE.name = objectTE.name;
                    itemTaskTE.target_object_id = iCurCompetenceID;
                    itemTaskTE.target_object_type = "competence";
                    if(sCompetenceViewType == 'select')
                    {
                        itemTaskTE.custom_fields.ObtainChildByKey("is_select").value = 'true'
                    }
                    itemTaskTE.desc = (objectTE.ChildExists("desc") ? objectTE.desc : objectTE.comment);
                }
                oIsSelect.SetProperty(itemTask.id, tools_web.is_true(itemTaskTE.custom_fields.ObtainChildByKey("is_select").value));
            }

            iCurDevMethodID = OptInt(itemTaskTE.custom_fields.ObtainChildByKey("development_method_id").value,0);
            if (iCurDevMethodID > 0)
            {
                objectDoc = tools.open_doc(iCurDevMethodID);
                if (objectDoc!=undefined)
                {
                    objectTE = objectDoc.TopElem;
                    itemTaskTE.name = objectTE.name;
                    itemTaskTE.target_object_id = iCurDevMethodID;
                    itemTaskTE.target_object_type = "development_method";
                    itemTaskTE.desc = (objectTE.ChildExists("desc") ? objectTE.desc : objectTE.comment);

                    if( bAutoopenDevMethod && xmlReturnData.HasProperty("development_method_id") && OptInt(xmlReturnData.development_method_id.value) == iCurDevMethodID )
                    {
                        iTaskAutoopen = itemTask.id;
                    }
                }
            }

            iCurObjectID = OptInt(itemTaskTE.custom_fields.ObtainChildByKey("development_task_id").value,0);
            if (iCurObjectID > 0)
            {
                objectDoc = tools.open_doc(iCurObjectID);
                if (objectDoc!=undefined)
                {
                    objectTE = objectDoc.TopElem;
                    if ( !itemTaskTE.name.HasValue )
                    {
                        itemTaskTE.name = objectTE.ChildExists("name") ? objectTE.name : (objectTE.ChildExists("title") ? objectTE.title : objectTE.code);
                    }
                    itemTaskTE.target_object_id = iCurObjectID;
                    itemTaskTE.target_object_type = objectTE.Name;
                    if ( !itemTaskTE.desc.HasValue )
                    {
                        itemTaskTE.desc = (objectTE.ChildExists("desc") ? objectTE.desc : objectTE.comment);
                    }
                }
            }

            iParentID = OptInt(itemTaskTE.parent_task_id, 0);
            if(iParentID > 0)
            {
                if(!tools_web.is_true(itemTaskTE.custom_fields.ObtainChildByKey("status").value))
                {
                    itemTaskTE.custom_fields.ObtainChildByKey("status").value = "false";
                }
                else if(!itemTaskTE.date_fact.HasValue)
                {
                    if (!bShowEndDate)
                    {
                        itemTaskTE.date_fact = Date();
                    }
                }
            }

            if(itemTaskTE.target_object_type == "task_type")
            {
                itemTaskTE.task_type_id = itemTaskTE.target_object_id
            }

            _last_data = {
                "status_mark": ("" + itemTaskTE.custom_fields.ObtainChildByKey("status_mark").value.Value),
                "flag_cancel": ("" + itemTaskTE.custom_fields.ObtainChildByKey("flag_cancel").value.Value)
            };
            itemTaskTE.custom_fields.ObtainChildByKey("last_data").value = EncodeJson(_last_data);

            if (itemTaskTE.custom_fields.ObtainChildByKey("status_mark").value != "")
            {

                fldApp = tools_app.get_application('websoft_pdp_ext_v2');
                _level_scale_xml = Trim(fldApp.wvars.ObtainChildByKey('levels_scale_default').value);

                var arrScales = new Array();
                if ( _level_scale_xml != '')
                {
                    _level_scale_arr = OpenDocFromStr(_level_scale_xml);

                    for (_velem in _level_scale_arr.TopElem)
                    {
                        if(ArrayOptFind(arrScales,"This.type=='"+_velem.scale_type+"'")==undefined)
                        {
                            for(_scale in _velem.scales)
                                if( _scale.GetOptProperty('name')!=undefined )
                                    arrScales.push({'id': _scale.id.Value+'', 'name': (_scale.name.Value), 'percent': (_scale.GetOptProperty('percent')!=undefined ? _scale.percent.Value : '') , 'disabled' : (_scale.GetOptProperty('disabled')!=undefined ? tools_web.is_true(_scale.disabled.Value) : false )  })
                        }
                    }
                }

                oStatusMarkScale = ArrayOptFind(arrScales, 'This.id == itemTaskTE.custom_fields.ObtainChildByKey("status_mark").value');
                if ( oStatusMarkScale != undefined )
                {
                    itemTaskTE.custom_fields.ObtainChildByKey("status_mark_value").value = oStatusMarkScale.percent;
                    itemTaskTE.custom_fields.ObtainChildByKey("status_mark_name").value = oStatusMarkScale.name;

                    itemTaskTE.value = oStatusMarkScale.percent;
                    itemTaskTE.readiness_percent = oStatusMarkScale.percent;

                    if (OptInt(oStatusMarkScale.percent, 0) == 100 )
                    {
                        itemTaskTE.custom_fields.ObtainChildByKey("status").value = true;
                        itemTaskTE.status = '1';
                        if(iParentID > 0)
                        {
                            itemTaskDoc.Save();
                            set_task_complete(iParentID);
                        }
                    }
                }
            }

            itemTaskDoc.Save();
            itemTask.name = itemTaskTE.name;
            itemTask.code = itemTaskTE.desc;

            _oTmpobj = findInTree(xmlPartData.objectives, xmlPartData.save_obj_id, true);
            if (_oTmpobj != null)
            {
                if (_oTmpobj.HasProperty("date_plan"))
                {
                    _oTmpobj.date_plan.value = StrXmlDate(itemTaskTE.end_date_plan.Value);
                }
            }
        }
    }

    var arrCurPATasks = ArraySelectAll(XQuery("for $obj in tasks where MatchSome($obj/id,(" + ArrayMerge(curPA.tasks,"This.task_id",",") + ")) return $obj"))
    if (objData.HasProperty("objectives"))
    {
        var iCurCountsTaskInCompetences;
        var arrCurDevelopmentMethodConfigL2 = [];
        var arrCurDevelopmentMethodConfigL3 = [];
        var oCurDevelopmentMethodCountsL2 ={};
        var oCurDevelopmentMethodCountsL3 = {};

        var sAllowedObjectNameTypes = tools_app.get_cur_settings('allowed_object_types', 'app', null, null, null, objData.id);
        var arrAllowedObjectNameTypes = sAllowedObjectNameTypes != '' ? ParseJson(sAllowedObjectNameTypes) : [];
        var oAllDevelopmentTaskTypeCount = {};
        for(itemAllowedObjectNameType in arrAllowedObjectNameTypes)
        {
            oAllDevelopmentTaskTypeCount.SetProperty(itemAllowedObjectNameType.name, 0);
            if (!itemAllowedObjectNameType.HasProperty("opt"))
            {
                itemAllowedObjectNameType.SetProperty("opt",0);
            }
        }

        for (itemObjectiveLev1 in objData.objectives)
        {
            arrCurDevelopmentMethodConfigL2 = [];
            arrCurDevelopmentMethodConfigL3 = [];
            oCurDevelopmentMethodCountsL2 ={};
            oCurDevelopmentMethodCountsL3 = {};
            itemTaskL1 = ArrayOptFind(arrCurPATasks, "This.id==" + itemObjectiveLev1.id);
            if (itemTaskL1 != undefined)
            {
                itemTaskTEL1 = tools.open_doc(itemObjectiveLev1.id).TopElem;
                arrCurDevelopmentMethodConfigL2 = [];
                oCurDevelopmentMethodCountsL2 = {};
                target_object_typeL1 = itemTaskL1.target_object_type.Value;
                if(target_object_typeL1 == "development_method" && !bCalculateCompetenceOnly)
                {
                    arrCurDevelopmentMethodConfigL2 = ArraySelect(getDevelopmentObjectConfig(itemTaskL1.target_object_id.Value), 'This.is_target_task');
                    for(itemDMConfig in arrCurDevelopmentMethodConfigL2)
                    {
                        oCurDevelopmentMethodCountsL2.SetProperty(itemDMConfig.object_name, 0);
                    }
                }

                if(sCompetenceViewType == 'select' && itemObjectiveLev1.HasProperty("is_select"))
                {
                    itemObjectiveLev1.is_select.value = itemTaskTEL1.custom_fields.ObtainChildByKey("is_select").value;
                }

                bIsSelect = (target_object_typeL1 == "competence" && itemObjectiveLev1.HasProperty('is_select') && tools_web.is_true(itemObjectiveLev1.is_select.value) && (!itemObjectiveLev1.HasProperty("flag_cancel") || !tools_web.is_true(itemObjectiveLev1.flag_cancel.value)));
                if(bIsSelect)
                {
                    bHasIsSelect = true;
                    iCountSelectedCompetence++;
                }

                itemObjectiveLev1.name.value = itemTaskL1.name.Value;
                itemObjectiveLev1.desc.value = itemTaskTEL1.desc.Value;
            }

            if (itemObjectiveLev1.HasProperty("objectives"))
            {
                if(bIsSelect)
                {
                    iCurCountsTaskInCompetences = ArrayCount(ArraySelect(itemObjectiveLev1.objectives,"!This.HasProperty('flag_cancel') || !tools_web.is_true(This.GetOptProperty('flag_cancel').value)"));
                    arrCountsTaskInCompetences.push({competence_id: OptInt(itemObjectiveLev1.competence_id.value, 0), count: iCurCountsTaskInCompetences})
                    iCountTaskSumTotal += iCurCountsTaskInCompetences
                }

                if( iMaxCompDM != 0 && iMaxCompDM < ArrayOptSize(itemObjectiveLev1.objectives) )
                {
                    bErrMaxCompDM = true;
                    arrErrorMsg.push(i18n.t( 'compdmoverflow' ) + itemObjectiveLev1.name.value );
                }

                for (itemObjectiveLev2 in itemObjectiveLev1.objectives)
                {
                    if(bIsSelect && itemObjectiveLev2.HasProperty("status") && !tools_web.is_true(itemObjectiveLev2.status.value))
                    {
                        bIsReady = false;
                    }

                    if(itemObjectiveLev2.HasProperty("status") && itemObjectiveLev2.status.value == "")
                        itemObjectiveLev2.status.value = "false";

                    itemTaskL2 = ArrayOptFind(arrCurPATasks,"This.id==" + itemObjectiveLev2.id);
                    if (itemTaskL2 != undefined)
                    {
                        itemTaskTEL2 = tools.open_doc(itemObjectiveLev2.id).TopElem;
                        target_object_typeL2 = itemTaskL2.target_object_type.Value;
                        task_cancelL2 = tools_web.is_true(itemTaskTEL2.custom_fields.ObtainChildByKey("flag_cancel").value);
                        if ( String(target_object_typeL2) == "" && itemTaskTEL2.custom_fields.ObtainChildByKey("task_type").value == i18n.t( 'drugoe' ))
                        {
                            target_object_typeL2 = "education_method";
                        }

                        if(oCurDevelopmentMethodCountsL2.HasProperty(target_object_typeL2) && !task_cancelL2)
                            oCurDevelopmentMethodCountsL2[target_object_typeL2]++;

                        if( !bCalculateCompetenceOnly || !task_cancelL2)
                        {
                            if(oAllDevelopmentTaskTypeCount.HasProperty(target_object_typeL2))
                                oAllDevelopmentTaskTypeCount[target_object_typeL2]++
                        }

                        arrCurDevelopmentMethodConfigL3 = [];
                        oCurDevelopmentMethodCountsL3 = {};
                        if(target_object_typeL2 == "development_method" )
                        {
                            arrCurDevelopmentMethodConfigL3 = ArraySelect(getDevelopmentObjectConfig(itemTaskL2.target_object_id.Value), 'This.is_target_task');
                            for(itemDMConfig in arrCurDevelopmentMethodConfigL3)
                            {
                                oCurDevelopmentMethodCountsL3.SetProperty(itemDMConfig.object_name, 0);
                            }
                        }

                        itemObjectiveLev2.name.value = itemTaskL2.name.Value;
                        itemObjectiveLev2.desc.value = itemTaskTEL2.desc.Value;
                    }

                    if(itemObjectiveLev2.HasProperty("objectives"))
                    {
                        for (itemObjectiveLev3 in itemObjectiveLev2.objectives)
                        {

                            itemTaskL3 = ArrayOptFind(arrCurPATasks,"This.id==" + itemObjectiveLev3.id);
                            if (itemTaskL3 != undefined)
                            {
                                itemTaskTEL3 = tools.open_doc(itemObjectiveLev3.id).TopElem;
                                target_object_typeL3 = itemTaskL3.target_object_type.Value;
                                task_cancelL3 = tools_web.is_true(itemTaskTEL3.custom_fields.ObtainChildByKey("flag_cancel").value);
                                if ( String(target_object_typeL3) == "" && itemTaskTEL3.custom_fields.ObtainChildByKey("task_type").value == i18n.t( 'drugoe' ))
                                {
                                    target_object_typeL3 = "education_method";
                                }

                                if(oCurDevelopmentMethodCountsL3.HasProperty(target_object_typeL3) && !task_cancelL3)
                                    oCurDevelopmentMethodCountsL3[target_object_typeL3]++;
                                if(oAllDevelopmentTaskTypeCount.HasProperty(target_object_typeL3) && !task_cancelL3)
                                    oAllDevelopmentTaskTypeCount[target_object_typeL3]++

                                itemObjectiveLev3.name.value = itemTaskL3.name.Value;
                                itemObjectiveLev3.desc.value = itemTaskTEL3.desc.Value;
                            }
                        }

                        for(itemDMConfig in arrCurDevelopmentMethodConfigL3)
                        {
                            if(oCurDevelopmentMethodCountsL3[itemDMConfig.object_name] < OptInt(itemDMConfig.min, 0) || oCurDevelopmentMethodCountsL3[itemDMConfig.object_name] > OptInt(itemDMConfig.max, 100500))
                            {
                                bIsDeveloperTaskCountCorrect = false;
                                arrErrorMsg.push(i18n.t( 'nekorrektnoeko' ) + itemObjectiveLev1.name.value + " / " + itemObjectiveLev2.name.value + " / " + itemDMConfig.object_title + " ] : " + oCurDevelopmentMethodCountsL3[itemDMConfig.object_name] + i18n.t( 'dolzhnobytnemen' ) + itemDMConfig.min + (itemDMConfig.max == null ? "" : i18n.t( 'inebolee' ) + itemDMConfig.max) + " )")
                            }
                            else if(OptInt(itemDMConfig.GetOptProperty("opt",""), 0)>0 && (oCurDevelopmentMethodCountsL3[itemDMConfig.object_name] < OptInt(itemDMConfig.GetOptProperty("opt",""), 0) || oCurDevelopmentMethodCountsL3[itemDMConfig.object_name] > OptInt(itemDMConfig.GetOptProperty("opt",""), 100500)))
                            {
                                arrWarnMsg.push(i18n.t( 'kolichestvorazv' ) + itemObjectiveLev1.name.value + " / " + itemObjectiveLev2.name.value + " / " + itemDMConfig.object_title + " ] : " + oCurDevelopmentMethodCountsL3[itemDMConfig.object_name] + i18n.t( 'rekomenduetsya' ) + itemDMConfig.GetOptProperty("opt","") + " )")
                            }
                        }
                    }
                }

                for(itemDMConfig in arrCurDevelopmentMethodConfigL2)
                {
                    if(oCurDevelopmentMethodCountsL2[itemDMConfig.object_name] < OptInt(itemDMConfig.min, 0) || oCurDevelopmentMethodCountsL2[itemDMConfig.object_name] > OptInt(itemDMConfig.max,100500))
                    {
                        bIsDeveloperTaskCountCorrect = false;
                        arrErrorMsg.push(i18n.t( 'nekorrektnoeko' ) + itemObjectiveLev1.name.value + " / " + itemDMConfig.object_title + " ] : " + oCurDevelopmentMethodCountsL2[itemDMConfig.object_name] + i18n.t( 'dolzhnobytnemen' ) + itemDMConfig.min + (itemDMConfig.max == null ? "" : i18n.t( 'inebolee' ) + itemDMConfig.max) + " )")
                    }
                    else if(OptInt(itemDMConfig.GetOptProperty("opt",""), 0)>0 && (oCurDevelopmentMethodCountsL2[itemDMConfig.object_name] < OptInt(itemDMConfig.opt, 0) || oCurDevelopmentMethodCountsL2[itemDMConfig.object_name] > OptInt(itemDMConfig.GetOptProperty("opt",""),100500)))
                    {
                        arrWarnMsg.push(i18n.t( 'kolichestvorazv' ) + itemObjectiveLev1.name.value + " / " + itemDMConfig.object_title + " ] : " + oCurDevelopmentMethodCountsL2[itemDMConfig.object_name] + i18n.t( 'rekomenduetsya' ) + itemDMConfig.GetOptProperty("opt","") + " )")
                    }
                }
            }
            else if(bIsSelect)
            {
                arrCountsTaskInCompetences.push({competence_id: OptInt(itemObjectiveLev1.competence_id.value, 0), count: 0})
                bIsReady = false;
            }

        }
        for(itemDMConfig in arrAllowedObjectNameTypes)
        {
            _catalog_name = common.exchange_object_types.GetOptChildByKey(itemDMConfig.name);
            if (_catalog_name!=undefined)
            {
                _catalog_name = _catalog_name.title.Value;
            }
            else
            {
                _catalog_name = itemDMConfig.name;
            }
            if(oAllDevelopmentTaskTypeCount[itemDMConfig.name] > OptInt(itemDMConfig.max, 100500))
            {
                bIsDeveloperTaskCountCorrect = false;
                arrErrorMsg.push(i18n.t( 'nekorrektnoeob' ) + _catalog_name + "\" : " + oAllDevelopmentTaskTypeCount[itemDMConfig.name] + i18n.t( 'dolzhnobytnebol' ) + itemDMConfig.max + " )")
            }
            else if(OptInt(itemDMConfig.GetOptProperty("opt",""), 0)>0 && (oAllDevelopmentTaskTypeCount[itemDMConfig.name] < OptInt(itemDMConfig.GetOptProperty("opt",""), 0) || oAllDevelopmentTaskTypeCount[itemDMConfig.name] > OptInt(itemDMConfig.GetOptProperty("opt",""), 100500)))
            {
                arrWarnMsg.push(i18n.t( 'kolichestvorazv_1' ) + _catalog_name + "\" : " + oAllDevelopmentTaskTypeCount[itemDMConfig.name] + i18n.t( 'rekomenduetsya_1' ) + itemDMConfig.GetOptProperty("opt","") + " )")
            }
        }
    }

    if(bFlagShowIprError && ArrayOptSize(arrErrorMsg) != 0)
    {
        var sErrorMessage = "";
        if(sCommonErrorMessage != "")
        {
            sErrorMessage += sCommonErrorMessage + "\r\n\r\n";
        }

        sErrorMessage += ArrayMerge(arrErrorMsg, "This", "\r\n\r\n");

        objData.msg = {
            type: "alert",
            title: i18n.t( 'neobhodimoskor' ),
            text: HtmlEncode(sErrorMessage)
        };
    }
    else if (bFlagShowIprWarn && ArrayCount(arrWarnMsg)>0)
    {
        var sWarnMessage = "";

        sWarnMessage += ArrayMerge(arrWarnMsg, "This", "\r\n\r\n");

        objData.msg = {
            type: "alert",
            title: i18n.t( 'rekomenduemsko' ),
            text: HtmlEncode(sWarnMessage)
        };
    }

    if( iTaskAutoopen != 0 )
    {
        objData.autoopen = {
            action:"dialog",
            type:"objective",
            id: String(iTaskAutoopen)
        };
    }

    bIsReady = bIsReady && bHasIsSelect;

    var iCountTaskMinInCompetence = ArrayOptFirstElem(arrCountsTaskInCompetences) != undefined ? ArrayMin(arrCountsTaskInCompetences, "This.count").count : 0;

    var iMinNumCompetences = OptInt(tools_app.get_cur_settings("min_num_competence", "instance", null, null, null, objData.id), 0);
    var iMinNumTasksInCompetence = OptInt(tools_app.get_cur_settings("min_num_devmethod_in_competence", "instance", null,  null, null, objData.id), 0);
    var iMinNumTasksTotal = OptInt(tools_app.get_cur_settings("min_num_devmethod_sumtotal", "instance", null,  null, null, objData.id), 0);
    var iMaxNumTasksTotal = OptInt(tools_app.get_cur_settings("max_num_devmethod_sumtotal", "instance", null,  null, null, objData.id), 200);

    var iOptNumCompetences = OptInt(tools_app.get_cur_settings("opt_num_competence", "instance", null, null, null, objData.id), 0);
    var iOptNumTasksInCompetence = OptInt(tools_app.get_cur_settings("opt_num_devmethod_in_competence", "instance", null,  null, null, objData.id), 0);
    var iOptNumTasksTotal = OptInt(tools_app.get_cur_settings("opt_num_devmethod_sumtotal", "instance", null,  null, null, objData.id), 0);

    toLog("[SAVE]\r\niCountSelectedCompetence: " + iCountSelectedCompetence +
        "\r\n iMinNumCompetences: " + iMinNumCompetences +
        "\r\n bAddAllDevelopmentMethods: " + bAddAllDevelopmentMethods +
        "\r\n iCountTaskMinInCompetence: " + iCountTaskMinInCompetence +
        "\r\n iMinNumTasksInCompetence: " + iMinNumTasksInCompetence +
        "\r\n iCountTaskSumTotal: " + iCountTaskSumTotal +
        "\r\n iMinNumTasksTotal: " + iMinNumTasksTotal +
        "\r\n iMaxNumTasksTotal: " + iMaxNumTasksTotal +
        "\r\n bIsDeveloperTaskCountCorrect: " + bIsDeveloperTaskCountCorrect, LogName, false);

    var bIsDone = !bErrMaxCompDM && bIsDeveloperTaskCountCorrect && iCountSelectedCompetence >= iMinNumCompetences && (bAddAllDevelopmentMethods || (iCountTaskMinInCompetence >= iMinNumTasksInCompetence && iCountTaskSumTotal >= iMinNumTasksTotal && iCountTaskSumTotal <= iMaxNumTasksTotal));

    toLog("[" + objData.id + "] bIsReady: " + bIsReady + ", bIsDone: " + bIsDone, LogName, false)

    return {is_done: bIsDone, is_ready: bIsReady && iCountTaskSumTotal > 0};
}

function set_task_complete(iTaskID) {
    var xarrTasks = tools.xquery("for $elem in tasks where $elem/parent_task_id = " + iTaskID + " return $elem");
    var aCompletedTasks = ArraySelect(xarrTasks, "This.status == '1'");
    if ( ArrayCount(xarrTasks) > 0 && (ArrayCount(xarrTasks) ==  ArrayCount(aCompletedTasks)))
    {
        var docTask = tools.open_doc(iTaskID)
        docTask.TopElem.status = '1';
        docTask.Save();

        var iParentID = OptInt(docTask.TopElem.parent_task_id, 0);
        if ( iParentID > 0 )
        {
            set_task_complete(iParentID);
        }
    }
}

function getNewOtherObjectives(oParentObjective, sName , sCurObjectType, oDocPA, iStartPosition, oRequiredFields) {
    var iParentTaskID, curObjectives, hasTask, sCustomFieldName;
    if(iStartPosition == undefined || iStartPosition == null)
        iStartPosition = 0;

    if(oRequiredFields == undefined)
        oRequiredFields = {};

    if(oParentObjective != null)
    {
        iParentTaskID = oParentObjective.id;
    }
    else
    {
        if(sCurObjectType == "") sCurObjectType = "competence";
        iParentTaskID = null
    }

    if(sCurObjectType != "")
    {
        newTaskDoc = tools.new_doc_by_name("task", false);
        newTaskDoc.BindToDb();
        newTaskTE = newTaskDoc.TopElem;

        newTaskTE.source_object_type = "assessment_appraise";
        newTaskTE.source_object_id = oDocPA.TopElem.assessment_appraise_id.Value;
        newTaskTE.name = String(sName);
        newTaskTE.executor_type = "collaborator";
        newTaskTE.executor_id = oDocPA.TopElem.person_id.Value;
        if(iParentTaskID != null)
        {
            newTaskTE.parent_task_id = iParentTaskID;
        }
        newTaskTE.status = 0;
        newTaskTE.custom_fields.ObtainChildByKey("task_type").value = sCurObjectType;
        for(itemRequiredField in oRequiredFields)
        {
            switch(itemRequiredField)
            {
                case "plan":
                    newTaskTE.plan = !oRequiredFields.HasProperty("plan") ? "": oRequiredFields.plan.value;
                    break;
                case "date_plan":
                    newTaskTE.date_plan = !oRequiredFields.HasProperty("date_plan") ? "": oRequiredFields.date_plan.value;
                    break;
            }
        }

        newTaskDoc.Save();
        newTaskID = newTaskDoc.DocID;

        addPATaks = oDocPA.TopElem.tasks.ObtainChildByKey(newTaskID, "task_id");
        if(iParentTaskID != null)
        {
            addPATaks.parent_task_id = iParentTaskID;
        }
        if(iStartPosition != 0)
        {
            addPATaks.position = iStartPosition + oDocPA.TopElem.tasks.ChildNum;
        }
        oDocPA.Save();

        curObjectives = {
            id: String(newTaskID),
            type: {value: "task", editable: false, visible: false},
            name: {value: newTaskTE.name.Value, editable: true, visible: true},
            desc: {value: newTaskTE.desc.Value, editable: true, visible: true},
            task_type: {value: sCurObjectType, editable: false, visible: true},
            start_date_plan: {value: "", type: "date", editable: true, visible: true},
            end_date_plan: {value: "", type: "date", editable: true, visible: true},
            can_translate: false,
            wfparameters:{}
        };
        for(itemRequiredField in oRequiredFields)
        {
            curObjectives.SetProperty(itemRequiredField, oRequiredFields[itemRequiredField]);
        }
        curObjectives.SetProperty("development_task_id", {value: 123, type: "string", editable: true, visible: true})
        return curObjectives;
    }
    return null;
}

function getNewObjectives(oParentObjective, oCurObject, sCurObjectType, oDocPA, iStartPosition, oRequiredFields) {
    var iParentTaskID, curObjectives, hasTask, sCustomFieldName;
    if(iStartPosition == undefined || iStartPosition == null)
        iStartPosition = 0;

    if(oRequiredFields == undefined)
        oRequiredFields = {};

    if(oParentObjective != null)
    {
        iParentTaskID = oParentObjective.id;
        var sParentObjectType = ArrayOptFirstElem(tools.xquery("for $elem in tasks where $elem/id = " + oParentObjective.id + " return $elem", {"target_object_type" : ""})).target_object_type;
        if(sParentObjectType == "competence")
        {
            sCurObjectType = "development_method";
        }
    }
    else
    {
        if(sCurObjectType == "") sCurObjectType = "competence";
        iParentTaskID = null
    }

    if(sCurObjectType != "")
    {
        sReqHasTask = "for $elem in tasks  " +
            "	where  " +
            "		$elem/source_object_type = 'assessment_appraise'  " +
            "		and $elem/source_object_id = " + oDocPA.TopElem.assessment_appraise_id.Value +
            "		and $elem/target_object_type = " + CodeLiteral(sCurObjectType) +
            "		and $elem/target_object_id = " + OptInt(oCurObject.id, 0) +
            "		and $elem/executor_type = 'collaborator'  " +
            "		and $elem/executor_id = " + OptInt(oDocPA.TopElem.person_id.Value, 0) +
            (iParentTaskID == null ? "" : "		and $elem/parent_task_id = " + OptInt(iParentTaskID, 0)) +
            "		return $elem";

        toLog("sReqHasTask:\n" + sReqHasTask, undefined, false);

        hasTask = ( ArrayOptFirstElem(tools.xquery( sReqHasTask )) != undefined);
        if ( !hasTask )
        {
            switch(sCurObjectType)
            {
                case "competence" :
                    sCustomFieldName = "competence_id";
                    break;
                case "development_method" :
                    sCustomFieldName = "development_method_id";
                    break;
                default :
                    sCustomFieldName = "development_task_id";
                    break;
            }
            xCurObject = tools.open_doc(oCurObject.id);
            xCurObjectTE = xCurObject == undefined ? undefined : xCurObject.TopElem;
            newTaskDoc = tools.new_doc_by_name("task", false);
            newTaskDoc.BindToDb();
            newTaskTE = newTaskDoc.TopElem;

            newTaskTE.source_object_type = "assessment_appraise";
            newTaskTE.source_object_id = oDocPA.TopElem.assessment_appraise_id.Value;
            newTaskTE.target_object_type = sCurObjectType;
            newTaskTE.target_object_id = OptInt(oCurObject.id, 0);
            newTaskTE.name = String(oCurObject.name);
            newTaskTE.executor_type = "collaborator";
            newTaskTE.executor_id = oDocPA.TopElem.person_id.Value;
            newTaskTE.desc = ( xCurObjectTE == undefined ? "" : ( xCurObjectTE.ChildExists("desc") ? xCurObjectTE.desc : xCurObjectTE.comment ) );
            if(iParentTaskID != null)
            {
                newTaskTE.parent_task_id = iParentTaskID;
            }
            newTaskTE.status = 0;
            newTaskTE.custom_fields.ObtainChildByKey(sCustomFieldName).value = String(oCurObject.id);
            newTaskTE.custom_fields.ObtainChildByKey("task_type").value = sCurObjectType;
            for(itemRequiredField in oRequiredFields)
            {
                switch(itemRequiredField)
                {
                    case "plan":
                        newTaskTE.plan = oRequiredFields.plan.value;
                        break;
                    case "date_plan":
                        newTaskTE.date_plan = oRequiredFields.date_plan.value;
                        break;
                }
            }

            newTaskDoc.Save();
            newTaskID = newTaskDoc.DocID;

            addPATaks = oDocPA.TopElem.tasks.ObtainChildByKey(newTaskID, "task_id");
            if(iParentTaskID != null)
            {
                addPATaks.parent_task_id = iParentTaskID;
            }
            if(iStartPosition != 0)
            {
                addPATaks.position = iStartPosition + oDocPA.TopElem.tasks.ChildNum;
            }
            oDocPA.Save();

            //xCurObject = tools.open_doc(Int(oCurObject.id)).TopElem;
            curObjectives = {
                id: String(newTaskID),
                type: {value: "task", editable: false, visible: false},
                name: {value: newTaskTE.name.Value, editable: true, visible: true},
                desc: {value: newTaskTE.desc.Value, editable: true, visible: true},
                task_type: {value: sCurObjectType, editable: false, visible: true},
                start_date_plan: {value: "", type: "date", editable: true, visible: true},
                end_date_plan: {value: "", type: "date", editable: true, visible: true},
                can_translate: false,
                wfparameters:{}
            };
            for(itemRequiredField in oRequiredFields)
            {
                curObjectives.SetProperty(itemRequiredField, oRequiredFields[itemRequiredField]);
            }

            curObjectives.SetProperty(sCustomFieldName, {value: String(oCurObject.id), type: "string", editable: true, visible: true})
            if(sCurObjectType == "competence")
            {
                curObjectives.SetProperty("is_select", {value: "", editable: true, visible: true})
            }
            return curObjectives;
        }
    }
    return null;
}

function addRequiredFields(oTemplate, oRequiredFields) {
    for(itemField in oRequiredFields)
    {
        oTemplate.SetProperty(itemField, oRequiredFields[itemField]);
    }

    return oTemplate;
}

function getDevelopmentObjectConfig(xObject) {
    if (xObject == undefined || xObject == null || xObject == "") {
        return [];
    }

    iObjectID = OptInt(xObject);

    if (iObjectID != undefined) {
        xObject = tools.open_doc(iObjectID);

        if (xObject == undefined) {
            return [];
        }
        xObject = xObject.TopElem;
    }

    if (xObject.Name == "task") {
        iObjectID = OptInt(xObject.target_object_id.Value);

        if(iObjectID != undefined) {
            xObject = tools.open_doc(iObjectID).TopElem;
        } else {
            toLog("ERROR: getDevelopmentObjectConfig (xObject - Task; target_object_id - not correct): iObjectID: [" + iObjectID + "]\r\nxObject:\r\n" + xObject.Xml)

            return [];
        }
    }

    try {
        var sObjectLimitsJSON = xObject.custom_elems.ObtainChildByKey('developer_object_limits_json').value;
    } catch(err) {
        var sObjectLimitsJSON = "";
        toLog("ERROR: getDevelopmentObjectConfig:\r\n" + err + "\r\n\r\niObjectID: [" + iObjectID + "]\r\nxObject:\r\n" + xObject.Xml)
    }

    if(sObjectLimitsJSON == "") {
        return [];
    }

    var arrObjectLimits = ParseJson(sObjectLimitsJSON);

    if(ArrayCount(arrObjectLimits) > 0) {
        for (_tmp in arrObjectLimits) {
            if (!_tmp.HasProperty("opt")) {
                _tmp.SetProperty("opt",0);
            }
        }
        return arrObjectLimits;
    } else {
        return [];
    }
}

function getSupplementaryQuestionsObjectConfig(xObject) {
    if(xObject == undefined || xObject == null || xObject == "")
        return [];

    iObjectID = OptInt(xObject);
    if(iObjectID != undefined)
    {
        xObject = tools.open_doc(iObjectID);
        if (xObject == undefined)
        {
            return [];
        }
        xObject = xObject.TopElem;
    }
    try
    {
        if(xObject.Name == "task")
        {
            iObjectID = OptInt(xObject.target_object_id.Value);
            if(iObjectID != undefined)
            {
                xObject = tools.open_doc(iObjectID);
                if (xObject == undefined)
                {
                    return [];
                }
                xObject = xObject.TopElem;
            }
            else
            {
                toLog("ERROR: getSupplementaryQuestionsObjectConfig (xObject - Task; target_object_id - not correct): iObjectID: [" + iObjectID + "]\r\nxObject:\r\n" + xObject.Xml)
                return [];
            }
        }
    }
    catch(_no_obj_xml_)
    {
        toLog("ERROR: getSupplementaryQuestionsObjectConfig (xObject - ???): iObjectID: [" + xObject + "]")
        return [];
    }

    try
    {
        var sObjectLimitsJSON = xObject.custom_elems.ObtainChildByKey('supplementary_question_limits_json').value;
    }
    catch(err)
    {
        var sObjectLimitsJSON = "";
        toLog("ERROR: getSupplementaryQuestionsObjectConfig:\r\n" + err + "\r\n\r\niObjectID: [" + iObjectID + "]\r\nxObject:\r\n" + xObject.Xml)
    }

    if(sObjectLimitsJSON == "")
        return [];

    var arrObjectLimits = ParseJson(sObjectLimitsJSON);

    if(ArrayCount(arrObjectLimits) > 0)
        return arrObjectLimits;
    else
        return [];

}

function getCustomFieldsObjectConfig(xObject) {
    if(xObject == undefined || xObject == null || xObject == "")
        return [];

    iObjectID = OptInt(xObject);
    if(iObjectID != undefined)
    {
        xObject = tools.open_doc(iObjectID);
        if (xObject == undefined)
        {
            return [];
        }
        xObject = xObject.TopElem;
    }
    var sarrCustomFields = "";
    var arrCustomFields = [];

    try
    {
        sarrCustomFields = xObject.custom_elems.ObtainChildByKey('tysk_type_custom_field').value;
        arrCustomFields = tools.read_object(sarrCustomFields);
    }
    catch(err)
    {
        toLog("ERROR: CustomFields:\r\n" + err + "\r\n\r\niObjectID: [" + iObjectID + "]\r\nsarrCustomFields:\r\n" + sarrCustomFields);
        return [];
    }

    if(ArrayCount(arrCustomFields) > 0)
        return arrCustomFields;
    else
        return [];

}

function getDevelopmentMethodChildScales(xDevelopmentObjectsArg, xTopObjectDocArg, bHasCompetenceInCurProfileArg, itemCurCompetenceInProfileXmlArg, bUseKnowledge, bFlagCourseFromProgram) {
    var arrScales = [];
    var arrCurScale = {};
    var itemCurCompetenceDoc = undefined;
    var sCurTaskObjectCatalog, sCurTaskObjectCatalogTitle, sElementIDsInCurComp;
    var sWhereFilter = "";

    var curName = xDevelopmentObjectsArg.ChildExists("name") ? xDevelopmentObjectsArg.name : (xDevelopmentObjectsArg.ChildExists("title") ? xDevelopmentObjectsArg.title : xDevelopmentObjectsArg.code);

    var arrDevelopmentObjectConfig  = getDevelopmentObjectConfig(xDevelopmentObjectsArg);
    var arrDevelopmentObjectConfigTargetType = ArraySelect(arrDevelopmentObjectConfig, "This.is_target_task");
    var arrDevelopmentObjectConfigTaskType = ArraySelect(arrDevelopmentObjectConfig, "!This.is_target_task");

    if(ArrayOptFirstElem(arrDevelopmentObjectConfigTargetType) != undefined)
    {
        for(itemDevelopmentObject in arrDevelopmentObjectConfigTargetType)
        {
            sCurTaskObjectCatalog = String(itemDevelopmentObject.object_name);
            sCurTaskObjectCatalogTitle = String(itemDevelopmentObject.object_title);

            //arrCurScale = {"task_type": sCurTaskObjectCatalog, "task_title": sCurTaskObjectCatalogTitle, "is_by_category": itemDevelopmentObject.is_by_category, "scale": [{id:0,name:"-"}]};
            arrCurScale = {
                "task_type": sCurTaskObjectCatalog,
                "task_title": sCurTaskObjectCatalogTitle,
                "is_by_category": itemDevelopmentObject.is_by_category,
                "scale": [],
                "cat_level": itemDevelopmentObject.GetOptProperty("cat_level",""),
                "in_control": itemDevelopmentObject.GetOptProperty("in_control","")
            };
            sElementIDsInCurComp = "";

            if(sCurTaskObjectCatalog != "task" && !tools_web.is_true(itemDevelopmentObject.is_by_category))
            {
                if(xTopObjectDocArg == null)
                {
                    switch(sCurTaskObjectCatalog)
                    {
                        case "education_method" :
                            arrCurScale.scale = ArrayExtract(XQuery("for $obj in education_methods where $obj/type!='course' return $obj"),"({'id': String(This.id.Value), 'name': (This.ChildExists('name') ? This.name.Value : ( This.ChildExists('title') ? This.title.Value : ( This.ChildExists('code') ? This.code.Value : '' ) ) ) })");
                            break;
                        default :
                            arrCurScale.scale = ArrayExtract(XQuery("for $obj in " + sCurTaskObjectCatalog + "s return $obj"),"({'id': String(This.id.Value), 'name': (This.ChildExists('name') ? This.name.Value : ( This.ChildExists('title') ? This.title.Value : ( This.ChildExists('code') ? This.code.Value : '' ) ) ) })");
                            if (sCurTaskObjectCatalog == "course" && bFlagCourseFromProgram)
                            {
                                arrCurScale.scale = ArrayExtract(XQuery("for $obj in education_methods where $obj/type='course' return $obj"),"({'id': String(This.id.Value), 'name': (This.ChildExists('name') ? This.name.Value : ( This.ChildExists('title') ? This.title.Value : ( This.ChildExists('code') ? This.code.Value : '' ) ) ) })");
                            }
                            break;
                    }
                }
                else
                {
                    if (bUseKnowledge && xTopObjectDocArg != null && xTopObjectDocArg.TopElem.Name == "competence")
                    {
                        _aKnowIds = ArrayMerge(xTopObjectDocArg.TopElem.knowledge_parts, "OptInt(This.knowledge_part_id, 0)", ",");
                        if ( _aKnowIds != "" )
                        {
                            if (sCurTaskObjectCatalog == "course" && bFlagCourseFromProgram)
                            {
                                xarrEducationMethods = XQuery("for $obj in education_methods where $obj/type='course' return $obj");
                                _aItemCtlgs = tools.xquery("for $elem in knowledge_objects where $elem/catalog = 'education_method' and MatchSome($elem/knowledge_part_id,(" + _aKnowIds +")) and MatchSome($elem/object_id,(" + ArrayMerge(xarrEducationMethods, 'This.id', ',') +")) return $elem");

                            }
                            else
                            {
                                _aItemCtlgs = tools.xquery("for $elem in knowledge_objects where $elem/catalog = '" + sCurTaskObjectCatalog + "' and MatchSome($elem/knowledge_part_id,(" + _aKnowIds +")) return $elem");
                            }

                            arrCurScale.scale = [];
                            for (_oItemCtl in _aItemCtlgs)
                            {
                                _oTmpScale = { "id": String(_oItemCtl.object_id.Value), "name": _oItemCtl.object_name.Value, "desc": "" };
                                _oTmpScaleDoc = tools.open_doc( _oItemCtl.object_id );
                                if ( _oTmpScaleDoc != undefined )
                                {
                                    if ( _oTmpScaleDoc.TopElem.ChildExists( "comment" ) )
                                    {
                                        _oTmpScale.SetProperty( "desc", _oTmpScaleDoc.TopElem.comment.Value );
                                    }
                                }
                                arrCurScale.scale.push( _oTmpScale );
                            }
                        }
                    }
                    else
                    {
                        switch(sCurTaskObjectCatalog)
                        {
                            case "education_method" :
                                if(bHasCompetenceInCurProfileArg)
                                {
                                    if (itemCurCompetenceInProfileXmlArg != undefined)
                                    {
                                        sElementIDsInCurComp = ArrayMerge(itemCurCompetenceInProfileXmlArg.education_methods, "This.education_method_id", ",");
                                    }

                                    if (sElementIDsInCurComp == "")
                                    {
                                        if (xTopObjectDocArg != undefined && xTopObjectDocArg.TopElem.Name == "competence")
                                        {
                                            arrSummElementInComp = [];
                                            for (itemLevelInComp in xTopObjectDocArg.TopElem.levels)
                                            {
                                                arrSummElementInComp = ArrayUnion(arrSummElementInComp, itemLevelInComp.education_methods);
                                            }
                                            sElementIDsInCurComp = ArrayMerge(arrSummElementInComp, "This.education_method_id", ",");
                                        }
                                    }
                                }

                                if (sElementIDsInCurComp != "")
                                {
                                    arrCurScale.scale = ArrayExtract(XQuery("for $obj in education_methods where $obj/type!='course' and MatchSome($obj/id,(" + sElementIDsInCurComp + ")) return $obj"),"({'id': String(This.id.Value), 'name': This.name.Value, 'desc': tools.open_doc(This.id).TopElem.comment.Value})");
                                }
                                break;
                            case "course" :
                                sElementIDsInCurComp = "";
                                if(bHasCompetenceInCurProfileArg)
                                {
                                    if (itemCurCompetenceInProfileXmlArg != undefined)
                                    {
                                        sElementIDsInCurComp = ArrayMerge(itemCurCompetenceInProfileXmlArg.education_methods, "This.education_method_id", ",");
                                    }
                                    if (sElementIDsInCurComp == "")
                                    {
                                        if (xTopObjectDocArg != undefined && xTopObjectDocArg.TopElem.Name == "competence")
                                        {
                                            arrSummElementInComp = [];
                                            for (itemLevelInComp in xTopObjectDocArg.TopElem.levels)
                                            {
                                                arrSummElementInComp = ArrayUnion(arrSummElementInComp, itemLevelInComp.education_methods);
                                            }
                                            sElementIDsInCurComp = ArrayMerge(arrSummElementInComp, "This.education_method_id", ",");
                                        }
                                    }
                                }
                                if (sElementIDsInCurComp != "")
                                {
                                    arrCurScale.scale = ArrayExtract(XQuery("for $obj in education_methods where $obj/type='course' and MatchSome($obj/id,(" + sElementIDsInCurComp + ")) return $obj"),"({'id': String(This.course_id.Value), 'name': This.name.Value, 'desc': tools.open_doc(This.id).TopElem.comment.Value})");
                                }
                                break;
                            case "event" :
                                sElementIDsInCurComp = "";
                                if(bHasCompetenceInCurProfileArg)
                                {
                                    if (itemCurCompetenceInProfileXmlArg!=undefined)
                                    {
                                        sElementIDsInCurComp = ArrayMerge(itemCurCompetenceInProfileXmlArg.education_methods, "This.education_method_id", ",");
                                    }
                                    if (sElementIDsInCurComp=="")
                                    {
                                        if (xTopObjectDocArg!=undefined && xTopObjectDocArg.TopElem.Name == "competence")
                                        {
                                            arrSummElementInComp = [];
                                            for (itemLevelInComp in xTopObjectDocArg.TopElem.levels)
                                            {
                                                arrSummElementInComp = ArrayUnion(arrSummElementInComp, itemLevelInComp.education_methods);
                                            }
                                            sElementIDsInCurComp = ArrayMerge(arrSummElementInComp, "This.education_method_id", ",");
                                        }
                                    }
                                }
                                if (sElementIDsInCurComp!="")
                                {
                                    arrCurScale.scale = ArrayExtract(XQuery("for $obj in events where $obj/status_id='plan' and $obj/start_date>=date('" + StrDate(Date(),false,false) + "') and MatchSome($obj/education_method_id,(" + sElementIDsInCurComp + ")) return $obj"),"({'id': String(This.id.Value), 'name': This.name.Value, 'desc': tools.open_doc(This.id).TopElem.comment.Value})");
                                }
                                break;
                            case "assessment" :
                                sElementIDsInCurComp = "";
                                if(bHasCompetenceInCurProfileArg)
                                {
                                    if (xTopObjectDocArg != undefined && xTopObjectDocArg.TopElem.Name == "competence")
                                    {
                                        arrSummElementInComp = [];
                                        for (itemLevelInComp in xTopObjectDocArg.TopElem.levels)
                                        {
                                            arrSummElementInComp = ArrayUnion(arrSummElementInComp, itemLevelInComp.assessments);
                                        }
                                        sElementIDsInCurComp = ArrayMerge(arrSummElementInComp, "This.assessment_id", ",");
                                    }
                                }

                                if (sElementIDsInCurComp!="")
                                {
                                    arrCurScale.scale = ArrayExtract(XQuery("for $obj in assessments where MatchSome($obj/id,(" + sElementIDsInCurComp + ")) return $obj"),"({'id': String(This.id.Value), 'name': This.title.Value, 'desc': tools.open_doc(This.id).TopElem.comment.Value})");
                                }
                                break;
                            default :
                                arrCurScale.scale = ArrayExtract(XQuery("for $obj in " + sCurTaskObjectCatalog + "s return $obj"),"({'id': String(This.id.Value), 'name': (This.ChildExists('name') ? This.name.Value : ( This.ChildExists('title') ? This.title.Value : ( This.ChildExists('code') ? This.code.Value : '' ) ) ) })");
                                break;
                        }
                    }
                }
            }
            arrScales.push(arrCurScale);
        }
    }
    else if(ArrayOptFirstElem(arrDevelopmentObjectConfigTaskType) != undefined)
    {
        arrCurScale = {"task_type": "task", "task_title": i18n.t( 'zadacha' ), "is_by_category": false, "scale": ArrayExtract(arrDevelopmentObjectConfigTaskType, "({'id': String(This.object_name),  'name': This.object_title})")};
        arrScales.push(arrCurScale);
    }
    toLog("***FULL " + curName + " ---> " + tools.object_to_text(arrScales, "json"), null, false);

    return arrScales
}

function getSupplementaryQuestionsChildScales(xDevelopmentObjectsArg, xTopObjectDocArg, bHasCompetenceInCurProfileArg, itemCurCompetenceInProfileXmlArg) {
    var arrScales = [];
    var arrCurScale = {};
    var itemCurCompetenceDoc = undefined;
    var sCurTaskObjectCatalog, sCurTaskObjectCatalogTitle, sElementIDsInCurComp;
    var sWhereFilter = "";

    var curName = xDevelopmentObjectsArg.ChildExists("name") ? xDevelopmentObjectsArg.name : (xDevelopmentObjectsArg.ChildExists("title") ? xDevelopmentObjectsArg.title : xDevelopmentObjectsArg.code);

    var arrDevelopmentObjectConfig  = getSupplementaryQuestionsObjectConfig(xDevelopmentObjectsArg);
    var arrDevelopmentObjectConfigTargetType = ArraySelect(arrDevelopmentObjectConfig, "This.is_target_task");
    var arrDevelopmentObjectConfigTaskType = ArraySelect(arrDevelopmentObjectConfig, "!This.is_target_task");

    if(ArrayOptFirstElem(arrDevelopmentObjectConfigTargetType) != undefined)
    {
        for(itemDevelopmentObject in arrDevelopmentObjectConfigTargetType)
        {
            sCurTaskObjectCatalog = String(itemDevelopmentObject.object_name);
            sCurTaskObjectCatalogTitle = String(itemDevelopmentObject.object_title);

            //arrCurScale = {"task_type": sCurTaskObjectCatalog, "task_title": sCurTaskObjectCatalogTitle, "is_by_category": itemDevelopmentObject.is_by_category, "scale": [{id:0,name:"-"}]};
            arrCurScale = {"task_type": sCurTaskObjectCatalog, "task_title": sCurTaskObjectCatalogTitle, "is_by_category": itemDevelopmentObject.is_by_category, "scale": []};
            sElementIDsInCurComp = "";

            if(sCurTaskObjectCatalog != "task" && !tools_web.is_true(itemDevelopmentObject.is_by_category))
            {
                if(xTopObjectDocArg == null)
                {
                    switch(sCurTaskObjectCatalog)
                    {
                        case "education_method" :
                            arrCurScale.scale = ArrayExtract(XQuery("for $obj in education_methods where $obj/type!='course' return $obj"),"({'id': String(This.id.Value), 'name': (This.ChildExists('name') ? This.name.Value : ( This.ChildExists('title') ? This.title.Value : ( This.ChildExists('code') ? This.code.Value : '' ) ) ) })");
                            break;
                        default :
                            arrCurScale.scale = ArrayExtract(XQuery("for $obj in " + sCurTaskObjectCatalog + "s return $obj"),"({'id': String(This.id.Value), 'name': (This.ChildExists('name') ? This.name.Value : ( This.ChildExists('title') ? This.title.Value : ( This.ChildExists('code') ? This.code.Value : '' ) ) ) })");
                            break;
                    }
                }
                else
                {
                    switch(sCurTaskObjectCatalog)
                    {
                        case "education_method" :
                            if(bHasCompetenceInCurProfileArg)
                            {
                                if (itemCurCompetenceInProfileXmlArg != undefined)
                                {
                                    sElementIDsInCurComp = ArrayMerge(itemCurCompetenceInProfileXmlArg.education_methods, "This.education_method_id", ",");
                                }

                                if (sElementIDsInCurComp == "")
                                {
                                    if (xTopObjectDocArg != undefined && xTopObjectDocArg.TopElem.Name == "competence")
                                    {
                                        arrSummElementInComp = [];
                                        for (itemLevelInComp in xTopObjectDocArg.TopElem.levels)
                                        {
                                            arrSummElementInComp = ArrayUnion(arrSummElementInComp, itemLevelInComp.education_methods);
                                        }
                                        sElementIDsInCurComp = ArrayMerge(arrSummElementInComp, "This.education_method_id", ",");
                                    }
                                }
                            }

                            if (sElementIDsInCurComp != "")
                            {
                                arrCurScale.scale = ArrayExtract(XQuery("for $obj in education_methods where $obj/type!='course' and MatchSome($obj/id,(" + sElementIDsInCurComp + ")) return $obj"),"({'id': String(This.id.Value), 'name': This.name.Value})");
                            }
                            break;
                        case "course" :
                            sElementIDsInCurComp = "";
                            if(bHasCompetenceInCurProfileArg)
                            {
                                if (itemCurCompetenceInProfileXmlArg != undefined)
                                {
                                    sElementIDsInCurComp = ArrayMerge(itemCurCompetenceInProfileXmlArg.education_methods, "This.education_method_id", ",");
                                }
                                if (sElementIDsInCurComp == "")
                                {
                                    if (xTopObjectDocArg != undefined && xTopObjectDocArg.TopElem.Name == "competence")
                                    {
                                        arrSummElementInComp = [];
                                        for (itemLevelInComp in xTopObjectDocArg.TopElem.levels)
                                        {
                                            arrSummElementInComp = ArrayUnion(arrSummElementInComp, itemLevelInComp.education_methods);
                                        }
                                        sElementIDsInCurComp = ArrayMerge(arrSummElementInComp, "This.education_method_id", ",");
                                    }
                                }
                            }
                            if (sElementIDsInCurComp != "")
                            {
                                arrCurScale.scale = ArrayExtract(XQuery("for $obj in education_methods where $obj/type='course' and MatchSome($obj/id,(" + sElementIDsInCurComp + ")) return $obj"),"({'id': String(This.course_id.Value), 'name': This.name.Value})");
                            }
                            break;
                        case "event" :
                            sElementIDsInCurComp = "";
                            if(bHasCompetenceInCurProfileArg)
                            {
                                if (itemCurCompetenceInProfileXmlArg!=undefined)
                                {
                                    sElementIDsInCurComp = ArrayMerge(itemCurCompetenceInProfileXmlArg.education_methods, "This.education_method_id", ",");
                                }
                                if (sElementIDsInCurComp=="")
                                {
                                    if (xTopObjectDocArg!=undefined && xTopObjectDocArg.TopElem.Name == "competence")
                                    {
                                        arrSummElementInComp = [];
                                        for (itemLevelInComp in xTopObjectDocArg.TopElem.levels)
                                        {
                                            arrSummElementInComp = ArrayUnion(arrSummElementInComp, itemLevelInComp.education_methods);
                                        }
                                        sElementIDsInCurComp = ArrayMerge(arrSummElementInComp, "This.education_method_id", ",");
                                    }
                                }
                            }
                            if (sElementIDsInCurComp!="")
                            {
                                arrCurScale.scale = ArrayExtract(XQuery("for $obj in events where $obj/status_id='plan' and $obj/start_date>=date('" + StrDate(Date(),false,false) + "') and MatchSome($obj/education_method_id,(" + sElementIDsInCurComp + ")) return $obj"),"({'id': String(This.id.Value), 'name': This.name.Value})");
                            }
                            break;
                        case "assessment" :
                            sElementIDsInCurComp = "";
                            if(bHasCompetenceInCurProfileArg)
                            {
                                if (xTopObjectDocArg != undefined && xTopObjectDocArg.TopElem.Name == "competence")
                                {
                                    arrSummElementInComp = [];
                                    for (itemLevelInComp in xTopObjectDocArg.TopElem.levels)
                                    {
                                        arrSummElementInComp = ArrayUnion(arrSummElementInComp, itemLevelInComp.assessments);
                                    }
                                    sElementIDsInCurComp = ArrayMerge(arrSummElementInComp, "This.assessment_id", ",");
                                }
                            }

                            if (sElementIDsInCurComp!="")
                            {
                                arrCurScale.scale = ArrayExtract(XQuery("for $obj in assessments where MatchSome($obj/id,(" + sElementIDsInCurComp + ")) return $obj"),"({'id': String(This.id.Value), 'name': This.title.Value})");
                            }
                            break;
                        default :
                            arrCurScale.scale = ArrayExtract(XQuery("for $obj in " + sCurTaskObjectCatalog + "s return $obj"),"({'id': String(This.id.Value), 'name': (This.ChildExists('name') ? This.name.Value : ( This.ChildExists('title') ? This.title.Value : ( This.ChildExists('code') ? This.code.Value : '' ) ) ) })");
                            break;
                    }
                }
            }
            arrScales.push(arrCurScale);
        }
    }
    else if(ArrayOptFirstElem(arrDevelopmentObjectConfigTaskType) != undefined)
    {
        arrCurScale = {"task_type": "task", "task_title": i18n.t( 'zadacha' ), "is_by_category": false, "scale": ArrayExtract(arrDevelopmentObjectConfigTaskType, "({'id': String(This.object_name),  'name': This.object_title})")};
        arrScales.push(arrCurScale);
    }
    toLog("***FULL " + curName + " ---> " + tools.object_to_text(arrScales, "json"), null, false);

    return arrScales
}

function getWFParamTemplate(sTemlpateID, oParam) {
    if(oParam == undefined)
    {
        oParam = {"sCompetenceViewType": "select", "bCompetencesAllowChange": true};
    }
    if ( oParam.GetOptProperty("sCompetenceViewType") == undefined )
    {
        oParam.SetProperty("sCompetenceViewType", "select");
    }
    if ( oParam.GetOptProperty("bCompetencesAllowChange") == undefined )
    {
        oParam.SetProperty("bCompetencesAllowChange", true);
    }
    curState = oParam.GetOptProperty( "curState", "" );
    sCancelState = oParam.GetOptProperty( "sCancelState", "" );


    var oTemplateObject = {
        "competence":
            {
                instruction: {
                    label:"",
                    visible: true,
                    visible_in: "form"
                },
                name: {
                    label: i18n.t( 'kompetenciya' ),
                    visible: true,
                    visible_in: "title",
                    editable: false,
                    required: false,
                    control_type: "text"
                },
                name_title: {
                    label: i18n.t( 'kompetenciya' ),
                    visible: false,
                    visible_in: "title",
                    editable: false,
                    required: false,
                    control_type: "text"
                },
                section: {
                    label: oParam.GetOptProperty("sDescSectionName",""),
                    control_type: "group",
                    visible: oParam.GetOptProperty("bShowDescInSection",false),
                    visible_in: "view",
                    expand_in: ""
                },
                richtext: {
                    label:"",
                    visible: false,
                    visible_in: "form;view",
                    group: "section"
                },
                competence_id: {
                    label: i18n.t( 'kompetenciya' ),
                    visible: oParam.sCompetenceViewType == 'select',
                    visible_in: "form",
                    editable: oParam.bCompetencesAllowChange,
                    required: oParam.sCompetenceViewType == 'select',
                    control_type: "select",
                    data_src: "competences",
                    placeholder: i18n.t( 'vyberitekompet' )
                },
                development_method_id: {
                    label: "--fake--",
                    visible: false,
                    visible_in: "form",
                    editable: false,
                    required: false,
                    control_type: "number",
                    "default": ""
                },

                is_select: {
                    label: "",
                    visible: oParam.sCompetenceViewType == 'check',
                    visible_in: "form",
                    editable: oParam.bCompetencesAllowChange,
                    required: false,
                    control_type: "checkbox",
                    scale: {value: [{id:"true" , name:i18n.t( 'vybranadlyarazv_1' ) }]}
                },
                can_add_child: oParam.bCompetencesAllowChange,
                can_delete: oParam.bCompetencesAllowChange,
                can_translate: false,
                buttons : [{"action": "add", "title": i18n.t( 'dobavitrazviva' )}],
                window_title: i18n.t( 'newelement' )
            },
        "development_method":
            {
                instruction: {
                    label:i18n.t( 'centerbvyberit' ),
                    visible: true,
                    visible_in: "form"
                },
                name: {
                    label: i18n.t( 'sposobrazvitiya' ),
                    visible: true,
                    visible_in: "title",
                    editable: false,
                    required: false,
                    control_type: "text"
                },
                name_title: {
                    label: i18n.t( 'sposobrazvitiya' ),
                    visible: false,
                    visible_in: "title",
                    editable: false,
                    required: false,
                    control_type: "text"
                },
                section: {
                    label: oParam.GetOptProperty("sDescSectionName",""),
                    control_type: "group",
                    visible: oParam.GetOptProperty("bShowDescInSection",false),
                    visible_in: "view",
                    expand_in: ""
                },
                richtext: {
                    "label":"",
                    visible: true,
                    visible_in: "view;form",
                    group: "section"
                },
                development_method_id: {
                    label: i18n.t( 'sposobrazvitiya' ),
                    visible: oParam.bCompetencesAllowChange,
                    visible_in: "form",
                    editable: true,
                    required: true,
                    control_type: "select",
                    data_src: "",
                    scale: {value:[]},
                    placeholder: i18n.t( 'vyberitesposob' )
                },
                can_add_child: oParam.bCompetencesAllowChange,
                can_delete: oParam.bCompetencesAllowChange,
                can_translate: false,
                window_title: i18n.t( 'newelement' )
            },
        "development_task":
            {
                instruction: {
                    label:( oParam.bCompetencesAllowChange?oParam.GetOptProperty("sDescNewDev",""):(i18n.t( 'centerbinforma' ) )),
                    visible: true,
                    visible_in: "form"
                },
                /*
                task_type: {
                    label: i18n.t( 'tip' ),
                    visible: true,
                    visible_in: "view;form",
                    editable: true,
                    required: false,
                    data_src: "task_type",
                    control_type: "select"
                },
                */
                richtext: {
                    "label":"",
                    visible: false,
                    visible_in: "form"
                },
                name: {
                    label: i18n.t( 'zadacha' ),
                    visible: true,
                    visible_in: "title",
                    editable: true,
                    required: false,
                    control_type: "text"
                },
                name_title: {
                    label: i18n.t( 'zadacha' ),
                    visible: false,
                    visible_in: "title",
                    editable: false,
                    required: false,
                    control_type: "text"
                },
                url: {
                    label: i18n.t( 'razvivayusheedey' ),
                    visible: false,
                    visible_in: "view",
                    editable: false,
                    required: false,
                    control_type: "url"
                },
                development_task_catalog: {
                    label: "",
                    visible: false,
                    visible_in: "form",
                    editable: true,
                    required: false,
                    control_type: "select",
                    data_src: null,
                    placeholder: i18n.t( 'vyberitekatego' )
                },
                development_task_id: {
                    label: i18n.t( 'razvivayusheedey' ),
                    visible: oParam.bCompetencesAllowChange,
                    visible_in: "form",
                    editable: true,
                    required: true,
                    control_type: "select",
                    data_src: null,
                    scale: {value:[]},
                    placeholder: i18n.t( 'vyberiterazviv' )
                },
                /*			plan: {
				label: i18n.t( 'ozhidaemyyrezul' ),
				visible: true,
				visible_in: "view;form",
				editable: true,
				required: true,
				control_type: "textarea"
			},
			date_plan: {
				label: i18n.t( 'planovyysrok' ),
				visible: true,
				visible_in: "view;form",
				editable: true,
				required: true,
				control_type: "date"
			},
*/			can_add_child: false,
                can_delete: oParam.bCompetencesAllowChange,
                can_translate: false,
                window_title: i18n.t( 'newelement' )
            },
        "multiple":
            {
                instruction: {
                    label:"",
                    visible: false,
                    visible_in: "form"
                },
                task_type: {
                    label: i18n.t( 'tip' ),
                    visible: true,
                    visible_in: "view",
                    editable: false,
                    required: false,
                    control_type: "text"
                },
                name: {
                    label: i18n.t( 'razvivayushiedey' ),
                    visible: true,
                    visible_in: "title,view",
                    editable: false,
                    required: false,
                    control_type: "text"
                },
                name_title: {
                    label: i18n.t( 'razvivayushiedey' ),
                    visible: false,
                    visible_in: "title",
                    editable: false,
                    required: false,
                    control_type: "text"
                },
                url: {
                    label: i18n.t( 'razvivayusheedey' ),
                    visible: false,
                    visible_in: "view",
                    editable: false,
                    required: false,
                    control_type: "url"
                },
                richtext: {
                    "label":"",
                    visible: false,
                    visible_in: "form;view"
                },
                development_task_id: {
                    label: "",
                    visible: false,
                    visible_in: "form",
                    editable: false,
                    required: false,
                    data_src: null,
                    control_type: "text"
                },
                type: {
                    label: "",
                    visible: false,
                    visible_in: "form",
                    editable: false,
                    required: false,
                    control_type: "text",
                    "default": "group"
                },
                can_add_child: false,
                can_delete: false,
                can_translate: false
            },
        "notasktype":
            {
                type: {
                    label: "",
                    visible: false,
                    visible_in: "form",
                    editable: false,
                    required: false,
                    control_type: "text",
                    "default": "group"
                }
            },
        "field4multiple":
            {
                label: "",
                visible: true,
                visible_in: "form",
                editable: true,
                required: false,
                control_type: "list",
                data_src: null,
                scale: {value:[]}
//			placeholder: i18n.t( 'vyberiterazviv' )
        },
        "fieldradiomultiple":
            {
                label: "",
                visible: true,
                visible_in: "form",
                editable: true,
                required: false,
                control_type: "radio",
                layout: "col",
                data_src: null,
                scale: {value:[]}
            },
        "set_category_field":
            {
                label: "",
                visible: true,
                visible_in: "form",
                editable: true,
                required: false,
                control_type: "select",
                data_src: null,
                placeholder: i18n.t( 'vyberitekatego' )

            },
        "set_other_checkbox" : {
            set_other_checkbox: {
                label: "",
                visible: true,
                visible_in: "form",
                editable: true,
                required: false,
                control_type: "checkbox",
                scale: {value: [ {id:"true" , name: (oParam.GetOptProperty("sHasOtherScale",i18n.t( 'drugoe' ))) } ] },
                "default": ""
            },
            set_other_text: {
                label: i18n.t( 'drugoe' ),
                visible: false,
                visible_in: "form",
                editable: true,
                required: false,
                control_type: "text"
            },
            set_other_plan: {
                label: i18n.t( 'obosnovanie' ),
                visible: false,
                visible_in: "form",
                editable: true,
                required: false,
                control_type: "textarea"
            }
        },
        "required":
            {
                plan: {
                    label: i18n.t( 'ozhidaemyyrezul' ),
                    visible: true,
                    visible_in: "view;form",
                    editable: true,
                    required: true,
                    control_type: "textarea"
                },
                date_plan: {
                    label: i18n.t( 'planovyysrok' ),
                    visible: true,
                    visible_in: "view;form",
                    editable: true,
                    required: true,
                    control_type: "date"
                }
            },
        "task_flag_cancel":
            {
                flag_cancel: {
                    label: "",
                    visible: (curState!="set"),
                    visible_in: "form",
                    editable: (sCancelState == "all" || sCancelState == "" || curState == sCancelState),
                    required: false,
                    control_type: "checkbox",
                    scale: {value: [ {id:"true" , name:i18n.t( 'neaktualnootme' ) } ] }
                }
            },
        "status_mark":
            {
                status_mark: {
                    label: i18n.t( 'status' ),
                    visible: true,
                    visible_in: "view;form",
                    editable: true,
                    required: false,
                    control_type: "select",
                    data_src: null,
                    scale: {value:[]},
                    placeholder: "----"
                },
                date_fact: {
                    label: i18n.t( 'datavypolneniya' ),
                    visible: false,
                    visible_in: "view;form",
                    editable: false,
                    required: false,
                    control_type: "date"
                },
                mark_self: {
                    label: i18n.t( 'ocencasotrud' ),
                    visible: false,
                    visible_in: "view",
                    editable: false,
                    required: false,
                    control_type: "text",
                },
                mark_manager: {
                    label: i18n.t( 'ocencarukovod' ),
                    visible: false,
                    visible_in: "view",
                    editable: false,
                    required: false,
                    control_type: "text",
                },
                mark_expert: {
                    label: i18n.t( 'ocencaexpert' ),
                    visible: false,
                    visible_in: "view",
                    editable: false,
                    required: false,
                    control_type: "text",
                }
            },
        "fieldSupplementaryQuestions":
            {
                label: "",
                visible: true,
                visible_in: "form",
                editable: true,
                required: false,
                control_type: "textarea"
            },
        "CustomFields": {},
        "none": {}
    };

    if ( sTemlpateID == "required" && oParam.GetOptProperty("sId")!=undefined )
    {
        vObj = {};
        vMp = {
            label: i18n.t( 'obosnovanievyb' ),
            visible: true,
            visible_in: "form",
            editable: true,
            required: true,
            control_type: "textarea"
        };
        vObj.SetProperty("plan_" + oParam.GetOptProperty("sId"), vMp);
        oTemplateObject.SetProperty(sTemlpateID, vObj);
    }

    return getCopyObjectByValue(oTemplateObject.GetOptProperty(sTemlpateID));

}

function getarrCustomFields(arrCustomFields) {
    oTemp = {};
    for( _feild in arrCustomFields )
    {
        switch(String(_feild.type))
        {
            case 'text':
                oTemp.AddProperty(_feild.code,
                    {
                        label: _feild.name,
                        visible: true,
                        visible_in: "view;form",
                        editable: true,
                        required: tools_web.is_true(_feild.required),
                        control_type: "text"
                    });
                break;
            case 'textarea':
                oTemp.AddProperty(_feild.code,
                    {
                        label: _feild.name,
                        visible: true,
                        visible_in: "view;form",
                        editable: true,
                        required: tools_web.is_true(_feild.required),
                        control_type: "textarea"
                    });
                break;
            case 'date':
                oTemp.AddProperty(_feild.code,
                    {
                        label: _feild.name,
                        visible: true,
                        visible_in: "view;form",
                        editable: true,
                        required: tools_web.is_true(_feild.required),
                        control_type: "date"
                    });
                break;
            case 'select':
                oTemp.AddProperty(_feild.code,
                    {
                        label: _feild.name,
                        visible: true,
                        visible_in: "view;form",
                        editable: true,
                        required: tools_web.is_true(_feild.required),
                        control_type: "select",
                        scale: _field.entries
                    });
                break;
        }
    }
    return oTemp;
}

function getTaskTypeConfig(xTask) {
    var iTaskID = OptInt(xTask);
    if(iTaskID != undefined)
    {
        xTask = tools.open_doc(iTaskID).TopElem;
    }

    var xParentTask = xTask.parent_task_id.OptForeignElem;
    if(xParentTask == undefined || xParentTask.target_object_type.Value != "development_method")
        return null;

    arrDevelopmentMethodConfig = getDevelopmentObjectConfig(xParentTask.target_object_id.Value)
    if(ArrayCount(arrDevelopmentMethodConfig) == 0)
        return null;

    oCurDevelopmentMethodConfig = ArrayOptFind(arrDevelopmentMethodConfig, "This.object_name == " + CodeLiteral(xTask.target_object_type.Value));
    if(oCurDevelopmentMethodConfig == undefined)
        return null;
    else
        return oCurDevelopmentMethodConfig;
}

function getSearchAssBoss(_personID, _AssID, _AssDoc, is_add ) {
    try{
        if ( _AssDoc!=undefined && _AssDoc!=null )
        {
            _fldAss = _AssDoc;
        }
        else
        {
            _fldAss = tools.open_doc(OptInt(_AssID,0)).TopElem;
        }
        var sBossType = Trim(tools_app.get_cur_settings("approve_boss_type", "instance", null, null, null, _AssID, _fldAss));
        var iBossType = OptInt(tools_app.get_cur_settings("approve_boss_type_id", "instance", null, null, null, _AssID, _fldAss),undefined);

        var fldBossType = undefined;

        if (is_add && !StrContains(sBossType,"_"))
        {
            return undefined;
        }

        var fldBoss = tools.get_uni_user_boss(_personID);
        var iBossID = undefined;
        if( StrContains(sBossType,'fr') )
        {
            fldBossType = ArrayOptFirstElem(tools.xquery("for $elem in func_managers where $elem/boss_type_id = " + OptInt(iBossType, 0) + " and $elem/catalog = 'collaborator' and $elem/object_id="+_personID + " return $elem"));
            if (fldBossType == undefined)
            {
                _parent_id = OptInt(ArrayOptFirstElem(tools.xquery("for $elem in collaborators where $elem/id = "+_personID + " return $elem"),({position_parent_id: 0})).position_parent_id,0);
                _ip_count = 0;
                _org_id = OptInt(ArrayOptFirstElem(tools.xquery("for $elem in subdivisions where $elem/id = "+_parent_id + " return $elem"),({org_id: 0})).org_id,0);
                while (fldBossType == undefined && _parent_id > 0 && _ip_count < 20)
                {
                    fldBossType = ArrayOptFirstElem(tools.xquery("for $elem in func_managers where $elem/boss_type_id = " + OptInt(iBossType, 0) + " and $elem/catalog = 'subdivision' and $elem/object_id="+_parent_id + " return $elem"));
                    _parent_id = OptInt(ArrayOptFirstElem(tools.xquery("for $elem in subdivisions where $elem/id = "+_parent_id + " return $elem"),({parent_object_id: 0})).parent_object_id,0);
                    _ip_count++;
                    if (_parent_id == 0 && fldBossType == undefined && _org_id > 0)
                    {
                        fldBossType = ArrayOptFirstElem(tools.xquery("for $elem in func_managers where $elem/boss_type_id = " + OptInt(iBossType, 0) + " and $elem/catalog = 'org' and $elem/object_id="+_org_id + " return $elem"));
                    }
                }
            }
        }
        if(sBossType!='' && (!is_add || StrContains(sBossType,"_")))
        {
            _iii = 0;
            for(_boss_type in sBossType.split("_"))
            {
                _iii++;
                if (is_add && _iii==1)
                    continue;
                if( iBossID==undefined )
                {
                    switch(_boss_type)
                    {
                        case "fr":
                            if (fldBossType!=undefined)
                            {
                                iBossID = fldBossType.person_id;
                            }
                            break;
                        case "boss":
                            if (fldBoss!=undefined && fldBoss!=null)
                            {
                                iBossID = fldBoss.id;
                            }
                            break;
                    }
                }
            }
        }
        return iBossID;
    }
    catch(er)
    { return undefined; }
}

function fCheckIsDoneForm(curPAID, docPA) {
    try{
        var iCountSelectedCompetence = 0;
        var iCountTaskSumTotal = 0;
        var arrCountsTaskInCompetences = [];
        var bIsReady = true;
        var bIsDeveloperTaskCountCorrect = true;
        var arrErrorMsg = [];
        var arrWarnMsg = [];
        var bHasIsSelect = false;
        var sCompetenceViewType = tools_app.get_cur_settings("competence_view_type", "instance", null, null, null, curPAID); //Способ выбора развиваемых компетенций
        var arrOmnyDevelopmentMethodIDs = fnStringToArray(tools_app.get_cur_settings("omny_development_method_ids", "instance", null, null, null, curPAID));
        var bOmnyDevelopmentMethodIsOverlay = tools_web.is_true(tools_app.get_cur_settings("omny_development_methods_is_overlay", "instance", null, null, null, curPAID));
        var arrAddObjectiveIDs = fnStringToArray(tools_app.get_cur_settings("add_category_ids", "instance", null, null, null, curPAID));
        var bAddAllDevelopmentMethods = tools_web.is_true(tools_app.get_cur_settings("add_all_dev_methods", "instance", null, null, null, curPAID));
        var bCalculateCompetenceOnly = tools_web.is_true(tools_app.get_cur_settings("is_competence_only", "instance", null, null, null, curPAID));
        var sCommonErrorMessage = tools_app.get_cur_settings("error_message", "instance", null, null, null, curPAID);
        if ( sCommonErrorMessage == "" )
        {
            sCommonErrorMessage = i18n.t( 'nevozmozhnootpr' );
        }

        curPA = docPA.TopElem;
        var arrCurPATasks = ArraySelectAll(XQuery("for $obj in tasks where MatchSome($obj/id,(" + ArrayMerge(curPA.tasks,"This.task_id",",") + ")) return $obj"))
        if (ArrayCount(arrCurPATasks)!=0)
        {
            var iCurCountsTaskInCompetences;
            var arrCurDevelopmentMethodConfigL2 = [];
            var arrCurDevelopmentMethodConfigL3 = [];
            var oCurDevelopmentMethodCountsL2 ={};
            var oCurDevelopmentMethodCountsL3 = {};

            var sAllowedObjectNameTypes = tools_app.get_cur_settings('allowed_object_types', 'app', null, null, null, curPAID);
            var arrAllowedObjectNameTypes = sAllowedObjectNameTypes != '' ? ParseJson(sAllowedObjectNameTypes) : [];
            var oAllDevelopmentTaskTypeCount = {};
            for(itemAllowedObjectNameType in arrAllowedObjectNameTypes)
            {
                oAllDevelopmentTaskTypeCount.SetProperty(itemAllowedObjectNameType.name, 0);
            }

            for (itemObjectiveLev1 in ArraySelect(arrCurPATasks,"This.parent_task_id==null") )
            {
                arrCurDevelopmentMethodConfigL2 = [];
                arrCurDevelopmentMethodConfigL3 = [];
                oCurDevelopmentMethodCountsL2 ={};
                oCurDevelopmentMethodCountsL3 = {};
                itemTaskL1 = ArrayOptFind(arrCurPATasks, "This.id==" + itemObjectiveLev1.id);
                if (itemTaskL1 != undefined)
                {
                    itemTaskTEL1 = tools.open_doc(itemObjectiveLev1.id).TopElem;
                    arrCurDevelopmentMethodConfigL2 = [];
                    oCurDevelopmentMethodCountsL2 = {};
                    target_object_typeL1 = itemTaskL1.target_object_type.Value;
                    if( target_object_typeL1 == "development_method" && !bCalculateCompetenceOnly)
                    {
                        arrCurDevelopmentMethodConfigL2 = ArraySelect(getDevelopmentObjectConfig(itemTaskL1.target_object_id.Value), 'This.is_target_task');
                        for(itemDMConfig in arrCurDevelopmentMethodConfigL2)
                        {
                            oCurDevelopmentMethodCountsL2.SetProperty(itemDMConfig.object_name, 0);
                        }
                    }
                    bIsSelect = (target_object_typeL1 == "competence" && tools_web.is_true(itemTaskTEL1.custom_fields.ObtainChildByKey("is_select").value) && !tools_web.is_true(itemTaskTEL1.custom_fields.ObtainChildByKey("flag_cancel").value) );
                    if(bIsSelect)
                    {
                        bHasIsSelect = true;
                        iCountSelectedCompetence++;
                    }
                }
                if (ArrayCount(ArraySelect(arrCurPATasks,"This.parent_task_id=="+itemObjectiveLev1.id))!=0)
                {
                    if(bIsSelect)
                    {
                        iCurCountsTaskInCompetences = ArrayCount(ArraySelect(arrCurPATasks,"This.parent_task_id==" + itemObjectiveLev1.id + " && tools.open_doc(This.id)!=undefined && !tools_web.is_true(tools.open_doc(This.id).TopElem.custom_fields.ObtainChildByKey('flag_cancel').value)"));
                        arrCountsTaskInCompetences.push({competence_id: OptInt(itemTaskTEL1.custom_fields.ObtainChildByKey("competence_id").value, 0), count: iCurCountsTaskInCompetences})
                        iCountTaskSumTotal += iCurCountsTaskInCompetences
                    }
                    for (itemObjectiveLev2 in ArraySelect(arrCurPATasks,"This.parent_task_id=="+itemObjectiveLev1.id))
                    {
                        itemTaskL2 = ArrayOptFind(arrCurPATasks,"This.id==" + itemObjectiveLev2.id);
                        if (itemTaskL2 != undefined)
                        {
                            if(bIsSelect && !tools_web.is_true(itemTaskL2.status))
                            {
                                bIsReady = false;
                            }
                            itemTaskTEL2 = tools.open_doc(itemObjectiveLev2.id).TopElem;
                            target_object_typeL2 = itemTaskL2.target_object_type.Value;
                            if ( String(target_object_typeL2) == "" && itemTaskTEL2.custom_fields.ObtainChildByKey("task_type").value == i18n.t( 'drugoe' ))
                            {
                                target_object_typeL2 = "education_method";
                            }
                            if(oCurDevelopmentMethodCountsL2.HasProperty(target_object_typeL2) && !tools_web.is_true(itemTaskTEL2.custom_fields.ObtainChildByKey("flag_cancel").value))
                                oCurDevelopmentMethodCountsL2[target_object_typeL2]++;
                            if( !bCalculateCompetenceOnly && !tools_web.is_true(itemTaskTEL2.custom_fields.ObtainChildByKey("flag_cancel").value) )
                            {
                                if(oAllDevelopmentTaskTypeCount.HasProperty(target_object_typeL2))
                                    oAllDevelopmentTaskTypeCount[target_object_typeL2]++
                            }
                            arrCurDevelopmentMethodConfigL3 = [];
                            oCurDevelopmentMethodCountsL3 = {};
                            if(target_object_typeL2 == "development_method" )
                            {
                                arrCurDevelopmentMethodConfigL3 = ArraySelect(getDevelopmentObjectConfig(itemTaskL2.target_object_id.Value), 'This.is_target_task');
                                for(itemDMConfig in arrCurDevelopmentMethodConfigL3)
                                {
                                    oCurDevelopmentMethodCountsL3.SetProperty(itemDMConfig.object_name, 0);
                                }
                            }
                        }
                        if(ArrayCount(ArraySelect(arrCurPATasks,"This.parent_task_id=="+itemObjectiveLev2.id))!=0)
                        {
                            for (itemObjectiveLev3 in ArraySelect(arrCurPATasks,"This.parent_task_id=="+itemObjectiveLev2.id))
                            {
                                itemTaskL3 = ArrayOptFind(arrCurPATasks,"This.id==" + itemObjectiveLev3.id);
                                if (itemTaskL3 != undefined)
                                {
                                    itemTaskTEL3 = tools.open_doc(itemObjectiveLev3.id).TopElem;
                                    target_object_typeL3 = itemTaskL3.target_object_type.Value;
                                    if ( String(target_object_typeL3) == "" && itemTaskTEL3.custom_fields.ObtainChildByKey("task_type").value == i18n.t( 'drugoe' ))
                                    {
                                        target_object_typeL3 = "education_method";
                                    }
                                    if ( !tools_web.is_true(itemTaskTEL3.custom_fields.ObtainChildByKey("flag_cancel").value) )
                                    {
                                        if(oCurDevelopmentMethodCountsL3.HasProperty(target_object_typeL3))
                                            oCurDevelopmentMethodCountsL3[target_object_typeL3]++;
                                        if(oAllDevelopmentTaskTypeCount.HasProperty(target_object_typeL3))
                                            oAllDevelopmentTaskTypeCount[RValue(target_object_typeL3)]++
                                    }
                                }
                            }
                            for(itemDMConfig in arrCurDevelopmentMethodConfigL3)
                            {
                                if(oCurDevelopmentMethodCountsL3[itemDMConfig.object_name] < OptInt(itemDMConfig.min, 0) || oCurDevelopmentMethodCountsL3[itemDMConfig.object_name] > OptInt(itemDMConfig.max, 100500))
                                {
                                    bIsDeveloperTaskCountCorrect = false;
                                    arrErrorMsg.push(i18n.t( 'nekorrektnoeko' ) + itemTaskL1.name + " / " + itemObjectiveLev2.name + " / " + itemDMConfig.object_title + " ] : " + oCurDevelopmentMethodCountsL3[itemDMConfig.object_name] + i18n.t( 'dolzhnobytnemen' ) + itemDMConfig.min + (itemDMConfig.max == null ? "" : i18n.t( 'inebolee' ) + itemDMConfig.max) + " )")
                                }
                                else if(OptInt(itemDMConfig.GetOptProperty("opt",""), 0)>0 &&(oCurDevelopmentMethodCountsL3[itemDMConfig.object_name] < OptInt(itemDMConfig.GetOptProperty("opt",""), 0) || oCurDevelopmentMethodCountsL3[itemDMConfig.object_name] > OptInt(itemDMConfig.GetOptProperty("opt",""), 100500)))
                                {
                                    arrWarnMsg.push(i18n.t( 'kolichestvorazv' ) + itemTaskL1.name + " / " + itemObjectiveLev2.name + " / " + itemDMConfig.object_title + " ] : " + oCurDevelopmentMethodCountsL3[itemDMConfig.object_name] + i18n.t( 'rekomenduetsya_1' ) + itemDMConfig.GetOptProperty("opt","") + " )")
                                }
                            }
                        }
                    }
                    for(itemDMConfig in arrCurDevelopmentMethodConfigL2)
                    {
                        if(oCurDevelopmentMethodCountsL2[itemDMConfig.object_name] < OptInt(itemDMConfig.min, 0) || oCurDevelopmentMethodCountsL2[itemDMConfig.object_name] > OptInt(itemDMConfig.max,100500))
                        {
                            bIsDeveloperTaskCountCorrect = false;
                            arrErrorMsg.push(i18n.t( 'nekorrektnoeko' ) + itemTaskL1.name + " / " + itemDMConfig.object_title + " ] : " + oCurDevelopmentMethodCountsL2[itemDMConfig.object_name] + i18n.t( 'dolzhnobytnemen' ) + itemDMConfig.min + (itemDMConfig.max == null ? "" : i18n.t( 'inebolee' ) + itemDMConfig.max) + " )")
                        }
                        else if(OptInt(itemDMConfig.GetOptProperty("opt",""), 0)>0 && (oCurDevelopmentMethodCountsL2[itemDMConfig.object_name] < OptInt(itemDMConfig.GetOptProperty("opt",""), 0) || oCurDevelopmentMethodCountsL2[itemDMConfig.object_name] > OptInt(itemDMConfig.GetOptProperty("opt",""),100500)))
                        {
                            arrWarnMsg.push(i18n.t( 'kolichestvorazv' ) + itemTaskL1.name + " / " + itemDMConfig.object_title + " ] : " + oCurDevelopmentMethodCountsL2[itemDMConfig.object_name] + i18n.t( 'rekomenduetsya_1' ) + itemDMConfig.GetOptProperty("opt","") + " )")
                        }
                    }
                }
                else if(bIsSelect)
                {
                    arrCountsTaskInCompetences.push({competence_id: ( itemTaskL1==undefined ? 0 : OptInt(itemTaskTEL1.custom_fields.ObtainChildByKey("competence_id").value, 0) ), count: 0})
                    bIsReady = false;
                }
            }
            for(itemDMConfig in arrAllowedObjectNameTypes)
            {
                _catalog_name = common.exchange_object_types.GetOptChildByKey(itemDMConfig.name);
                if (_catalog_name!=undefined)
                {
                    _catalog_name = _catalog_name.title.Value;
                }
                else
                {
                    _catalog_name = itemDMConfig.name;
                }
                if(oAllDevelopmentTaskTypeCount[itemDMConfig.name] > OptInt(itemDMConfig.max, 100500))
                {
                    bIsDeveloperTaskCountCorrect = false;
                    arrErrorMsg.push(i18n.t( 'nekorrektnoeob' ) + _catalog_name + "\" : " + oAllDevelopmentTaskTypeCount[itemDMConfig.name] + i18n.t( 'dolzhnobytnebol' ) + itemDMConfig.max + " )")
                }
                else if(OptInt(itemDMConfig.GetOptProperty("opt",""), 0)>0 && (oAllDevelopmentTaskTypeCount[itemDMConfig.name] < OptInt(itemDMConfig.GetOptProperty("opt",""), 0) || oAllDevelopmentTaskTypeCount[itemDMConfig.name] > OptInt(itemDMConfig.GetOptProperty("opt",""), 100500)))
                {
                    arrWarnMsg.push(i18n.t( 'obsheekontrolir' ) + _catalog_name + "\" : " + oAllDevelopmentTaskTypeCount[itemDMConfig.name] + i18n.t( 'rekomenduetsya_1' ) + itemDMConfig.GetOptProperty("opt","") + " )")
                }
            }
        }

        var iCountTaskMinInCompetence = ArrayOptFirstElem(arrCountsTaskInCompetences) != undefined ? ArrayMin(arrCountsTaskInCompetences, "This.count").count : 0;
        var iMinNumCompetences = OptInt(tools_app.get_cur_settings("min_num_competence", "instance", null, null, null, curPAID), 0);
        var iMinNumTasksInCompetence = OptInt(tools_app.get_cur_settings("min_num_devmethod_in_competence", "instance", null,  null, null, curPAID), 0);
        var iMinNumTasksTotal = OptInt(tools_app.get_cur_settings("min_num_devmethod_sumtotal", "instance", null,  null, null, curPAID), 0);
        var iMaxNumTasksTotal = OptInt(tools_app.get_cur_settings("max_num_devmethod_sumtotal", "instance", null,  null, null, curPAID), 200);

        var iOptNumCompetences = OptInt(tools_app.get_cur_settings("opt_num_competence", "instance", null, null, null, curPAID), 0);
        var iOptNumTasksInCompetence = OptInt(tools_app.get_cur_settings("opt_num_devmethod_in_competence", "instance", null,  null, null, curPAID), 0);
        var iOptNumTasksTotal = OptInt(tools_app.get_cur_settings("opt_num_devmethod_sumtotal", "instance", null,  null, null, curPAID), 0);

        var bIsDone = bIsDeveloperTaskCountCorrect && iCountSelectedCompetence >= iMinNumCompetences && (bAddAllDevelopmentMethods || (iCountTaskMinInCompetence >= iMinNumTasksInCompetence &&  iCountTaskSumTotal >= iMinNumTasksTotal && iCountTaskSumTotal <= iMaxNumTasksTotal));
        if( !bIsDone && ArrayCount(arrErrorMsg)>0)
            return ArrayMerge(arrErrorMsg, "This", "<br>");
        else
            return "";
    }
    catch(sErr)
    {
        return String(sErr).split("(Unknown")[0];
    }
}

function AgentUpdateBossPlan() {
    fldApp = tools_app.get_application('websoft_pdp_ext_v2');
    EnableLog("AgentUpdateBossPlan",true);
    LogEvent("AgentUpdateBossPlan","AgentUpdateBossPlan - start");
    try
    {
        _sInstances = ArrayMerge(XQuery('for $obj in application_instances where $obj/application_id = ' + fldApp.id + ' return $obj/Fields(\'id\')'), '\'0x\' + StrHexInt(This.id, 16 )', ',');
        _sInstances = ( _sInstances == '' ? '' : ( _sInstances + ',' ) ) + '0x' + StrHexInt(fldApp.id, 16 );

        var bProcessAll = tools_web.is_true(fldApp.wvars.ObtainChildByKey('PdpExtAgentUpdateBossPlan.assessment_appraise_flag').value);
        var iAssID = OptInt(fldApp.wvars.ObtainChildByKey('PdpExtAgentUpdateBossPlan.assessment_appraise_id').value, 0);

        _asses = [];
        if (bProcessAll)
        {
            _asses = ArraySelectAll(tools.xquery('for $elem in assessment_appraises where $elem/status=\'0\' and MatchSome($elem/app_instance_id,(\''+StrReplace(_sInstances, ',', '\',\'')+'\')) return $elem'));
        }
        else
        {
            _asses = ArraySelectAll(tools.xquery('for $elem in assessment_appraises where $elem/id = ' + iAssID + ' return $elem'));
        }

        for(_ass in _asses)
        {
            for(_plan in tools.xquery('for $elem in assessment_plans where $elem/assessment_appraise_id = '+_ass.id+' and $elem/is_done != true() return $elem'))
            {
                iNewBoss = getSearchAssBoss(_plan.person_id, _plan.assessment_appraise_id, null, false )
                if( iNewBoss!=undefined && iNewBoss!=_plan.boss_id )
                {
                    docPlan = tools.open_doc(_plan.id);
                    if (!tools_web.is_true(docPlan.TopElem.custom_elems.ObtainChildByKey("block_boss").value))
                    {
                        docPlan.TopElem.boss_id = iNewBoss.PrimaryKey;
                        docPlan.Save();
                        for(_pa in tools.xquery('for $elem in pas where $elem/assessment_plan_id='+_plan.id+' return $elem'))
                        {
                            docPlan = tools.open_doc(_pa.id);
                            docPlan.TopElem.expert_person_id = iNewBoss.PrimaryKey;
                            docPlan.Save();
                        }
                        tools.create_notification("websoft_pdp_ext_v2_update_boss", _plan.id, "" );
                    }
                }
            }
        }
    }
    catch(err)
    {
        LogEvent("AgentUpdateBossPlan",i18n.t( 'oshibkaprirabot' ) + err);
    }
    LogEvent("AgentUpdateBossPlan","AgentUpdateBossPlan - end")
}

function AgentUpdateStatus() {
    fldApp = tools_app.get_application('websoft_pdp_ext_v2');
    EnableLog("AgentUpdateStatus",true);
    LogEvent("AgentUpdateStatus","AgentUpdateStatus - start");
    try
    {
        _sInstances = ArrayMerge(XQuery('for $obj in application_instances where $obj/application_id = ' + fldApp.id + ' return $obj/Fields(\'id\')'), '\'0x\' + StrHexInt(This.id, 16 )', ',');
        _sInstances = ( _sInstances == '' ? '' : ( _sInstances + ',' ) ) + '0x' + StrHexInt(fldApp.id, 16 );


        var bCheckDateAss = tools_web.is_true(fldApp.wvars.ObtainChildByKey('PdpExtAgentUpdateStatus.check_date_ass').value);
        var sEducationSearchType = Trim(fldApp.wvars.ObtainChildByKey('PdpExtAgentUpdateStatus.edu_search_type').value);
        var arrEducationSearchType = sEducationSearchType.split("_");
        var dStartDate = Date('01.01.'+Year(Date())+' 00:00');
        var dEndDate = Date();

        var bProcessAll = tools_web.is_true(fldApp.wvars.ObtainChildByKey('PdpExtAgentUpdateStatus.assessment_appraise_flag').value);
        var iAssID = OptInt(fldApp.wvars.ObtainChildByKey('PdpExtAgentUpdateStatus.assessment_appraise_id').value, 0);

        // dataset для кастомных оценок
        var _level_scale_xml = Trim(fldApp.wvars.ObtainChildByKey('levels_scale_default').value);
        var arrLevelScale = new Array();
        if ( _level_scale_xml != '')
        {
            _level_scale_arr = OpenDocFromStr(_level_scale_xml);
            for (_velem in _level_scale_arr.TopElem)
            {
                if(ArrayOptFind(arrLevelScale,"This.type=='"+_velem.scale_type+"' || OptInt(This.type,0)==OptInt('"+_velem.scale_type+"',99)")==undefined)
                {
                    _level = new Object();
                    _level.name = _velem.OptChild("scale_name");
                    _level.type = _velem.OptChild("scale_type");
                    _level.editable = (_velem.GetOptProperty('editable')!=undefined ? tools_web.is_true(_velem.editable.Value) : true );
                    _level.request_type = (_velem.GetOptProperty("request_type") != undefined ? OptInt(_velem.request_type, 0): 0);
                    _level.scale = Array();
                    for(_scale in _velem.scales)
                    {
                        if( _scale.GetOptProperty('name') != undefined )
                        {
                            _level.scale.push({	'id': _scale.id.Value+'',
                                'name': ('&nbsp;&nbsp;&nbsp;' + _scale.name.Value),
                                'percent': (_scale.GetOptProperty('percent')!=undefined ? _scale.percent.Value : '') ,
                                'disabled' : (_scale.GetOptProperty('disabled')!=undefined ? tools_web.is_true(_scale.disabled.Value) : false )
                            })
                        }
                    }

                    //if( _level.editable )
                    //	continue; // нам нужны только нередактируемые
                    arrLevelScale.push(_level)
                }
            }
        }

        function fSearchResult( _person_id , _object_id , _object_type, _request_type, dStartDate, dEndDate )
        {
            _type = "";
            if( _object_type=="course" )
            {
                sWhere = ""
                if( bCheckDateAss )
                    sWhere = " and $elem/start_usage_date>=date('"+dStartDate+"') and $elem/start_usage_date<=date('"+dEndDate+"') "
                _learning = ArrayOptFirstElem(tools.xquery("for $elem in learnings where $elem/person_id = "+_person_id+" and $elem/course_id = "+_object_id+" "+sWhere+" return $elem"))
                _type = "learning";
                if( _learning == undefined )
                {
                    _learning = ArrayOptFirstElem(tools.xquery("for $elem in active_learnings where $elem/person_id = "+_person_id+" and $elem/course_id = "+_object_id+" "+sWhere+" return $elem"))
                    _type = "active_learning";
                }
                if( _learning == undefined )
                    return undefined;
                else
                    return {"id": _learning.id.Value, "status": _learning.state_id.Value, "type": _type };
            }
            else if( _object_type=="assessment" )
            {
                sWhere = ""
                if( bCheckDateAss )
                    sWhere = " and $elem/start_usage_date>=date('"+dStartDate+"') and $elem/start_usage_date<=date('"+dEndDate+"') "
                _learning = ArrayOptFirstElem(tools.xquery("for $elem in test_learnings where $elem/person_id = "+_person_id+" and $elem/assessment_id = "+_object_id+" "+sWhere+" return $elem"));
                _type = "test_learning";
                if( _learning == undefined )
                {
                    _learning = ArrayOptFirstElem(tools.xquery("for $elem in active_test_learnings where $elem/person_id = "+_person_id+" and $elem/assessment_id = "+_object_id+" "+sWhere+" return $elem"));
                    _type = "active_test_learning";
                }
                if( _learning == undefined )
                    return undefined;
                else
                    return {"status": _learning.state_id.Value, "id": _learning.id.Value, "type": _type };
            }
            else if( _object_type=="education_method" )
            {
                sWhere = ""

                _result = undefined
                for( _type in arrEducationSearchType )
                {
                    if( _result!=undefined )
                        continue;
                    if( _type=="event" )
                    {
                        if( bCheckDateAss )
                            sWhere = " and $elem/start_date>=date('"+dStartDate+"') and $elem/start_date<=date('"+dEndDate+"') "
                        _event = ArraySelectAll(tools.xquery("for $elem in events where $elem/education_method_id = "+_object_id+" "+sWhere+" return $elem"))
                        _result = ArrayOptFirstElem(tools.xquery("for $elem in event_results where $elem/person_id = "+_person_id+" and MatchSome($elem/event_id,("+ArrayMerge(_event,"This.id",",")+")) return $elem"))
                        if( _result!=undefined && _result.event_id.OptForeignElem!=undefined )
                            _result = {"status": String(_result.event_id.OptForeignElem.status_id), "id": _result.id.Value, "type": _type };
                    }
                    else if( _type=="request" )
                    {
                        if( bCheckDateAss )
                            sWhere = " and $elem/create_date>=date('"+dStartDate+"') and $elem/create_date<=date('"+dEndDate+"') ";

//LogEvent("AgentUpdateStatus",_type+"+"+"for $elem in requests where $elem/person_id = "+_person_id+" and $elem/object_id = "+_object_id+" "+sWhere+" return $elem")
                        _result = ArrayOptFirstElem(tools.xquery("for $elem in requests where $elem/person_id = "+_person_id+" and $elem/object_id = "+_object_id+" "+sWhere+" return $elem"));
                        if ( _result == undefined )
                        {
                            _result = ArrayOptFirstElem(tools.xquery("for $elem in request_collaborators where $elem/person_id = "+_person_id+" and $elem/object_id = "+_object_id+" "+sWhere+" return $elem"));
                        }
                        if( _result!=undefined )
                        {
                            _result = {"status": (String(_result.workflow_state)!="" ? String(_result.workflow_state): String(_result.status_id)), "id": _result.id.Value, "type": _type };
                        }
//LogEvent("AgentUpdateStatus",_result)
                    }
                }

                return _result;
            }
            else if (_request_type>0)
            {
                sWhere = "";
                _type = "request";
                if( bCheckDateAss )
                    sWhere = " and $elem/create_date>=date('"+dStartDate+"') and $elem/create_date<=date('"+dEndDate+"') ";
                if (_request_type!=0)
                    sWhere += " and $elem/request_type_id = " + _request_type;
                if (_object_type == "development_method" || _object_type == "task_type")
                {
                    _result = ArrayOptFirstElem(tools.xquery("for $elem in requests where $elem/person_id = " + _person_id + sWhere + " return $elem"))
                }
                else
                {
                    _result = ArrayOptFirstElem(tools.xquery("for $elem in requests where $elem/person_id = "+_person_id+" and $elem/object_id = "+_object_id+" "+sWhere+" return $elem"))
                }
                if( _result!=undefined )
                {
                    _result = {"status": (String(_result.workflow_state)!="" ? String(_result.workflow_state): String(_result.status_id)), "id": _result.id.Value, "type": _type };
                }
                return _result;
            }
        }
        function fStatus(_task_id , _status)
        {
            docTask = tools.open_doc(_task_id)
            // if ( docTask.TopElem.custom_fields.ObtainChildByKey('status_mark').value != String(_status.status) || docTask.TopElem.custom_fields.ObtainChildByKey('status_object_id').value != String(_status.id))
            // {

            sNewStatus = "";
            sObjState = String(_status.status); //state_id
            aScale = _level_type.scale;

            if (StrContains(_status.type, "learning"))
            {
                if (sObjState == '4')
                {
                    oScale = ArrayOptFind(aScale, 'OptInt(This.percent, 0) == 100');
                    sNewStatus = oScale.id;

                }
                else if (sObjState == '3')
                {
                    oScale = ArrayOptFind(aScale, 'OptInt(This.percent, 0) == 0');
                    sNewStatus = oScale.id;
                }
            }

            if( sNewStatus != "" )
            {
                docTask.TopElem.custom_fields.ObtainChildByKey('status_mark').value = sNewStatus;
                docTask.TopElem.custom_fields.ObtainChildByKey('status_mark_date').value = String(Date());
                docTask.TopElem.custom_fields.ObtainChildByKey('status_object_id').value = String(_status.id);
                docTask.TopElem.custom_fields.ObtainChildByKey('status_object_type').value = String(_status.type);
                docTask.TopElem.date_fact = String(Date());
                docTask.Save();
            }

            //}
        }

        _asses = [];
        if (bProcessAll)
        {
            _asses = ArraySelectAll(tools.xquery('for $elem in assessment_appraises where $elem/status=\'0\' and MatchSome($elem/app_instance_id,(\''+StrReplace(_sInstances, ',', '\',\'')+'\')) return $elem'));
        }
        else
        {
            _asses = ArraySelectAll(tools.xquery('for $elem in assessment_appraises where $elem/id = ' + iAssID + ' return $elem'));
        }

        LogEvent("AgentUpdateStatus", EncodeJson(arrLevelScale));

        for(_ass in _asses)
        {
//			if( Trim(_ass.start_date)=="" || Trim(_ass.end_date)=="" )
//				continue;

            dStartDate = DateNewTime(_ass.start_date.HasValue ? Date('01.01.' + (Year(_ass.start_date)-1)) : Date('01.01.'+(Year(Date)-1)));
            dEndDate = DateNewTime(_ass.end_date.HasValue ? Date('01.01.' + (Year(_ass.end_date)+1)) : Date('01.01.'+(Year(Date)+1)));

            for(_pa in tools.xquery("for $elem in pas where $elem/assessment_appraise_id = "+_ass.id+" return $elem"))
            {
                LogEvent("AgentUpdateStatus",_pa.id);
                docPa = tools.open_doc(_pa.id).TopElem;
                arrCurPATasks = ArraySelectAll(tools.xquery("for $elem in tasks where MatchSome($elem/id,(" + ArrayMerge(docPa.tasks,"This.task_id",",") + ")) return $elem"));
                for( _task in arrCurPATasks )
                {
                    _level_type = ArrayOptFind(arrLevelScale, "OptInt(This.type,0)==OptInt('" + _task.target_object_id + "', 999)" );
                    if (_level_type == undefined)
                    {
                        _level_type = ArrayOptFind(arrLevelScale, "This.type=='" + _task.target_object_type + "'" )
                    }
                    if (_level_type == undefined)
                    {
                        _parent_task = ArrayOptFind(arrCurPATasks, "This.id == " + OptInt(_task.parent_task_id,0) );
                        if (_parent_task != undefined)
                        {
                            _level_type = ArrayOptFind(arrLevelScale, "OptInt(This.type,0)==OptInt('" + _parent_task.target_object_id + "', 999)" );
                            if (_level_type == undefined)
                            {
                                _level_type = ArrayOptFind(arrLevelScale, "This.type=='" + _parent_task.target_object_type + "'" )
                            }
                        }
                    }
                    if( _level_type == undefined )
                    {
                        _level_type = ArrayOptFind(arrLevelScale, "This.type=='default'" )
                    }

                    if( _level_type == undefined )
                        continue;

                    LogEvent("AgentUpdateStatus",_task.id + " - " + _task.target_object_type);

                    _status = fSearchResult( _pa.person_id , _task.target_object_id , _task.target_object_type, _level_type.request_type, dStartDate, dEndDate )
                    if( _status!=undefined )
                    {
                        fStatus(_task.id ,_status)
                    }
                }
            }
        }
    }
    catch(err)
    {
        LogEvent("AgentUpdateStatus",i18n.t( 'oshibkaprirabot' ) + err);
    }
    LogEvent("AgentUpdateStatus","AgentUpdateStatus - end")
}

function fPrintFormImg(curObject) {
    try{
        curObjectID = curObject.Doc.DocID;

        fldApp = tools_app.get_application('websoft_pdp_ext_v2');
        iImgId = OptInt(fldApp.wvars.ObtainChildByKey('ass_print_form_img_id').value,undefined);
        iImgSize = OptInt(fldApp.wvars.ObtainChildByKey('ass_print_form_img_size').value,100);
        docImg = tools.open_doc(iImgId)
        if( docImg==undefined || docImg.TopElem.type!='img' )
            return '';

        sImgBody = LoadUrlData(docImg.TopElem.file_url)
        arrTemp = String(docImg.TopElem.file_url).split(".")
        sImgType = (ArrayCount(arrTemp)>0 ? String(arrTemp[ArrayCount(arrTemp)-1]) : "" )

        return '<img src="data:image/'+sImgType+';base64,'+Base64Encode(sImgBody)+'" width="'+iImgSize+'" alt="bug"/>'
    }
    catch(er)
    { return er }
}

function fPrintForm(curObject) {
    try{
        curObjectID = curObject.Doc.DocID;

        // dataset для кастомных оценок
        var _level_scale_xml = tools_app.get_cur_settings("levels_scale_default", "app", null,  null, null, curObjectID);
        var arrLevelScale = new Array();
        if ( _level_scale_xml != '')
        {
            _level_scale_arr = OpenDocFromStr(_level_scale_xml);
            for (_velem in _level_scale_arr.TopElem)
            {
                if(ArrayOptFind(arrLevelScale,"This.type=='"+_velem.scale_type+"'")==undefined)
                {
                    _level = new Object();
                    _level.name = _velem.OptChild("scale_name");
                    _level.type = _velem.OptChild("scale_type");
                    _level.editable = (_velem.GetOptProperty('editable')!=undefined ? tools_web.is_true(_velem.editable.Value) : true );
                    _level.scale = Array();
                    for(_scale in _velem.scales)
                        if( _scale.GetOptProperty('name')!=undefined )
                            //if( (_scale.GetOptProperty('disabled')!=undefined ? !tools_web.is_true(_scale.disabled.Value) : true ) )  // - скрытие крашит оценки - вывод и расчеты.
                            _level.scale.push({'id': _scale.id.Value+'', 'name': (_scale.name.Value), 'percent': (_scale.GetOptProperty('percent')!=undefined ? _scale.percent.Value : '') , 'disabled' : (_scale.GetOptProperty('disabled')!=undefined ? tools_web.is_true(_scale.disabled.Value) : false )  })
                    arrLevelScale.push(_level)
                }
            }
        }
        function fNameStatus( _scale_type,_value )
        {
            _return_value = "";
            _type = ArrayOptFind(arrLevelScale,"This.type=='"+_scale_type+"'")
            if( _type==undefined )
                _type = ArrayOptFind(arrLevelScale,"This.type=='default'")
            if( _type!=undefined )
            {
                _scale_value = ArrayOptFind(_type.scale,"String(This.id)=='"+Trim(_value)+"'")
                if( _scale_value!=undefined )
                    return _scale_value.name;
            }
            return _return_value;
        }

        try
        {
            curLngWeb;
            var sConst_ass_estimated_person = i18n.t( 'ass_estimated_person' );
            var sConst_c_position = i18n.t( 'c_position' );
            var sConst_c_subd = i18n.t( 'c_subd' );
            var sConst_c_boss = i18n.t( 'c_boss' );
            var sConst_ass_competence = i18n.t( 'ass_competence' );
            var sConst_ks3idixed9 = i18n.t( 'ks3idixed9' );
            var sConst_vsb_expected_result = i18n.t( 'vsb_expected_result' );
            var sConst_task_type = i18n.t( 'c_type' );
            var sConst_task_name = i18n.t( 'naimenovanie' );
        }
        catch(e)
        {
            var sConst_ass_estimated_person = i18n.t( 'ocenivaemyysot' );
            var sConst_c_position = i18n.t( 'dolzhnost' );
            var sConst_c_subd = i18n.t( 'podrazdelenie' );
            var sConst_c_boss = i18n.t( 'rukovoditel' );
            var sConst_ass_competence = i18n.t( 'kompetenciya' );
            var sConst_ks3idixed9 = i18n.t( 'sposobrazvitiya' );
            var sConst_vsb_expected_result = i18n.t( 'ozhidaemyyrezul' );
            var sConst_task_type = i18n.t( 'tip' );
            var sConst_task_name = i18n.t( 'naimenovanie_1' );
        }

        var sPersonFullname = curObject.person_id.sd.fullname;
        var sPersonPositionName = curObject.person_id.sd.position_name;
        var sPersonOrgName = curObject.person_id.sd.org_name;
        var sExpertFullname = curObject.expert_person_id.sd.fullname;

        var docAssessmentPlan = tools.open_doc(curObject.assessment_plan_id);
        var teAssessmentPlan = docAssessmentPlan.TopElem;
        var sWorkflowStep = teAssessmentPlan.workflow_state;
        var sWorkflowStepName = teAssessmentPlan.workflow_state_name;
        var bVisibleStatus = StrContains("action,finish,correct",sWorkflowStep)

        var docPerson = tools.open_doc(curObject.person_id);
        var tePerson = docPerson.TopElem;
        var sPersonSubHierarchy = tools.person_list_staff_by_person_id(curObject.person_id, tePerson, 15, 1, "/ ");
        //var sPersonSubHierarchy = ArrayMerge(fnReverseArray(fnGetSubHierarchy(tePerson.position_parent_id)), "This", "/ ");

        var docAssessmentAppraise = tools.open_doc(curObject.assessment_appraise_id);
        var teAssessmentAppraise = docAssessmentAppraise.TopElem;

        var sAssessmentAppraiseName = teAssessmentAppraise.name;
        var sAssessmentStartDate = (teAssessmentAppraise.start_date.HasValue ? StrDate(teAssessmentAppraise.start_date, false, false) : "");
        var sAssessmentEndDate = (teAssessmentAppraise.end_date.HasValue ? StrDate(teAssessmentAppraise.end_date, false, false) : "");

        //
        var arrTasksData = new Array();
        var docTask, teTask;
        var oTempTaskData;

        var arrCurObjectTaskCollection = ArraySelectAll(tools.xquery("for $elem in tasks where MatchSome($elem/id,(" + ArrayMerge(curObject.tasks, "This.task_id", ",") + ")) return $elem, $elem/__data"));
        for (oTask in ArraySort(ArraySelect(arrCurObjectTaskCollection, "!This.parent_task_id.HasValue && This.target_object_type=='competence'"),"curObject.tasks.GetOptChildByKey(This.id).position","+"))
        {
            docTask = tools.open_doc(oTask.id);
            if (docTask == undefined)
                continue;
            teTask = docTask.TopElem;

            oTempTaskData = new Object();
            oTempTaskData.rowspan = 0;

            oTempTaskData.type = i18n.t( 'kompetenciya' );
            oTempTaskData.name = teTask.name;
            //oTempTaskData.target_level = teTask.custom_fields.ObtainChildByKey("business_target").value;

            oTempTaskData.development_methods = new Array();
            oTempTaskData.development_methods_count = 0;

            //
            xarrCurTaskDevelopmentMethods = ArraySort(tools.xquery("for $elem in tasks where $elem/parent_task_id = " + oTask.id + " return $elem, $elem/__data"),"curObject.tasks.GetOptChildByKey(This.id).position","+");
            for (catCurTaskDevelopmentMethod in xarrCurTaskDevelopmentMethods)
            {
                oTempDevelopmentMethod = new Object();

                //
                docCurTaskDevelopmentMethod = tools.open_doc(catCurTaskDevelopmentMethod.PrimaryKey);
                teCurTaskDevelopmentMethod = docCurTaskDevelopmentMethod.TopElem;

                oTempDevelopmentMethod.name = teCurTaskDevelopmentMethod.name;
                oTempDevelopmentMethod.development_tools = new Array();
                oTempDevelopmentMethod.development_tools_count = 0;
                arrCurDevelopmentMethodConfig = getDevelopmentObjectConfig(teCurTaskDevelopmentMethod);
                //
                xarrCurTaskDevelopmentTools = ArraySort(XQuery("for $elem in tasks where $elem/parent_task_id = " + catCurTaskDevelopmentMethod.id + " return $elem, $elem/__data"),"curObject.tasks.GetOptChildByKey(This.id).position","+");
                for (catCurTaskDevelopmentTool in xarrCurTaskDevelopmentTools)
                {
                    oTempDevelopmentTool = new Object();

                    //
                    docCurTaskDevelopmentTool = tools.open_doc(catCurTaskDevelopmentTool.id);
                    teCurTaskDevelopmentTool = docCurTaskDevelopmentTool.TopElem;

                    oTempDevelopmentTool.name = teCurTaskDevelopmentTool.name;
                    if(teCurTaskDevelopmentTool.target_object_type.HasValue)
                    {
                        oTempDevelopmentToolConfig = ArrayOptFind(arrCurDevelopmentMethodConfig, "This.object_name == " + CodeLiteral(teCurTaskDevelopmentTool.target_object_type.Value));
                        oTempDevelopmentTool.task_type = oTempDevelopmentToolConfig != undefined ? oTempDevelopmentToolConfig.object_title : common.exchange_object_types.GetOptChildByKey(teCurTaskDevelopmentTool.target_object_type.Value).title.Value;
                    }
                    else
                    {
                        oTempDevelopmentTool.task_type = "";
                    }
                    oTempDevelopmentTool.task_status = fNameStatus( ( teCurTaskDevelopmentTool.target_object_type.HasValue ? teCurTaskDevelopmentTool.target_object_type.Value : "default" ) , teCurTaskDevelopmentTool.custom_fields.ObtainChildByKey('status_mark').value );
                    oTempDevelopmentTool.expected_result = teCurTaskDevelopmentTool.plan;
                    oTempDevelopmentTool.planned_date = (teCurTaskDevelopmentTool.date_plan.HasValue ? StrDate(teCurTaskDevelopmentTool.date_plan, false, false) : "");

                    //
                    docTargetObject = tools.open_doc(teCurTaskDevelopmentTool.target_object_id);
                    if (docTargetObject == undefined)
                    {
                        oTempDevelopmentTool.desc = "";
                    }
                    else
                    {
                        teTargetObject = docTargetObject.TopElem;
                        try
                        {
                            oTempDevelopmentTool.desc = teTargetObject.name;
                        }
                        catch(sErr)
                        {
                            oTempDevelopmentTool.desc = "";
                        }
                    }

                    oTempDevelopmentMethod.development_tools.push(oTempDevelopmentTool);
                    oTempDevelopmentMethod.development_tools_count++;

                    oTempTaskData.rowspan++;
                }
                if (ArrayOptFirstElem(xarrCurTaskDevelopmentTools) == undefined)
                    oTempTaskData.rowspan++;

                arrSupplementaryQuestionsObject = getSupplementaryQuestionsObjectConfig(teCurTaskDevelopmentMethod);
                _sup_fields = [];
                for(itemDevMethodScales in arrSupplementaryQuestionsObject)
                {
                    _sup_fields.push({code: itemDevMethodScales.object_code, title: itemDevMethodScales.object_title, value: teCurTaskDevelopmentMethod.custom_fields.ObtainChildByKey(itemDevMethodScales.object_code).value.Value});
                }
                oTempDevelopmentMethod.SetProperty("sup_fields", _sup_fields);

                oTempTaskData.development_methods.push(oTempDevelopmentMethod);
                oTempTaskData.development_methods_count++;
            }

            if (ArrayOptFirstElem(xarrCurTaskDevelopmentMethods) == undefined)
                oTempTaskData.rowspan++;

            arrTasksData.push(oTempTaskData);
        }

        xarrCurTaskDevelopmentMethods = ArraySelect(arrCurObjectTaskCollection, "!This.parent_task_id.HasValue && This.target_object_type=='development_method'");
        if (ArrayOptFirstElem(xarrCurTaskDevelopmentMethods) != undefined)
        {
            oTempTaskData = new Object();
            oTempTaskData.rowspan = 0;

            oTempTaskData.type = i18n.t( 'sposobrazvitiya' );
            oTempTaskData.name = i18n.t( 'dopolnitelnyem' );

            oTempTaskData.development_methods = new Array();
            oTempTaskData.development_methods_count = 0;

            //
            for (catCurTaskDevelopmentMethod in xarrCurTaskDevelopmentMethods)
            {
                oTempDevelopmentMethod = new Object();

                //
                docCurTaskDevelopmentMethod = tools.open_doc(catCurTaskDevelopmentMethod.PrimaryKey);
                teCurTaskDevelopmentMethod = docCurTaskDevelopmentMethod.TopElem;

                oTempDevelopmentMethod.name = teCurTaskDevelopmentMethod.name;
                oTempDevelopmentMethod.development_tools = new Array();
                oTempDevelopmentMethod.development_tools_count = 0;

                //
                xarrCurTaskDevelopmentTools = ArraySort(XQuery("for $elem in tasks where $elem/parent_task_id = " + catCurTaskDevelopmentMethod.id + " return $elem, $elem/__data"),"curObject.tasks.GetOptChildByKey(This.id).position","+");
                for (catCurTaskDevelopmentTool in xarrCurTaskDevelopmentTools)
                {
                    oTempDevelopmentTool = new Object();

                    //
                    docCurTaskDevelopmentTool = tools.open_doc(catCurTaskDevelopmentTool.id);
                    teCurTaskDevelopmentTool = docCurTaskDevelopmentTool.TopElem;

                    oTempDevelopmentTool.name = teCurTaskDevelopmentTool.name;
                    if(teCurTaskDevelopmentTool.target_object_type.HasValue)
                    {
                        oTempDevelopmentToolConfig = ArrayOptFind(arrCurDevelopmentMethodConfig, "This.object_name == " + CodeLiteral(teCurTaskDevelopmentTool.target_object_type.Value));
                        oTempDevelopmentTool.task_type = oTempDevelopmentToolConfig != undefined ? oTempDevelopmentToolConfig.object_title : common.exchange_object_types.GetOptChildByKey(teCurTaskDevelopmentTool.target_object_type.Value).title.Value;
                    }
                    else
                    {
                        oTempDevelopmentTool.task_type = "";
                    }
                    oTempDevelopmentTool.task_status = fNameStatus( ( teCurTaskDevelopmentTool.target_object_type.HasValue ? teCurTaskDevelopmentTool.target_object_type.Value : "default" ) , teCurTaskDevelopmentTool.custom_fields.ObtainChildByKey('status_mark').value );
                    oTempDevelopmentTool.expected_result = teCurTaskDevelopmentTool.plan;
                    oTempDevelopmentTool.planned_date = (teCurTaskDevelopmentTool.date_plan.HasValue ? StrDate(teCurTaskDevelopmentTool.date_plan, false, false) : "");

                    //
                    docTargetObject = tools.open_doc(teCurTaskDevelopmentTool.target_object_id);
                    if (docTargetObject == undefined)
                    {
                        oTempDevelopmentTool.desc = "";
                    }
                    else
                    {
                        teTargetObject = docTargetObject.TopElem;
                        try
                        {
                            oTempDevelopmentTool.desc = teTargetObject.name;
                        }
                        catch(sErr)
                        {
                            oTempDevelopmentTool.desc = "";
                        }
                    }

                    oTempDevelopmentMethod.development_tools.push(oTempDevelopmentTool);
                    oTempDevelopmentMethod.development_tools_count++;

                    oTempTaskData.rowspan++;
                }
                if (ArrayOptFirstElem(xarrCurTaskDevelopmentTools) == undefined)
                    oTempTaskData.rowspan++;

                arrSupplementaryQuestionsObject = getSupplementaryQuestionsObjectConfig(teCurTaskDevelopmentMethod);
                _sup_fields = [];
                for(itemDevMethodScales in arrSupplementaryQuestionsObject)
                {
                    _sup_fields.push({code: itemDevMethodScales.object_code, title: itemDevMethodScales.object_title, value: teCurTaskDevelopmentMethod.custom_fields.ObtainChildByKey(itemDevMethodScales.object_code).value.Value});
                }
                oTempDevelopmentMethod.SetProperty("sup_fields", _sup_fields);

                oTempTaskData.development_methods.push(oTempDevelopmentMethod);
                oTempTaskData.development_methods_count++;
            }

            arrTasksData.push(oTempTaskData);
        }

        sHtmlForm = i18n.t( 'htmlxmlnsourns' )+sPersonFullname+i18n.t( 'tdtdclasstdnon' )+sExpertFullname+i18n.t( 'tdtrtablecente' );
        if(bVisibleStatus)
            sHtmlForm += '\
 <col width=64 style="width:48pt">\
';
        sHtmlForm += '\
 <col width=7 style="mso-width-source:userset;mso-width-alt:256;width:5pt">\
 <tr height=1 style="height:1pt">\
  <td width=7 style="width:5pt">&nbsp;</td>\
  <td width=30 style="width:23pt"></td>\
  <td width=64 style="width:48pt"></td>\
  <td width=195 style="width:146pt"></td>\
  <td width=85 style="width:64pt"></td>\
';
        if(bVisibleStatus)
            sHtmlForm += '\
  <td width=64 style="width:48pt"></td>\
';
        sHtmlForm += '\
  <td width=7 style="width:5pt"></td>\
 </tr>\
 ';

        for (oTask in arrTasksData)
        {
            try{
                sHtmlForm += '\
 <tr height=25 style="height:18.75pt">\
  <td colspan='+(bVisibleStatus ? 7 : 6 )+' height=25 class=xl2514313 width=452 style="height:18.75pt;width:339pt"><span style="line-height:107%;mso-bidi-font-size:11pt;mso-font-width:127%">'+oTask.name+'</span></td>\
 </tr>\
 <tr height=7 style="mso-height-source:userset;height:5.25pt">\
  <td colspan='+(bVisibleStatus ? 7 : 6 )+' height=7 class=xl2914313 style="height:5.25pt"></td>\
 </tr>\
 ';

                if (oTask.development_methods_count > 0)
                {
                    for (oDevelopmentMethod in oTask.development_methods)
                    {
                        _sup_fields = oDevelopmentMethod.GetOptProperty("sup_fields", ([]));
                        sHtmlForm += '\
 <tr height=25 style="height:18.75pt">\
  <td colspan=2 rowspan='+((oDevelopmentMethod.development_tools_count>0?2:1)+ArrayCount(_sup_fields)+oDevelopmentMethod.development_tools_count)+' height=68 class=xl2414313 style="height:51.0pt">&nbsp;</td>\
  <td colspan='+(bVisibleStatus ? 4 : 3 )+' class=xl2514313>'+oDevelopmentMethod.name+'</td>\
  <td rowspan='+((oDevelopmentMethod.development_tools_count>0?2:1)+ArrayCount(_sup_fields)+oDevelopmentMethod.development_tools_count)+' class=xl2414313>&nbsp;</td>\
 </tr>';
                        for (_spf in _sup_fields)
                        {
                            sHtmlForm += '\
		<tr height=25 style="height:18.75pt">\
			<td class=xl2614313><span style="line-height:107%;mso-bidi-font-size:11pt;mso-font-width:117%">'+_spf.title+'</span></td>\
			<td class=xl2714313_1 colspan='+(bVisibleStatus ? 3 : 2 )+'><span style="line-height:107%;mso-bidi-font-size:11pt;mso-font-width:117%">'+_spf.value+'</span></td>\
		</tr>';
                        }
                        if (oDevelopmentMethod.development_tools_count > 0)
                        {
                            sHtmlForm += i18n.t( 'trheightstyleh' );
                            if(bVisibleStatus)
                                sHtmlForm += i18n.t( 'tdclassxlwidth' );
                            sHtmlForm += '\
 </tr>\
 ';
                            for (iT = 0; iT < oDevelopmentMethod.development_tools_count; iT++)
                            {
                                oDevelopmentTool = oDevelopmentMethod.development_tools[iT];
                                sHtmlForm += '\
 <tr height=25 style="height:18.75pt">\
  <td class=xl2714313><span style="line-height:107%;mso-bidi-font-size:11pt;mso-font-width:117%">'+oDevelopmentTool.name+'</span></td>\
  <td class=xl2714313>'+oDevelopmentTool.expected_result+'</td>\
  <td class=xl2714313>'+oDevelopmentTool.planned_date+'</td>\
';
                                if(bVisibleStatus)
                                    sHtmlForm += '\
  <td class=xl2714313>'+oDevelopmentTool.task_status+'</td>\
';
                                sHtmlForm += '\
 </tr>\
 ';
                            }
                        }
                        sHtmlForm += '\
 <tr height=7 style="mso-height-source:userset;height:5.25pt">\
  <td colspan='+(bVisibleStatus ? 7 : 6 )+' height=7 class=xl2414313 style="height:5.25pt"></td>\
 </tr>\
 <tr height=7 style="mso-height-source:userset;height:5.25pt">\
  <td colspan='+(bVisibleStatus ? 7 : 6 )+' height=7 class=xl2914313 style="height:5.25pt"></td>\
 </tr>\
 ';
                    }
                }
            }
            catch(er)
            { alert(er) }
        }

        sHtmlForm += '\
 <![if supportMisalignedColumns]>\
 <tr height=0 style="display:none">\
  <td width=7 style="width:5pt"></td>\
  <td width=30 style="width:23pt"></td>\
  <td width=64 style="width:48pt"></td>\
  <td width=195 style="width:146pt"></td>\
  <td width=85 style="width:64pt"></td>\
 </tr>\
 <![endif]>\
</table>\
</div>\
</body>\
</html>\
';
        return sHtmlForm;
    }
    catch(er)
    { return er }
}

function fPrintForm_old(curObject) {
    try{
        curObjectID = curObject.Doc.DocID;

        // dataset для кастомных оценок
        var _level_scale_xml = tools_app.get_cur_settings("levels_scale_default", "app", null,  null, null, curObjectID);
        var arrLevelScale = new Array();
        if ( _level_scale_xml != '')
        {
            _level_scale_arr = OpenDocFromStr(_level_scale_xml);
            for (_velem in _level_scale_arr.TopElem)
            {
                if(ArrayOptFind(arrLevelScale,"This.type=='"+_velem.scale_type+"'")==undefined)
                {
                    _level = new Object();
                    _level.name = _velem.OptChild("scale_name");
                    _level.type = _velem.OptChild("scale_type");
                    _level.editable = (_velem.GetOptProperty('editable')!=undefined ? tools_web.is_true(_velem.editable.Value) : true );
                    _level.scale = Array();
                    for(_scale in _velem.scales)
                        if( _scale.GetOptProperty('name')!=undefined )
                            //if( (_scale.GetOptProperty('disabled')!=undefined ? !tools_web.is_true(_scale.disabled.Value) : true ) )  // - скрытие крашит оценки - вывод и расчеты.
                            _level.scale.push({'id': _scale.id.Value+'', 'name': (_scale.name.Value), 'percent': (_scale.GetOptProperty('percent')!=undefined ? _scale.percent.Value : '') , 'disabled' : (_scale.GetOptProperty('disabled')!=undefined ? tools_web.is_true(_scale.disabled.Value) : false )  })
                    arrLevelScale.push(_level)
                }
            }
        }
        function fNameStatus( _scale_type,_value )
        {
            _return_value = "";
            _type = ArrayOptFind(arrLevelScale,"This.type=='"+_scale_type+"'")
            if( _type==undefined )
                _type = ArrayOptFind(arrLevelScale,"This.type=='default'")
            if( _type!=undefined )
            {
                _scale_value = ArrayOptFind(_type.scale,"String(This.id)=='"+Trim(_value)+"'")
                if( _scale_value!=undefined )
                    return _scale_value.name;
            }
            return _return_value;
        }

        try
        {
            curLngWeb;
            var sConst_ass_estimated_person = i18n.t( 'ass_estimated_person' );
            var sConst_c_position = i18n.t( 'c_position' );
            var sConst_c_subd = i18n.t( 'c_subd' );
            var sConst_c_boss = i18n.t( 'c_boss' );
            var sConst_ass_competence = i18n.t( 'ass_competence' );
            var sConst_ks3idixed9 = i18n.t( 'ks3idixed9' );
            var sConst_vsb_expected_result = i18n.t( 'vsb_expected_result' );
            var sConst_task_type = i18n.t( 'c_type' );
            var sConst_task_name = i18n.t( 'naimenovanie' );
        }
        catch(e)
        {
            var sConst_ass_estimated_person = i18n.t( 'ocenivaemyysot' );
            var sConst_c_position = i18n.t( 'dolzhnost' );
            var sConst_c_subd = i18n.t( 'podrazdelenie' );
            var sConst_c_boss = i18n.t( 'rukovoditel' );
            var sConst_ass_competence = i18n.t( 'kompetenciya' );
            var sConst_ks3idixed9 = i18n.t( 'sposobrazvitiya' );
            var sConst_vsb_expected_result = i18n.t( 'ozhidaemyyrezul' );
            var sConst_task_type = i18n.t( 'tip' );
            var sConst_task_name = i18n.t( 'naimenovanie_1' );
        }

        sHtmlForm = '\
<style>\
v\:* {behavior:url(#default#VML);}\
o\:* {behavior:url(#default#VML);}\
x\:* {behavior:url(#default#VML);}\
.shape {behavior:url(#default#VML);}\
</style>\
<![endif]-->\
<style id="ddd">\
<!--\
table {mso-displayed-decimal-separator:"\,"; mso-displayed-thousand-separator:" ";}\
.font521790 {color:black; font-size:9.0pt; font-weight:700; font-style:normal; text-decoration:none; font-family:"Open Sans"; mso-font-charset:204;}\
.font621790 {color:black; font-size:9.0pt; font-weight:400; font-style:normal; text-decoration:none; font-family:"Open Sans"; mso-font-charset:204;}\
.xl1421790 {padding:0px; mso-ignore:padding; color:red; font-size:10.0pt; font-weight:400; font-style:normal; text-decoration:none; font-family:"Open Sans"; mso-font-charset:204; mso-number-format:General; text-align:general; vertical-align:bottom; background:#adabac; mso-background-source:auto; mso-pattern:auto; white-space:nowrap;}\
.xl1521790 {padding:0px; mso-ignore:padding; color:black; font-size:10.0pt; font-weight:400; font-style:normal; text-decoration:none; font-family:"Open Sans"; mso-font-charset:204; mso-number-format:General; text-align:general; vertical-align:bottom; mso-background-source:auto; mso-pattern:auto; white-space:nowrap;}\
.xl6321790 {padding:0px; mso-ignore:padding; color:gray; font-size:9.0pt; font-weight:700; font-style:normal; text-decoration:none; font-family:"Open Sans"; mso-font-charset:204; mso-number-format:General; text-align:right; vertical-align:bottom; mso-background-source:auto; mso-pattern:auto; white-space:normal;}\
.xl6421790 {padding:0px; mso-ignore:padding; color:black; font-size:9.0pt; font-weight:400; font-style:normal; text-decoration:none; font-family:"Open Sans"; mso-font-charset:204; mso-number-format:General; text-align:left; vertical-align:middle; border:0.0pt solid windowtext; mso-background-source:auto; mso-pattern:auto; white-space:normal;}\
.xl6521790 {padding:0px; mso-ignore:padding; color:black; font-size:9.0pt; font-weight:400; font-style:normal; text-decoration:none; font-family:"Open Sans"; mso-font-charset:204; mso-number-format:General; text-align:left; vertical-align:middle; border-top:0.5pt solid windowtext; border-right:none; border-bottom:0.5pt solid windowtext; border-left:1.0pt solid windowtext; mso-background-source:auto; mso-pattern:auto; white-space:normal;}\
.xl6621790 {padding:0px; mso-ignore:padding; color:black; font-size:9.0pt; font-weight:400; font-style:normal; text-decoration:none; font-family:"Open Sans"; mso-font-charset:204; mso-number-format:"Short Date"; text-align:center; vertical-align:middle; border:0.5pt solid windowtext; mso-background-source:auto; mso-pattern:auto; white-space:normal;}\
.xl6721790 {padding:0px; mso-ignore:padding; color:black; font-size:9.0pt; font-weight:400; font-style:normal; text-decoration:none; font-family:"Open Sans"; mso-font-charset:204; mso-number-format:General; text-align:left; vertical-align:middle; border-top:0.5pt solid black; border-right:0.5pt solid windowtext; border-bottom:0.5pt solid black; border-left:1.0pt solid black; mso-background-source:auto; mso-pattern:auto; white-space:normal;}\
.xl6821790 {padding:0px; mso-ignore:padding; color:black; font-size:11.0pt; font-weight:700; font-style:normal; text-decoration:none; font-family:"Open Sans"; mso-font-charset:204; mso-number-format:General; text-align:center; vertical-align:middle; mso-background-source:auto; mso-pattern:auto; white-space:normal;}\
.xl6921790 {padding:0px; mso-ignore:padding; color:black; font-size:11.0pt; font-weight:700; font-style:normal; text-decoration:none; font-family:"Open Sans"; mso-font-charset:204; mso-number-format:General; text-align:general; vertical-align:bottom; mso-background-source:auto; mso-pattern:auto; white-space:normal;}\
.xl7021790 {padding:0px; mso-ignore:padding; color:white; font-size:9.0pt; font-weight:700; font-style:normal; text-decoration:none; font-family:"Open Sans"; mso-font-charset:204; mso-number-format:General; text-align:center; vertical-align:middle; border:0.5pt solid windowtext; background:#adabac; mso-pattern:black none; white-space:normal;}\
.xl7121790 {padding:0px; mso-ignore:padding; color:white; font-size:9.0pt; font-weight:700; font-style:normal; text-decoration:none; font-family:"Open Sans"; mso-font-charset:204; mso-number-format:General; text-align:center; vertical-align:middle; border-top:0.5pt solid windowtext; border-right:none; border-bottom:0.5pt solid windowtext; border-left:0.5pt solid windowtext; background:#adabac; mso-pattern:black none; white-space:normal;}\
.xl7221790 {padding:0px; mso-ignore:padding; color:gray; font-size:8.0pt; font-weight:700; font-style:normal; text-decoration:none; font-family:"Open Sans"; mso-font-charset:204; mso-number-format:General; text-align:left; vertical-align:bottom; mso-background-source:auto; mso-pattern:auto; white-space:normal;}\
.xl7321790 {padding:0px; mso-ignore:padding; color:black; font-size:10.0pt; font-weight:700; font-style:normal; text-decoration:none; font-family:"Open Sans"; mso-font-charset:204; mso-number-format:General; text-align:general; vertical-align:bottom; border-top:.5pt solid windowtext; border-right:none; border-bottom:0.5pt solid black; border-left:none; mso-background-source:auto; mso-pattern:auto; white-space:normal;}\
.xl7421790 {padding:0px; mso-ignore:padding; color:white; font-size:14.0pt; font-weight:700; font-style:normal; text-decoration:none; font-family:"Open Sans"; mso-font-charset:204; mso-number-format:General; text-align:center; vertical-align:middle; background:#adabac; mso-pattern:black none; white-space:normal;}\
.xl7521790 {padding:0px; mso-ignore:padding; color:white; font-size:9.0pt; font-weight:700; font-style:normal; text-decoration:none; font-family:"Open Sans"; mso-font-charset:204; mso-number-format:General; text-align:center; vertical-align:middle; border-top:0.5pt solid black; border-right:0.5pt; border-bottom:0.5pt solid windowtext; border-left:0.5pt solid black; background:#adabac; mso-pattern:black none; white-space:normal;}\
.xl7621790 {padding:0px; mso-ignore:padding; color:white; font-size:9.0pt; font-weight:700; font-style:normal; text-decoration:none; font-family:"Open Sans"; mso-font-charset:204; mso-number-format:General; text-align:center; vertical-align:middle; border-top:0.5ptpt solid black; border-right:none; border-bottom:0.5pt solid windowtext; border-left:none; background:#adabac; mso-pattern:black none; white-space:normal;}\
.xl7721790 {padding:0px; mso-ignore:padding; color:white; font-size:9.0pt; font-weight:700; font-style:normal; text-decoration:none; font-family:"Open Sans"; mso-font-charset:204; mso-number-format:General; text-align:center; vertical-align:middle; border-top:0.5pt solid windowtext; border-right:0.5pt; border-bottom:none; border-left:0.5pt solid black; background:#adabac; mso-pattern:black none; white-space:normal;}\
.xl7821790 {padding:0px; mso-ignore:padding; color:white; font-size:9.0pt; font-weight:700; font-style:normal; text-decoration:none; font-family:"Open Sans"; mso-font-charset:204; mso-number-format:General; text-align:center; vertical-align:middle; border-top:none; border-right:none; border-bottom:0.5pt solid windowtext; border-left:0.5pt solid black; background:#adabac; mso-pattern:black none; white-space:normal;}\
.xl7921790 {padding:0px; mso-ignore:padding; color:white; font-size:9.0pt; font-weight:700; font-style:normal; text-decoration:none; font-family:"Open Sans"; mso-font-charset:204; mso-number-format:General; text-align:center; vertical-align:middle; border-top:0.5pt solid black; border-right:0.5pt; border-bottom:none; border-left:0.5pt solid black; background:#adabac; mso-pattern:black none; white-space:normal;}\
.xl8021790 {padding:0px; mso-ignore:padding; color:white; font-size:9.0pt; font-weight:700; font-style:normal; text-decoration:none; font-family:"Open Sans"; mso-font-charset:204; mso-number-format:General; text-align:center; vertical-align:middle; border-top:none; border-right:none; border-bottom:0.5pt solid black; border-left:0.5pt solid black; background:#adabac; mso-pattern:black none; white-space:normal;}\
.xl8121790 {padding:0px; mso-ignore:padding; color:black; font-size:10.0pt; font-weight:700; font-style:normal; text-decoration:none; font-family:"Open Sans"; mso-font-charset:204; mso-number-format:General; text-align:general; vertical-align:bottom; border-top:none; border-right:none; border-bottom:.5pt solid windowtext; border-left:none; mso-background-source:auto; mso-pattern:auto; white-space:nowrap;}\
.xl8221790 {padding:0px; mso-ignore:padding; color:black; font-size:10.0pt; font-weight:700; font-style:normal; text-decoration:none; font-family:"Open Sans"; mso-font-charset:204; mso-number-format:General; text-align:general; vertical-align:bottom; border-top:.5pt solid windowtext; border-right:none; border-bottom:.5pt solid windowtext; border-left:none; mso-background-source:auto; mso-pattern:auto; white-space:nowrap;}\
.xl8321790 {padding:0px; mso-ignore:padding; color:black; font-size:10.0pt; font-weight:700; font-style:normal; text-decoration:none; font-family:"Open Sans"; mso-font-charset:204; mso-number-format:General; text-align:general; vertical-align:bottom; border-top:.5pt solid windowtext; border-right:none; border-bottom:.5pt solid windowtext; border-left:none; mso-background-source:auto; mso-pattern:auto; white-space:normal;}\
.xl8421790 {padding:0px; mso-ignore:padding; color:black; font-size:9.0pt; font-weight:400; font-style:normal; text-decoration:none; font-family:"Open Sans"; mso-font-charset:204; mso-number-format:General; text-align:left; vertical-align:middle; border-top:0.5pt solid windowtext; border-right:0.5pt; border-bottom:none; border-left:none; background:white; mso-pattern:black none; white-space:normal;}\
.xl8521790 {padding:0px; mso-ignore:padding; color:white; font-size:9.0pt; font-weight:700; font-style:normal; text-decoration:none; font-family:"Open Sans"; mso-font-charset:204; mso-number-format:General; text-align:center; vertical-align:middle; border-top:0.5pt solid windowtext; border-right:0.5pt solid windowtext; border-bottom:none; border-left:none; background:white; mso-pattern:black none; white-space:normal;}\
.xl8621790 {padding:0px; mso-ignore:padding; color:white; font-size:9.0pt; font-weight:700; font-style:normal; text-decoration:none; font-family:"Open Sans"; mso-font-charset:204; mso-number-format:General; text-align:center; vertical-align:middle; border-top:none; border-right:none; border-bottom:0.5pt solid windowtext; border-left:none; background:white; mso-pattern:black none; white-space:normal;}\
.xl8721790 {padding:0px; mso-ignore:padding; color:white; font-size:9.0pt; font-weight:700; font-style:normal; text-decoration:none; font-family:"Open Sans"; mso-font-charset:204; mso-number-format:General; text-align:center; vertical-align:middle; border-top:none; border-right:0.5pt solid windowtext; border-bottom:0.5pt solid windowtext; border-left:none; background:white; mso-pattern:black none; white-space:normal;}\
.xl8921790 {padding:0px; mso-ignore:padding; color:white; font-size:9.0pt; font-weight:700; font-style:normal; text-decoration:none; font-family:"Open Sans"; mso-font-charset:204; mso-number-format:General; text-align:center; vertical-align:middle; border-top:none; border-right:none; border-bottom:none solid windowtext; border-left: none solid black; background:#ed1e19; margin-bottom:10 pt; mso-pattern:black none; white-space:normal;}\
-->\
</style>\
\
<div id="ddd" align=center\
x:publishsource="Excel">\
\
<table border=0 cellpadding=0 cellspacing=0 width=931 style="border-collapse:collapse;table-layout:fixed;width:517pt">\
 <col width=202 style="mso-width-source:userset;mso-width-alt:7168;width:151pt">\
 <col width=215 style="mso-width-source:userset;mso-width-alt:7651;width:161pt">\
 <col width=202 span=2 style="mso-width-source:userset;mso-width-alt:7168;width:151pt">\
 <col width=110 span=2 style="mso-width-source:userset;mso-width-alt:3925;width:83pt">\
\
';

        var sPersonFullname = curObject.person_id.sd.fullname;
        var sPersonPositionName = curObject.person_id.sd.position_name;
        var sPersonOrgName = curObject.person_id.sd.org_name;
        var sExpertFullname = curObject.expert_person_id.sd.fullname;

        var docAssessmentPlan = tools.open_doc(curObject.assessment_plan_id);
        var teAssessmentPlan = docAssessmentPlan.TopElem;
        var sWorkflowStepName = teAssessmentPlan.workflow_state_name;

        var docPerson = tools.open_doc(curObject.person_id);
        var tePerson = docPerson.TopElem;
        var sPersonSubHierarchy = tools.person_list_staff_by_person_id(curObject.person_id, tePerson, 15, 1, "/ ");
        //var sPersonSubHierarchy = ArrayMerge(fnReverseArray(fnGetSubHierarchy(tePerson.position_parent_id)), "This", "/ ");

        var docAssessmentAppraise = tools.open_doc(curObject.assessment_appraise_id);
        var teAssessmentAppraise = docAssessmentAppraise.TopElem;

        var sAssessmentAppraiseName = teAssessmentAppraise.name;
        var sAssessmentStartDate = (teAssessmentAppraise.start_date.HasValue ? StrDate(teAssessmentAppraise.start_date, false, false) : "");
        var sAssessmentEndDate = (teAssessmentAppraise.end_date.HasValue ? StrDate(teAssessmentAppraise.end_date, false, false) : "");

        //
        var arrTasksData = new Array();
        var docTask, teTask;
        var oTempTaskData

        var arrCurObjectTaskCollection = ArraySelectAll(tools.xquery("for $elem in tasks where MatchSome($elem/id,(" + ArrayMerge(curObject.tasks, "This.task_id", ",") + ")) return $elem, $elem/__data"));
        for (oTask in ArraySelect(arrCurObjectTaskCollection, "!This.parent_task_id.HasValue && This.target_object_type=='competence'"))
        {
            docTask = tools.open_doc(oTask.id);
            if (docTask == undefined)
                continue;
            teTask = docTask.TopElem;

            oTempTaskData = new Object();
            oTempTaskData.rowspan = 0;

            oTempTaskData.type = i18n.t( 'kompetenciya' );
            oTempTaskData.name = teTask.name;
            //oTempTaskData.target_level = teTask.custom_fields.ObtainChildByKey("business_target").value;

            oTempTaskData.development_methods = new Array();
            oTempTaskData.development_methods_count = 0;

            //
            xarrCurTaskDevelopmentMethods = tools.xquery("for $elem in tasks where $elem/parent_task_id = " + oTask.id + " return $elem, $elem/__data");
            for (catCurTaskDevelopmentMethod in xarrCurTaskDevelopmentMethods)
            {
                oTempDevelopmentMethod = new Object();

                //
                docCurTaskDevelopmentMethod = tools.open_doc(catCurTaskDevelopmentMethod.PrimaryKey);
                teCurTaskDevelopmentMethod = docCurTaskDevelopmentMethod.TopElem;

                oTempDevelopmentMethod.name = teCurTaskDevelopmentMethod.name;
                oTempDevelopmentMethod.development_tools = new Array();
                oTempDevelopmentMethod.development_tools_count = 0;
                arrCurDevelopmentMethodConfig = getDevelopmentObjectConfig(teCurTaskDevelopmentMethod);
                //
                xarrCurTaskDevelopmentTools = XQuery("for $elem in tasks where $elem/parent_task_id = " + catCurTaskDevelopmentMethod.id + " return $elem, $elem/__data");
                for (catCurTaskDevelopmentTool in xarrCurTaskDevelopmentTools)
                {
                    oTempDevelopmentTool = new Object();

                    //
                    docCurTaskDevelopmentTool = tools.open_doc(catCurTaskDevelopmentTool.id);
                    teCurTaskDevelopmentTool = docCurTaskDevelopmentTool.TopElem;

                    oTempDevelopmentTool.name = teCurTaskDevelopmentTool.name;
                    if(teCurTaskDevelopmentTool.target_object_type.HasValue)
                    {
                        oTempDevelopmentToolConfig = ArrayOptFind(arrCurDevelopmentMethodConfig, "This.object_name == " + CodeLiteral(teCurTaskDevelopmentTool.target_object_type.Value));
                        oTempDevelopmentTool.task_type = oTempDevelopmentToolConfig != undefined ? oTempDevelopmentToolConfig.object_title : common.exchange_object_types.GetOptChildByKey(teCurTaskDevelopmentTool.target_object_type.Value).title.Value;
                    }
                    else
                    {
                        oTempDevelopmentTool.task_type = "";
                    }
                    oTempDevelopmentTool.task_status = fNameStatus( ( teCurTaskDevelopmentTool.target_object_type.HasValue ? teCurTaskDevelopmentTool.target_object_type.Value : "default" ) , teCurTaskDevelopmentTool.custom_fields.ObtainChildByKey('status_mark').value );
                    oTempDevelopmentTool.expected_result = teCurTaskDevelopmentTool.plan;
                    oTempDevelopmentTool.planned_date = (teCurTaskDevelopmentTool.date_plan.HasValue ? StrDate(teCurTaskDevelopmentTool.date_plan, false, false) : "");

                    //
                    docTargetObject = tools.open_doc(teCurTaskDevelopmentTool.target_object_id);
                    if (docTargetObject == undefined)
                    {
                        oTempDevelopmentTool.desc = "";
                    }
                    else
                    {
                        teTargetObject = docTargetObject.TopElem;
                        try
                        {
                            oTempDevelopmentTool.desc = teTargetObject.name;
                        }
                        catch(sErr)
                        {
                            oTempDevelopmentTool.desc = "";
                        }
                    }

                    oTempDevelopmentMethod.development_tools.push(oTempDevelopmentTool);
                    oTempDevelopmentMethod.development_tools_count++;

                    oTempTaskData.rowspan++;
                }
                if (ArrayOptFirstElem(xarrCurTaskDevelopmentTools) == undefined)
                    oTempTaskData.rowspan++;

                oTempTaskData.development_methods.push(oTempDevelopmentMethod);
                oTempTaskData.development_methods_count++;
            }

            if (ArrayOptFirstElem(xarrCurTaskDevelopmentMethods) == undefined)
                oTempTaskData.rowspan++;

            arrTasksData.push(oTempTaskData);
        }

        xarrCurTaskDevelopmentMethods = ArraySelect(arrCurObjectTaskCollection, "!This.parent_task_id.HasValue && This.target_object_type=='development_method'");
        if (ArrayOptFirstElem(xarrCurTaskDevelopmentMethods) != undefined)
        {
            oTempTaskData = new Object();
            oTempTaskData.rowspan = 0;

            oTempTaskData.type = i18n.t( 'sposobrazvitiya' );
            oTempTaskData.name = i18n.t( 'dopolnitelnyem' );

            oTempTaskData.development_methods = new Array();
            oTempTaskData.development_methods_count = 0;

            //
            for (catCurTaskDevelopmentMethod in xarrCurTaskDevelopmentMethods)
            {
                oTempDevelopmentMethod = new Object();

                //
                docCurTaskDevelopmentMethod = tools.open_doc(catCurTaskDevelopmentMethod.PrimaryKey);
                teCurTaskDevelopmentMethod = docCurTaskDevelopmentMethod.TopElem;

                oTempDevelopmentMethod.name = teCurTaskDevelopmentMethod.name;
                oTempDevelopmentMethod.development_tools = new Array();
                oTempDevelopmentMethod.development_tools_count = 0;

                //
                xarrCurTaskDevelopmentTools = XQuery("for $elem in tasks where $elem/parent_task_id = " + catCurTaskDevelopmentMethod.id + " return $elem, $elem/__data");
                for (catCurTaskDevelopmentTool in xarrCurTaskDevelopmentTools)
                {
                    oTempDevelopmentTool = new Object();

                    //
                    docCurTaskDevelopmentTool = tools.open_doc(catCurTaskDevelopmentTool.id);
                    teCurTaskDevelopmentTool = docCurTaskDevelopmentTool.TopElem;

                    oTempDevelopmentTool.name = teCurTaskDevelopmentTool.name;
                    if(teCurTaskDevelopmentTool.target_object_type.HasValue)
                    {
                        oTempDevelopmentToolConfig = ArrayOptFind(arrCurDevelopmentMethodConfig, "This.object_name == " + CodeLiteral(teCurTaskDevelopmentTool.target_object_type.Value));
                        oTempDevelopmentTool.task_type = oTempDevelopmentToolConfig != undefined ? oTempDevelopmentToolConfig.object_title : common.exchange_object_types.GetOptChildByKey(teCurTaskDevelopmentTool.target_object_type.Value).title.Value;
                    }
                    else
                    {
                        oTempDevelopmentTool.task_type = "";
                    }
                    oTempDevelopmentTool.task_status = fNameStatus( ( teCurTaskDevelopmentTool.target_object_type.HasValue ? teCurTaskDevelopmentTool.target_object_type.Value : "default" ) , teCurTaskDevelopmentTool.custom_fields.ObtainChildByKey('status_mark').value );
                    oTempDevelopmentTool.expected_result = teCurTaskDevelopmentTool.plan;
                    oTempDevelopmentTool.planned_date = (teCurTaskDevelopmentTool.date_plan.HasValue ? StrDate(teCurTaskDevelopmentTool.date_plan, false, false) : "");

                    //
                    docTargetObject = tools.open_doc(teCurTaskDevelopmentTool.target_object_id);
                    if (docTargetObject == undefined)
                    {
                        oTempDevelopmentTool.desc = "";
                    }
                    else
                    {
                        teTargetObject = docTargetObject.TopElem;
                        try
                        {
                            oTempDevelopmentTool.desc = teTargetObject.name;
                        }
                        catch(sErr)
                        {
                            oTempDevelopmentTool.desc = "";
                        }
                    }

                    oTempDevelopmentMethod.development_tools.push(oTempDevelopmentTool);
                    oTempDevelopmentMethod.development_tools_count++;

                    oTempTaskData.rowspan++;
                }
                if (ArrayOptFirstElem(xarrCurTaskDevelopmentTools) == undefined)
                    oTempTaskData.rowspan++;

                oTempTaskData.development_methods.push(oTempDevelopmentMethod);
                oTempTaskData.development_methods_count++;
            }

            arrTasksData.push(oTempTaskData);
        }

        if(LdsIsClient)
            alert("PRINTFORM:\n" + EncodeJson(arrTasksData))
        else
            toLog("PRINTFORM:\n" + EncodeJson(arrTasksData))

        sHtmlForm += '\
  <tr>\
	<td colspan=7 rowspan=1  height=6 class=xl8921790 width=202 style="height:5.25pt ; width:151pt;"></td>\
  </tr>\
	<td colspan=7 rowspan=1 height=50 class=xl7421790 width=729 style="width:546pt">'+sAssessmentAppraiseName+i18n.t( 'tdtrtrheightst' )+sAssessmentStartDate+' - '+sAssessmentEndDate+'</td>\
  </tr>\
 <tr height=24 style="mso-height-source:userset;height:18.0pt">\
  <td height=24 class=xl1521790 style="height:18.0pt"></td>\
  <td class=xl6821790 width=215 style="width:161pt"></td>\
  <td class=xl6821790 width=202 style="width:151pt"></td>\
  <td class=xl6821790 width=202 style="width:151pt"></td>\
  <td class=xl6821790 width=110 style="width:83pt"></td>\
  <td class=xl6821790 width=110 style="width:83pt"></td>\
 </tr>\
 <tr height=28 style="mso-height-source:userset;height:16.5pt">\
  <td height=28 class=xl7221790 width=202 style="height:16.5pt;width:151pt">'+ sConst_ass_estimated_person +'</td>\
  <td height=28 colspan=6 class=xl8121790>'+sPersonFullname+'</td>\
 </tr>\
 <tr height=28 style="mso-height-source:userset;height:21.0pt">\
  <td height=28 class=xl7221790 width=202 style="height:21.0pt;width:151pt">'+ sConst_c_position +'</td>\
  <td colspan=6 height=28 class=xl8221790>'+sPersonPositionName+'</td>\
 </tr>\
 <tr height=60 style="mso-height-source:userset;height:50.0pt">\
  <td height=60 class=xl7221790 width=202 style="height:50.0pt;width:151pt">'+ sConst_c_subd +'</td>\
  <td height=60 colspan=6 class=xl8321790 width=729 style="width:546pt">'+sPersonOrgName+'/ '+sPersonSubHierarchy+'</td>\
 </tr>\
 <tr height=36 style="mso-height-source:userset;height:27.0pt">\
  <td height=36 class=xl7221790 width=202 style="height:27.0pt;width:151pt">'+ sConst_c_boss +'</td>\
  <td colspan=6 class=xl8221790>'+sExpertFullname+i18n.t( 'tdtrtrheightst_1' )+sWorkflowStepName+'</td>\
 </tr>\
 <tr height=28 style="mso-height-source:userset;height:21.75pt">\
  <td height=28 class=xl6321790 width=202 style="height:21.75pt;width:151pt"></td>\
  <td class=xl7321790 width=215 style="border-top:none;width:151pt">&nbsp;</td>\
  <td class=xl7321790 width=202 style="border-top:none;width:151pt">&nbsp;</td>\
  <td class=xl7321790 width=202 style="border-top:none;width:151pt">&nbsp;</td>\
  <td class=xl7321790 width=110 style="border-top:none;width:83pt">&nbsp;</td>\
  <td class=xl7321790 width=110 style="border-top:none;width:83pt">&nbsp;</td>\
 </tr>\
 <tr height=28 style="mso-height-source:userset;height:21.0pt">\
  <td rowspan=3 height=72 class=xl7921790 width=202 style="border-bottom:0.5pt solid black;height:54.0pt;width:151pt">'+ sConst_ass_competence +i18n.t( 'tdtdcolspancla' )+ sConst_ks3idixed9 +i18n.t( 'tdtdcolspancla_1' )+ sConst_vsb_expected_result +i18n.t( 'tdtdrowspancla' )+ sConst_task_type +'</td>\
  <td class=xl7121790 width=202 style="border-top:none;width:151pt">'+ sConst_task_name +'</td>\
 </tr>\
';


        arrRows = new Array();
        for (i = 0; i < ArraySum(arrTasksData, "This.rowspan"); i++)
            arrRows[i] = "";

        iNextTaskStartRow = 0;
        for (oTask in arrTasksData)
        {
            try
            {
                iCurTaskStartRow = iNextTaskStartRow;

                arrRows[iCurTaskStartRow] += "<td height=112 class=xl6721790 width=202 style='height:84.0pt;border-top: none;width:151pt' rowspan='" + oTask.rowspan + "'>";
                arrRows[iCurTaskStartRow] += "<font class=font521790>" + oTask.name + "</font>";
                arrRows[iCurTaskStartRow] += "</td>";

                iNextMethodStartRow = iCurTaskStartRow;
                if (oTask.development_methods_count > 0)
                {
                    for (oDevelopmentMethod in oTask.development_methods)
                    {

                        arrRows[iNextMethodStartRow] += "<td class=xl6421790 width=215 style='border-top:0.5pt solid black; border-left:0.5pt solid black; width:161pt' rowspan='" + oDevelopmentMethod.development_tools_count + "'>" + oDevelopmentMethod.name + "</td>";

                        if (oDevelopmentMethod.development_tools_count > 0)
                        {
                            for (iT = 0; iT < oDevelopmentMethod.development_tools_count; iT++)
                            {
                                oDevelopmentTool = oDevelopmentMethod.development_tools[iT];
                                arrRows[iNextMethodStartRow + iT] += "<td class=xl6521790 width=202 style='border-top:0.5pt solid black; border-left:0.5pt solid black; width:151pt'>" + oDevelopmentTool.task_type + "</td>";
                                arrRows[iNextMethodStartRow + iT] += "<td class=xl6521790 width=202 style='border-top:0.5pt solid black; border-left:0.5pt solid black; width:151pt'>" + oDevelopmentTool.name + "</td>";
                                arrRows[iNextMethodStartRow + iT] += "<td class=xl6421790 width=202 style='border-top:0.5pt solid black; border-left:0.5pt solid black; width:151pt'>" + oDevelopmentTool.expected_result + "</td>";
                                arrRows[iNextMethodStartRow + iT] += "<td class=xl6621790 width=110 style='border-top:0.5pt solid black; border-left:0.5pt solid black; width:83pt'>" + oDevelopmentTool.planned_date + "</td>";
                                arrRows[iNextMethodStartRow + iT] += "<td class=xl6621790 width=110 style='border-top:0.5pt solid black; border-left:0.5pt solid black; width:83pt'>" + oDevelopmentTool.task_status + "</td>";
                            }
                            iNextMethodStartRow += OptInt(oDevelopmentMethod.development_tools_count, 1);
                        }
                        else
                        {
                            arrRows[iNextMethodStartRow] += "<td class=xl6521790 width=202 style='border-top:0.5pt solid black; border-left:0.5pt solid black; width:151pt'></td>";
                            arrRows[iNextMethodStartRow] += "<td class=xl6521790 width=202 style='border-top:0.5pt solid black; border-left:0.5pt solid black; width:151pt'></td>";
                            arrRows[iNextMethodStartRow] += "<td class=xl6421790 width=202 style='border-top:0.5pt solid black; border-left:0.5pt solid black; width:151pt'></td>";
                            arrRows[iNextMethodStartRow] += "<td class=xl6621790 width=110 style='border-top:0.5pt solid black; border-left:0.5pt solid black; width:83pt'></td>";
                            arrRows[iNextMethodStartRow] += "<td class=xl6621790 width=110 style='border-top:0.5pt solid black; border-left:0.5pt solid black; width:83pt'></td>";
                            iNextMethodStartRow++;
                        }

                    }
                }
                else
                {
                    arrRows[iNextMethodStartRow] += "<td class=xl6421790 width=215 style='border-top:0.5pt solid black; border-left:0.5pt solid black; width:161pt'></td>";
                    arrRows[iNextMethodStartRow] += "<td class=xl6521790 width=202 style='border-top:0.5pt solid black; border-left:0.5pt solid black; width:151pt'></td>";
                    arrRows[iNextMethodStartRow] += "<td class=xl6521790 width=202 style='border-top:0.5pt solid black; border-left:0.5pt solid black; width:151pt'></td>";
                    arrRows[iNextMethodStartRow] += "<td class=xl6421790 width=202 style='border-top:0.5pt solid black; border-left:0.5pt solid black; width:151pt'></td>";
                    arrRows[iNextMethodStartRow] += "<td class=xl6621790 width=110 style='border-top:0.5pt solid black; border-left:0.5pt solid black; width:83pt'></td>";
                    arrRows[iNextMethodStartRow] += "<td class=xl6621790 width=110 style='border-top:0.5pt solid black; border-left:0.5pt solid black; width:83pt'></td>";
                }

                iNextTaskStartRow += OptInt(oTask.rowspan, 1);
            }
            catch(sErr)
            {
                alert(i18n.t( 'chtotoposhloneta' ) + sErr + ", task: " + tools.object_to_text(oTask, "json"));
                continue;
            }
        }
        for (oRow in arrRows)
        {
            sHtmlForm += '\
				<tr height=112 style="mso-height-source:userset;height:84.0pt">'+oRow+'</tr>'
        }
        sHtmlForm += i18n.t( 'trheightstylem' );

        arrCustomComments = curObject.custom_comments;
        if (ArrayOptFirstElem(arrCustomComments) != undefined)
        {
            bIsFirst = true;
            for (oCustomComment in arrCustomComments)
            {
                sTempComment = StrDate(oCustomComment.comment_date, false, false) + " " + oCustomComment.person_id.OptForeignElem.fullname + ": " + oCustomComment.comment;
                if (!bIsFirst)
                {
                    sHtmlForm += ' <br style="mso-data-placement:same-cell" />'
                }
                else
                {
                    bIsFirst = false;
                }
                sHtmlForm += sTempComment
            }
        }

        sHtmlForm += '\
  </td>\
 </tr>\
 <tr height=28 style="mso-height-source:userset;height:21.0pt">\
 </tr>\
</table>\
\
</div>\
';

        return sHtmlForm;
    }
    catch(er)
    { return er }
}

function process_print_form(oFormParam, iTopElemParam, bReturnFilename) {
    try
    {
        docTopElem = OpenDoc( UrlFromDocID( iTopElemParam ) );
        TopElem = docTopElem.TopElem;
    }
    catch ( err )
    {
        try
        {
            TopElem;
        }
        catch ( e )
        {
            TopElem = null;
        }
    }
    try
    {
        bReturnFilename
    }
    catch ( err )
    {
        bReturnFilename = false
    }

    function get_temp_url( sSuffix, bTrashDir )
    {
        if( bTrashDir )
            return 'x-local://trash/temp/' + tools.random_string( 10 ) + sSuffix;
        else
            return  ObtainTempFile( sSuffix )
    }

    temp_iFormID = OptInt( oFormParam );
    if ( temp_iFormID != undefined )
    {
        temp_teForm = OpenDoc( UrlFromDocID( temp_iFormID ) ).TopElem;
        temp_sRes = Trim( temp_teForm.data.GetStr() );
        if ( temp_teForm.file_encoding != 'utf-8' )
            temp_sRes = DecodeCharset( temp_sRes, temp_teForm.file_encoding );

        temp_sTempUrl = '';
        switch ( temp_teForm.type )
        {
            case 'word':
                var temp_oLib = new ActiveXObject('Websoft.Office.Word.Document');
                temp_sTempUrl = get_temp_url( '.docx', bReturnFilename );
                PutUrlData( temp_sTempUrl, temp_sRes );
                temp_oLib.Open( UrlToFilePath( temp_sTempUrl ) );
                temp_arrBookmarks = String( temp_oLib.GetBookmarks() ).split( ';' );
                for( temp_sBookmarkName in temp_arrBookmarks )
                {
                    temp_sCode = String( temp_oLib.GetBookmarkText( temp_sBookmarkName ) );
                    if( temp_sCode.charAt(0) == '=')
                    {
                        temp_sCode = temp_sCode.substr( 1 );
                        if( temp_sCode.charAt(0) == '=')
                        {
                            temp_sCode = temp_sCode.substr( 1 );
                            temp_oLib.SetBookmarkText( temp_sBookmarkName, eval( temp_sCode ) );
                        }
                        else
                        {
                            temp_oLib.SetBookmarkHtml( temp_sBookmarkName, eval( temp_sCode ) );
                        }
                    }
                }
                temp_oLib.Save();
                break;

            case 'pdf':
                temp_sFileSuffix = UrlPathSuffix( temp_teForm.file_name );
                if ( temp_sFileSuffix == '.html' || temp_sFileSuffix == '.htm' )
                {
                    temp_sRes = EvalCodePage( temp_sRes );
                    temp_sTempUrl = get_temp_url( '.pdf', bReturnFilename );
                    tools.html_to_pdf( temp_sRes, '', UrlToFilePath( temp_sTempUrl ) );
                }
                break;

            case 'word_pdf':
                var temp_oLib = new ActiveXObject('Websoft.Office.Word.Document');
                temp_sTempUrl = get_temp_url( '.docx', false );
                PutUrlData( temp_sTempUrl, temp_sRes );
                temp_oLib.Open( UrlToFilePath( temp_sTempUrl ) );
                temp_arrBookmarks = String( temp_oLib.GetBookmarks() ).split( ';' );
                for( temp_sBookmarkName in temp_arrBookmarks )
                {
                    temp_sCode = String( temp_oLib.GetBookmarkText( temp_sBookmarkName ) );
                    if( temp_sCode.charAt(0) == '=')
                    {
                        temp_sCode = temp_sCode.substr( 1 );
                        if( temp_sCode.charAt(0) == '=')
                        {
                            temp_sCode = temp_sCode.substr( 1 );
                            temp_oLib.SetBookmarkText( temp_sBookmarkName, eval( temp_sCode ) );
                        }
                        else
                        {
                            temp_oLib.SetBookmarkHtml( temp_sBookmarkName, eval( temp_sCode ) );
                        }
                    }
                }
                temp_sTempUrl = get_temp_url( '.pdf', bReturnFilename );
                temp_oLib.SaveAs(UrlToFilePath( temp_sTempUrl ) );
                break;

            default:

                temp_sRes = EvalCodePage( temp_sRes );
                if( bReturnFilename )
                {
                    fldType = temp_teForm.type.ForeignElem;
                    temp_sTempUrl = get_temp_url( '.' + fldType.extension, bReturnFilename );
                    PutUrlData( temp_sTempUrl, temp_sRes );
                }
                break;
        }
        if ( temp_sTempUrl != '' )
        {
            if( bReturnFilename )
            {
                return temp_sTempUrl
            }
            else
            {
                temp_sRes = LoadUrlData( temp_sTempUrl );
                try
                {
                    DeleteUrl( temp_sTempUrl );
                }
                catch ( err )
                {
                }
            }
        }
    }
    else
    {
        if ( StrContains( oFormParam, '../' ) || StrContains( oFormParam, '..\\' ) )
            throw 'Form is not correct.';

        temp_sRes = LoadUrlText( UrlAppendPath( 'x-local://templates/', oFormParam ) );
        temp_sRes = EvalCodePage( temp_sRes );
    }

    return temp_sRes;
}

function printReport( vArrColumns, vArrData ) {
    var oRow, oColumn;
    var sFilePath = "";
    var arrColumns = vArrColumns;
    var arrRecs = vArrData;
    var oParamFormParam = OpenNewDoc( 'x-local://wtv/ui_forms/websoft_assessment_pdp_ext/app_pdp_ext_export_excel.xmd' ).TopElem;
    var oDataFormParam = OpenNewDoc( 'x-local://wtv/wtv_form_table_data.xmd' ).TopElem;

    if( IsArray( arrColumns ) && IsArray( arrRecs ) )
    {
        for( oCol in arrColumns )
        {
            oColumn = oParamFormParam.columns.AddChild();
            oColumn.name = oCol.name;
            oColumn.const = oCol.const;

            oColumn.row = oCol.GetOptProperty( "row", oColumn.row );
            oColumn.hspan = oCol.GetOptProperty( "hspan", oColumn.hspan );
            oColumn.vspan = oCol.GetOptProperty( "vspan", oColumn.vspan );
        }

        for( oRec in arrRecs )
        {
            oRow = oDataFormParam.rs.AddChild();
            for( oCol in arrColumns )
            {
                oColumn = oRow.cs.AddChild();
                oColumn.name = oCol.name;
                oColumn.t = oRec.GetOptProperty( oCol.name, "" );
            }
        }

        oPrint = tools_report.fnCreateExcelFile( null, oParamFormParam, oDataFormParam );
        sFilePath = "x-local://trash/temp/websoft_pdp_ext_report_" + Year( Date() ) + "_" + Month( Date() ) + "_" + Day( Date() ) + "_" + Hour( Date() ) + Minute( Date() ) + "_" + Second( Date() ) + ".xlsx";

        oPrint.SaveAs( UrlToFilePath( sFilePath ) );
    }

    return sFilePath;
}

function SetTaskBlock( iAssID, oAss, oPA ) {
    var bFlagCorrectStrong = tools_web.is_true(tools_app.get_cur_settings("flag_correct_strong", "instance", null, null, null, iAssID, oAss));
    var bBlockDelete = tools_web.is_true(tools_app.get_cur_settings("block_delete", "instance", null, null, null, iAssID, oAss));
    if ( bFlagCorrectStrong || bBlockDelete)
    {
        for (_id in oPA.tasks)
        {
            _tdoc = tools.open_doc(_id.task_id);
            if ( _tdoc != undefined )
            {
                if ( bFlagCorrectStrong )
                {
                    _tdoc.TopElem.custom_fields.ObtainChildByKey("block_strong").value = "true";
                }
                if ( bBlockDelete )
                {
                    _tdoc.TopElem.custom_fields.ObtainChildByKey("block_delete").value = "true";
                }
                _tdoc.Save();
            }
        }
    }
    return true;
}

function workflow_action_to_manager (curPAID, docPA, _curState) {
    try{
        var sBruteMessage = "";
        var bWorkflowActionBreak = false;
        var bWorkflowCreateBreak = false;

        var iCountSelectedCompetence = 0;
        var iCountTaskSumTotal = 0;
        var arrCountsTaskInCompetences = [];
        var bIsReady = true;
        var bIsDeveloperTaskCountCorrect = true;
        var arrErrorMsg = [];
        var bHasIsSelect = false;
        var sCompetenceViewType = tools_app.get_cur_settings("competence_view_type", "instance", null, null, null, curPAID); //Способ выбора развиваемых компетенций
        var arrOmnyDevelopmentMethodIDs = tools.call_code_library_method('libAssessmentPdpExt', 'fnStringToArray', [tools_app.get_cur_settings("omny_development_method_ids", "instance", null, null, null, curPAID)]);
        var bOmnyDevelopmentMethodIsOverlay = tools_web.is_true(tools_app.get_cur_settings("omny_development_methods_is_overlay", "instance", null, null, null, curPAID));
        var arrAddObjectiveIDs = tools.call_code_library_method('libAssessmentPdpExt', 'fnStringToArray', [tools_app.get_cur_settings("add_category_ids", "instance", null, null, null, curPAID)]);
        var bAddAllDevelopmentMethods = tools_web.is_true(tools_app.get_cur_settings("add_all_dev_methods", "instance", null, null, null, curPAID));
        var bCalculateCompetenceOnly = tools_web.is_true(tools_app.get_cur_settings("is_competence_only", "instance", null, null, null, curPAID));
        var sCommonErrorMessage = tools_app.get_cur_settings("error_message", "instance", null, null, null, curPAID);
        if ( sCommonErrorMessage == "" )
        {
            sCommonErrorMessage = i18n.t( 'nevozmozhnootpr' );
        }

        curPA = docPA.TopElem;
        var arrCurPATasks = ArraySelectAll(XQuery("for $obj in tasks where MatchSome($obj/id,(" + ArrayMerge(curPA.tasks,"This.task_id",",") + ")) return $obj"))
        if (ArrayCount(arrCurPATasks)!=0)
        {
            var iCurCountsTaskInCompetences;
            var arrCurDevelopmentMethodConfigL2 = [];
            var arrCurDevelopmentMethodConfigL3 = [];
            var oCurDevelopmentMethodCountsL2 ={};
            var oCurDevelopmentMethodCountsL3 = {};

            var sAllowedObjectNameTypes = tools_app.get_cur_settings('allowed_object_types', 'app', null, null, null, curPAID);
            var arrAllowedObjectNameTypes = sAllowedObjectNameTypes != '' ? ParseJson(sAllowedObjectNameTypes) : [];
            var oAllDevelopmentTaskTypeCount = {};
            for(itemAllowedObjectNameType in arrAllowedObjectNameTypes)
            {
                oAllDevelopmentTaskTypeCount.SetProperty(itemAllowedObjectNameType.name, 0);
            }

            //for (itemObjectiveLev1 in oData.data.objectives)
            for (itemObjectiveLev1 in ArraySelect(arrCurPATasks,"This.parent_task_id==null") )
            {
                itemTaskL1 = ArrayOptFind(arrCurPATasks, "This.id==" + itemObjectiveLev1.id);
                if (itemTaskL1 != undefined)
                {
                    itemTaskTEL1 = tools.open_doc(itemObjectiveLev1.id).TopElem;
                    arrCurDevelopmentMethodConfigL2 = [];
                    oCurDevelopmentMethodCountsL2 = {};
                    if(itemTaskL1.target_object_type.Value == "development_method" && !bCalculateCompetenceOnly)
                    {
                        arrCurDevelopmentMethodConfigL2 = ArraySelect(getDevelopmentObjectConfig(itemTaskL1.target_object_id.Value), 'This.is_target_task');
                        for(itemDMConfig in arrCurDevelopmentMethodConfigL2)
                        {
                            oCurDevelopmentMethodCountsL2.SetProperty(itemDMConfig.object_name, 0);
                        }
                    }

                    bIsSelect = (itemTaskL1.target_object_type.Value == "competence" && tools_web.is_true(itemTaskTEL1.custom_fields.ObtainChildByKey("is_select").value) && !tools_web.is_true(itemTaskTEL1.custom_fields.ObtainChildByKey("flag_cancel").value) );
                    if(bIsSelect)
                    {
                        bHasIsSelect = true;
                        iCountSelectedCompetence++;
                    }
                }

                if (ArrayCount(ArraySelect(arrCurPATasks,"This.parent_task_id=="+itemObjectiveLev1.id))!=0)
                {
                    if(bIsSelect)
                    {
                        iCurCountsTaskInCompetences = ArrayCount(ArraySelect(arrCurPATasks,"This.parent_task_id=="+itemObjectiveLev1.id));
                        arrCountsTaskInCompetences.push({competence_id: OptInt(itemTaskTEL1.custom_fields.ObtainChildByKey("competence_id").value, 0), count: iCurCountsTaskInCompetences})
                        iCountTaskSumTotal += iCurCountsTaskInCompetences
                    }

                    for (itemObjectiveLev2 in ArraySelect(arrCurPATasks,"This.parent_task_id=="+itemObjectiveLev1.id))
                    {
                        itemTaskL2 = ArrayOptFind(arrCurPATasks,"This.id==" + itemObjectiveLev2.id);

                        if (itemTaskL2 != undefined)
                        {
                            if(bIsSelect && !tools_web.is_true(itemTaskL2.status))
                            {
                                bIsReady = false;
                            }
                            itemTaskTEL2 = tools.open_doc(itemObjectiveLev2.id).TopElem;
                            if(oCurDevelopmentMethodCountsL2.HasProperty(itemTaskL2.target_object_type.Value) && !tools_web.is_true(itemTaskTEL2.custom_fields.ObtainChildByKey("flag_cancel").value))
                                oCurDevelopmentMethodCountsL2[itemTaskL2.target_object_type.Value]++;

                            if( !bCalculateCompetenceOnly && !tools_web.is_true(itemTaskTEL2.custom_fields.ObtainChildByKey("flag_cancel").value) )
                            {
                                if(oAllDevelopmentTaskTypeCount.HasProperty(itemTaskL2.target_object_type.Value))
                                    oAllDevelopmentTaskTypeCount[itemTaskL2.target_object_type.Value]++
                            }

                            arrCurDevelopmentMethodConfigL3 = [];
                            oCurDevelopmentMethodCountsL3 = {};
                            if(itemTaskL2.target_object_type.Value == "development_method" )
                            {
                                arrCurDevelopmentMethodConfigL3 = ArraySelect(tools.call_code_library_method('libAssessmentPdpExt', 'getDevelopmentObjectConfig', [itemTaskL2.target_object_id.Value]), 'This.is_target_task');
                                for(itemDMConfig in arrCurDevelopmentMethodConfigL3)
                                {
                                    oCurDevelopmentMethodCountsL3.SetProperty(itemDMConfig.object_name, 0);
                                }
                            }
                        }

                        if(ArrayCount(ArraySelect(arrCurPATasks,"This.parent_task_id=="+itemObjectiveLev2.id))!=0)
                        {
                            for (itemObjectiveLev3 in ArraySelect(arrCurPATasks,"This.parent_task_id=="+itemObjectiveLev2.id))
                            {

                                itemTaskL3 = ArrayOptFind(arrCurPATasks,"This.id==" + itemObjectiveLev3.id);
                                if (itemTaskL3 != undefined)
                                {
                                    itemTaskTEL3 = tools.open_doc(itemObjectiveLev3.id).TopElem;
                                    if ( !tools_web.is_true(itemTaskTEL3.custom_fields.ObtainChildByKey("flag_cancel").value) )
                                    {
                                        if(oCurDevelopmentMethodCountsL3.HasProperty(itemTaskL3.target_object_type.Value))
                                            oCurDevelopmentMethodCountsL3[itemTaskL3.target_object_type.Value]++;
                                        if(oAllDevelopmentTaskTypeCount.HasProperty(itemTaskL3.target_object_type.Value))
                                            oAllDevelopmentTaskTypeCount[RValue(itemTaskL3.target_object_type.Value)]++
                                    }
                                }
                            }

                            for(itemDMConfig in arrCurDevelopmentMethodConfigL3)
                            {
                                if(oCurDevelopmentMethodCountsL3[itemDMConfig.object_name] < OptInt(itemDMConfig.min, 0) || oCurDevelopmentMethodCountsL3[itemDMConfig.object_name] > OptInt(itemDMConfig.max, 100500))
                                {
                                    bIsDeveloperTaskCountCorrect = false;
                                    arrErrorMsg.push(i18n.t( 'nekorrektnoeko' ) + itemTaskL1.name + " / " + itemObjectiveLev2.name + " / " + itemDMConfig.object_title + " ] : " + oCurDevelopmentMethodCountsL3[itemDMConfig.object_name] + i18n.t( 'dolzhnobytnemen' ) + itemDMConfig.min + (itemDMConfig.max == null ? "" : i18n.t( 'inebolee' ) + itemDMConfig.max) + " )")
                                }
                            }
                        }
                    }

                    for(itemDMConfig in arrCurDevelopmentMethodConfigL2)
                    {
                        if(oCurDevelopmentMethodCountsL2[itemDMConfig.object_name] < OptInt(itemDMConfig.min, 0) || oCurDevelopmentMethodCountsL2[itemDMConfig.object_name] > OptInt(itemDMConfig.max,
                            100500))
                        {
                            bIsDeveloperTaskCountCorrect = false;
                            arrErrorMsg.push(i18n.t( 'nekorrektnoeko' ) + itemTaskL1.name + " / " + itemDMConfig.object_title + " ] : " + oCurDevelopmentMethodCountsL2[itemDMConfig.object_name] + i18n.t( 'dolzhnobytnemen' ) + itemDMConfig.min + (itemDMConfig.max == null ? "" : i18n.t( 'inebolee' ) + itemDMConfig.max) + " )")
                        }
                    }
                }
                else if(bIsSelect)
                {
                    arrCountsTaskInCompetences.push({competence_id: OptInt(tools.open_doc(itemObjectiveLev1.id).TopElem.custom_fields.ObtainChildByKey("competence_id").value, 0), count: 0})
                    bIsReady = false;
                }

            }
            for(itemDMConfig in arrAllowedObjectNameTypes)
            {
                if(oAllDevelopmentTaskTypeCount[itemDMConfig.name] > OptInt(itemDMConfig.max, 100500))
                {
                    bIsDeveloperTaskCountCorrect = false;
                    arrErrorMsg.push(i18n.t( 'nekorrektnoeob' ) + common.exchange_object_types.GetOptChildByKey(itemDMConfig.name).title.Value + "\" : " + oAllDevelopmentTaskTypeCount[itemDMConfig.name] + i18n.t( 'dolzhnobytnebol' ) + itemDMConfig.max + " )")
                }
            }
        }


        bIsReady = bIsReady && bHasIsSelect;

        var iCountTaskMinInCompetence = ArrayOptFirstElem(arrCountsTaskInCompetences) != undefined ? ArrayMin(arrCountsTaskInCompetences, "This.count").count : 0;
        var iMinNumCompetences = OptInt(tools_app.get_cur_settings("min_num_competence", "instance", null, null, null, curPAID), 0);
        var iMinNumTasksInCompetence = OptInt(tools_app.get_cur_settings("min_num_devmethod_in_competence", "instance", null,  null, null, curPAID), 0);
        var iMinNumTasksTotal = OptInt(tools_app.get_cur_settings("min_num_devmethod_sumtotal", "instance", null,  null, null, curPAID), 0);
        var iMaxNumTasksTotal = OptInt(tools_app.get_cur_settings("max_num_devmethod_sumtotal", "instance", null,  null, null, curPAID), 200);

        var bIsDone = curPA.is_done && bIsDeveloperTaskCountCorrect && iCountSelectedCompetence >= iMinNumCompetences && (bAddAllDevelopmentMethods || (iCountTaskMinInCompetence >= iMinNumTasksInCompetence &&  iCountTaskSumTotal >= iMinNumTasksTotal && iCountTaskSumTotal <= iMaxNumTasksTotal));
        if ( !bIsDone && _curState != "action" )
        {
            sBruteMessage =  sCommonErrorMessage;
            bWorkflowActionBreak = true;
            bWorkflowCreateBreak = true;
        }
    }
    catch(sErr) {
        sBruteMessage = String(sErr).split("(Unknown")[0];
        bWorkflowActionBreak = true;
        bWorkflowCreateBreak = true;
    }

    return {"brute_message": sBruteMessage, "workflow_action_break": bWorkflowActionBreak, "workflow_create_break": bWorkflowCreateBreak};
}

/**
 * @function GetTaskTypeList
 * @memberof Websoft.WT.App360
 * @author DS
 * @description Коллекция типов задач.
 * @param {bigint} iApplicationID - ID текущего приложения
 * @param {object} oSort - Условия сортировки
 * @param {string} sFilter - Условия фильтра xquery
 * @param {boolean} bInstanceOnly - Учитывыть только объекты связанные с приложением
 * @returns {object} oRes
 */
function GetTaskTypeList(iApplicationID, oSort, sFilter, bInstanceOnly) {
    var oRes = tools.get_code_library_result_object();
    oRes.array = []
    var arrXqCond = [];
    var xqCond = "";
    var xqSort = "$elem/start_date descending";
    bInstanceOnly = !tools_web.is_true(bInstanceOnly);


    try
    {
        if( sSearch == undefined || sSearch == null )
        {
            sSearch = "";
        }
        else
        {
            sSearch = String( sSearch );
        }
    }
    catch( err )
    {
        sSearch = "";
    }


    if(bInstanceOnly)
    {
        iApplicationID = OptInt(iApplicationID, 0);
        if( iApplicationID != 0 )
        {
            arrXqCond.push("MatchSome($elem/app_instance_id, ( " + XQueryLiteral('0x'+StrHexInt(iApplicationID)) + " ))");
        }
    }

    if(sSearch!="")
    {
        arrXqCond.push(" and doc-contains( $elem/id, 'wt_data', " + XQueryLiteral( sSearch ) + " )");
    }

    if(sFilter!="")
    {
        arrXqCond.push(sFilter);
    }

    if( ArrayOptFirstElem(arrXqCond) != undefined )
    {
        xqCond += " where " + ArrayMerge(arrXqCond, "This", " and ");
    }

    if(ObjectType(oSort) == 'JsObject' && oSort.FIELD != null && oSort.FIELD != undefined && oSort.FIELD != "" )
    {
        xqSort = "$elem/" + oSort.FIELD + ( oSort.DIRECTION == "DESC" ? " descending" : "" );
    }

    var sReq = "for $elem in task_types " + xqCond + " order by " + xqSort + " return $elem";
    var arrResult = ArraySelectAll(tools.xquery(sReq));

    for( _res in arrResult )
    {
        oRes.array.push({
            id: RValue(_res.id),
            code: RValue(_res.code),
            name: RValue(_res.name)
        });
    }

    return oRes;
}

/**
 * @function GetDevelopmentMethodList
 * @memberof Websoft.WT.App360
 * @author DS
 * @description Коллекция способов развития.
 * @param {bigint} iApplicationID - ID текущего приложения
 * @param {object} oSort - Условия сортировки
 * @param {string} sFilter - Условия фильтра xquery
 * @param {boolean} bInstanceOnly - Учитывыть только объекты связанные с приложением
 * @returns {object} oRes
 */
function GetDevelopmentMethodList(iApplicationID, oSort, sFilter, bInstanceOnly, sSearch) {
    var oRes = tools.get_code_library_result_object();
    oRes.array = []
    var arrXqCond = [];
    var xqCond = "";
    var xqSort = "$elem/start_date descending";
    bInstanceOnly = !tools_web.is_true(bInstanceOnly);


    try
    {
        if( sSearch == undefined || sSearch == null )
        {
            sSearch = "";
        }
        else
        {
            sSearch = String( sSearch );
        }
    }
    catch( err )
    {
        sSearch = "";
    }


    if(bInstanceOnly)
    {
        iApplicationID = OptInt(iApplicationID, 0);
        if( iApplicationID != 0 )
        {
            arrXqCond.push("MatchSome($elem/app_instance_id, ( " + XQueryLiteral('0x'+StrHexInt(iApplicationID)) + " ))");
        }
    }

    if(sSearch!="")
    {
        arrXqCond.push(" and doc-contains( $elem/id, 'wt_data', " + XQueryLiteral( sSearch ) + " )");
    }

    if(sFilter!="")
    {
        arrXqCond.push(sFilter);
    }

    if( ArrayOptFirstElem(arrXqCond) != undefined )
    {
        xqCond += " where " + ArrayMerge(arrXqCond, "This", " and ");
    }

    if(ObjectType(oSort) == 'JsObject' && oSort.FIELD != null && oSort.FIELD != undefined && oSort.FIELD != "" )
    {
        xqSort = "$elem/" + oSort.FIELD + ( oSort.DIRECTION == "DESC" ? " descending" : "" );
    }

    var sReq = "for $elem in development_methods " + xqCond + " order by " + xqSort + " return $elem";
    var arrResult = ArraySelectAll(tools.xquery(sReq));

    for( _res in arrResult )
    {
        oRes.array.push({
            id: RValue(_res.id),
            code: RValue(_res.code),
            name: RValue(_res.name)
        });
    }

    return oRes;
}