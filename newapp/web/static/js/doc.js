/**
 * Created by Administrator on 2016/12/31.
 */
$(function () {
    var ipMap = {
        "innerNet":"192.168.1.101:80",
        "outNet":"192.168.202.46:80"
    }
    var servletMap = {
        "login":"LoginServlet",
        "doclist":"DocListServlet",
        "docTemp":"DocTemplateServlet",
        "docQuery":"DocQueryServlet",
        "docRef":"DocRefListServlet",
        "docSave":"DocSaveServlet",
        "docUpdate":"DocUpdateServlet",
        "docDelete":"DocDeleteServlet"
    }
    var userName  ;
    var refRowData ;
    var currRefName ;
    var refSeachMap = {

    } ;
    var docType = '' ;
    var docName = '' ;
    var templateData ;

    var currRefFieldCode ;
    $(window).on("hashchange",function () {
        render(window.location.hash) ;
    })
    function render(url) {
        var temp = url.split('/')[0]  ;
        if(userName != undefined && temp == ""){
            return ;
        }
        $(".page").css("display","none") ;
        var map = {
            "":function () {
                $("#loginPage").css("display","block") ;
                renderLogin() ;
            },
            "#docList":function () {
                $("#docListPage").css("display","block") ;
                renderDocList() ;
            },
            "#doc":function () {
                $("#docPage").css("display","block") ;
                renderDoc() ;
            }
        } ;
        if(map[temp]){
            map[temp]() ;
        }
    }
    function renderLogin() {
        function createCode() {
            var code = "";
            var codeLength = 5;//验证码的长
            var random = new Array( 0, 1, 2, 3, 4, 5, 6, 7, 8, 9);//随机数
            for (var i = 0; i < codeLength; i++) {//循环操作
                var index = Math.floor( Math.random() * 10 );//取得随机数的索引（0~35）
                code += random[index];//根据索引取得随机数加到code上
            }
            $("#checkCode").val(code);//把code值赋给验证码
        }
        $('.login-form').bootstrapValidator({
            feedbackIcons: {
                valid: 'glyphicon glyphicon-ok',
                invalid: 'glyphicon glyphicon-remove',
                validating: 'glyphicon glyphicon-refresh'
            },
            fields: {
                username: {
                    validators: {
                        notEmpty: {
                            message: '用户名不能为空'
                        }
                    }
                },
                password: {
                    validators: {
                        notEmpty: {
                            message: '密码不能为空'
                        }
                    }
                },
                checkCodeInput:{
                    validators: {
                        notEmpty: {
                            message: '验证码不能为空'
                        },
                        callback: {
                            message: '错误',
                            callback: function(value, validator) {
                                var checkCodeInput  = $("#checkCodeInput").val() ;
                                var checkCode = $("#checkCode").val();
                                if (checkCodeInput.toLowerCase() != checkCode.toLowerCase()) {
                                    return false ;
                                }else {
                                    return true ;
                                }
                            }
                        }
                    }
                }
            }
        });
        $('#checkCode').click(function () {
            createCode() ;
        }) ;
        $('#btn_login').click(function () {
            $('.login-form').data("bootstrapValidator").validate() ;
            var flag = $('.login-form').data("bootstrapValidator").isValid() ;
            if(!flag){
                $('#checkCode').trigger("click") ;
                return ;
            }
            userName = $('.login-form #username').val() ;

            $.ajax( {
                type: "post",
                url: getServerUrl("login") + JSON.stringify( {"username": userName, "password": $('.login-form #password').val()} ),
                success: function (data, status) {
                    if (data["success"] == "Y") {
                        window.location.hash = "docList" ;
                    } else {
                        alert( data["msg"] );
                        $('#checkCode').trigger("click") ;
                    }
                },
                error: function (arg1, arg2, arg3) {
                    alert("登陆失败");
                    $('#checkCode').trigger("click") ;
                }
            } )
            return false;
        }) ;
        $('#checkCode').trigger("click") ;
    }
    function renderDocList() {
        $("#docListMenu li").remove() ;
        $.ajax({
            type: "post",
            url: getServerUrl("doclist")+JSON.stringify( {"username":userName}),
            success: function (data, status) {
                if (data["success"] == "Y") {
                    var docListData = data["result"] ;
                    var map = {} ;
                    for(var i = 0 ; i < docListData.length ; i++){
                        if(!map[docListData[i]["docsupername"]]){
                            map[docListData[i]["docsupername"]] = {
                                "docSuperName" : docListData[i]["docsupername"] ,
                                "docDetails" :[{
                                    "doctypecode":docListData[i]["doctypecode"],
                                    "doctypename":docListData[i]["doctypename"]
                                }]
                            } ;
                        }else{
                            map[docListData[i]["docsupername"]]["docDetails"].push({
                                "doctypecode":docListData[i]["doctypecode"],
                                "doctypename":docListData[i]["doctypename"]
                            }) ;
                        }
                    }
                    var theTemplateScript = $("#docList-template").html();
                    var theTemplate = Handlebars.compile (theTemplateScript);
                    var templateHtml = theTemplate(map) ;
                    $('#docListMenu').append (templateHtml);
                }
            },
            error: function () {
                alert('Error');
            }
        });
        $("#logOff").unbind("click") ;
        $("#logOff").click(function () {
            if (confirm("确认要退出吗？") == true) {
                userName = undefined ;
                window.location.hash = "" ;
            }else{
                return ;
            }
        }) ;
    }
    function renderDoc() {
        var url = window.location.hash ;
        docType = url.split('/')[1] ;
        docName = decodeURI(url.split('/')[2]) ;
        templateData ;

        currRefFieldCode ;
        $("#docPage h3").html(docName) ;
        $.ajax({
            type: "post",
            url:getServerUrl("docTemp")+JSON.stringify({"doctypecode":docType,"username":userName}) ,
            success: function (demand) {
                if (demand["success"] == "Y") {
                    templateData = demand.result;

                    for(var i = 0 ; i < templateData.length ; i++){
                        if(templateData[i]["is_addtemp"] == 'N'){
                            delete templateData[i]["is_addtemp"] ;
                        }
                        if(templateData[i]["is_qrytemp"] == 'N'){
                            delete templateData[i]["is_qrytemp"] ;
                        }
                        if(templateData[i]["is_edittemp"] == 'N'){
                            delete templateData[i]["is_edittemp"] ;
                        }
                    }

                    if(templateData.length == 0){
                        errorWhenGenerateDocTemp("当前档案未配置手机模板，请联系管理员") ;
                    }else{
                        generateDocTemplate() ;
                        setBtnPower(demand["button"]) ;
                    }
                }else{
                    errorWhenGenerateDocTemp(demand["msg"]) ;
                }
            },
            error: function () {
                errorWhenGenerateDocTemp("加载模板失败")  ;
            }
        }) ;

        function generateDocTemplate() {
            var expandIndex ;
            $('#doc_table').bootstrapTable("destroy") ;
            $('#doc_table').bootstrapTable({
                toolbar: '#toolbar',                //工具按钮用哪个容器
                striped: true,                      //是否显示行间隔色
                cache: false,                       //是否使用缓存，默认为true，所以一般情况下需要设置一下这个属性（*）
                pagination: true,                   //是否显示分页（*）
                sortable: false,                     //是否启用排序
                sidePagination: "client",           //分页方式：client客户端分页，server服务端分页（*）
                pageNumber: 1,                       //初始化加载第一页，默认第一页
                pageSize: 10,                       //每页的记录行数（*）
                pageList: [10, 25, 50, 100],        //可供选择的每页的行数（*）
                search: false,                       //是否显示表格搜索，此搜索是客户端搜索，不会进服务端，所以，个人感觉意义不大
                strictSearch: true,
                showColumns: false,                  //是否显示所有的列
                showRefresh: false,                  //是否显示刷新按钮
                minimumCountColumns: 2,             //最少允许的列数
                clickToSelect: false,                //是否启用点击选中行
                // height: 500,                        //行高，如果没有设置height属性，表格自动根据记录条数觉得表格高度
                showToggle: false,                    //是否显示详细视图和列表视图的切换按钮
                cardView: false,                    //是否显示详细视图
                detailView: true,                   //是否显示父子表
                columns: getTableColumns(),
                detailFormatter: listTableDetail,
                onClickRow:onTableRowClick,
                uniqueId:getIdField()
            });
            generateModalTemp() ;
            function generateModalTemp() {
                $(".modal-body .form-group").remove()  ;

                Handlebars.registerHelper('inputHtml', function(temp) {
                    var fieldCode = temp["fieldcode"] ;
                    var fieldName = temp["fieldname"] ;
                    var fieldType = temp["fieldtype"] ;
                    var showFlag = temp["showflag"] == 'Y' ? true : false ;
                    var isRef = temp["fieldtype"] == "ref" ? true : false ;
                    var isQryTemp = temp["is_qrytemp"] != undefined &&  temp["is_qrytemp"] == "Y"
                    var inPutType = fieldType == "number" ? "number":"text" ;
                    var html = '' ;

                    html += '<div class="form-group">' ;
                    if(showFlag || isQryTemp){
                        html += '<label for="'+fieldCode+'">'+fieldName+'</label>' ;
                    }

                    if(isRef){
                        html += '<div class="form-group input-group">' ;
                    }
                    html += '<input ' ;
                    html += 'type="'+inPutType +'" id="'+fieldCode+'" ' ;
                    if(temp["maxlength"] != undefined && temp["maxlength"] != 0){
                        html += 'maxlength='+temp["maxlength"] ;
                    }
                    if(fieldType == "number"){
                        html += ' onchange="validateFloatKeyPress(this,'+temp["digits"]+') "' ;
                    }
                    html += ' class="form-control ';
                    if(temp["is_editfield"] == undefined || temp["is_editfield"]=='Y'){
                        html += fieldType ;
                    }
                        html += ' "' ;
                    if(temp["is_editfield"] != undefined && temp["is_editfield"]=='N'){
                        html += " readonly " ;
                    }
                    if(!showFlag && !isQryTemp){
                        html += ' style="display: none;"' ;
                    }
                    html += '>' ;

                    if(isRef){
                        html += '<span class="input-group-btn"><a data-toggle="modal" class="btn btn-default" href="#refModal" ' ;
                        if(temp["is_editfield"] != undefined && temp["is_editfield"]=='N'){
                            html += ' disabled="disabled" ' ;
                        }
                        html += '><i class="fa fa-search" ></i></a></span>' ;
                        html += '</div>' ;
                    }
                    return new Handlebars.SafeString(html);
                })  ;
                // Handlebars.registerHelper('isAddTemp', function(temp) {
                //     return temp["is_addtemp"] == "Y" ? true : false ;
                // }) ;
                // Handlebars.registerHelper('isQryTemp', function(temp) {
                //     return temp["is_qrytemp"] == "Y" ? true : false ;
                // }) ;
                // Handlebars.registerHelper('isEditTemp', function(temp) {
                //     return temp["is_edittemp"] == "Y" ? true : false ;
                // } );
                var modals = [
                    {
                        "tempName" : "qry_modal_temp",
                        "formName" : "qry_modal_form"
                    },
                    {
                        "tempName" : "add_modal_temp",
                        "formName" : "add_modal_form"
                    },
                    {
                        "tempName" : "edit_modal_temp",
                        "formName" : "edit_modal_form"
                    }
                ]
                modals.forEach(function (names) {
                    var theTemplateScript = $("#"+names["tempName"]).html();
                    var theTemplate = Handlebars.compile (theTemplateScript);
                    var templateHtml = theTemplate(templateData) ;
                    $('#'+names["formName"]).append (templateHtml);
                })
                initDatePicker() ;
                initRefMadal() ;
                modaleSet() ;
            }
            function getTableColumns() {
                var columns = [] ;
                columns.push({"checkbox": true}) ;
                for (var i = 0 ; i < templateData.length ; i++){
                    if(templateData[i]["is_single_listtemp"] != "Y" ) {
                        continue ;
                    }
                    var column = {
                        "field":templateData[i]["fieldcode"] ,
                        "title":templateData[i]["fieldname"] ,
                    } ;
                    if(templateData[i]["showflag"] == "N"){
                        column["visible"] = false ;
                    }
                    columns.push(column) ;
                }
                columns.push({
                    field: 'operate',
                    title: '',
                    align: 'center',
                    events: {
                        'click .roweidt': function (e, value, row, index) {
                            for(var value in row){
                                $("#editModal #"+value).val(row[value]) ;
                            }
                            $("#editModal").modal() ;
                        }
                    },
                    formatter: function operateFormatter(value, row, index) {
                        return [
                            '<a class="roweidt" href="#">',
                            '>',
                            '</a> '
                        ].join('');
                    }
                })
                return columns ;
            }
            function listTableDetail(index, row) {
                var html = [];


                for(var i = 0 ; i < templateData.length ; i++){
                    if(templateData[i]["is_listtemp"] == "Y" && templateData[i]["showflag"] == "Y"){
                        html.push('<p><b>'+templateData[i]["fieldname"]+':</b> '+row[templateData[i]["fieldcode"]]+'</p>');
                    }
                }

                return html.join('');
            }
            function onTableRowClick(row,ele,field) {
                if(expandIndex == undefined){
                    $('#doc_table').bootstrapTable("expandRow",ele.data("index")) ;
                    expandIndex = ele.data("index") ;
                }else{
                    $('#doc_table').bootstrapTable("collapseAllRows",false) ;
                    if(expandIndex != ele.data("index")){
                        expandIndex = ele.data("index") ;
                        $('#doc_table').bootstrapTable("expandRow",ele.data("index")) ;
                    }else{
                        expandIndex = -1 ;
                    }
                }

            }


            function initDatePicker() {
                $('.year').datepicker({
                    format:'yyyy',
                    language:'zh-CN',
                    autoclose:true,
                    minViewMode: 2,
                    maxViewMode: 2,
                    enableOnReadonly:false
                });
                $('.month').datepicker({
                    format:'m',
                    language:'zh-CN',
                    autoclose:true,
                    minViewMode: 1,
                    maxViewMode: 1,
                    enableOnReadonly:false
                });
                $('.date').datepicker({
                    format:'yyyy-mm-dd',
                    language:'zh-CN',
                    autoclose:true,
                    minViewMode: 0,
                    maxViewMode: 0,
                    enableOnReadonly:false
                });
                $('.date_ref').datepicker({
                    format:'yyyymmdd',
                    language:'zh-CN',
                    autoclose:true,
                    minViewMode: 0,
                    maxViewMode: 0,
                    enableOnReadonly:false
                });
            }
            function initRefMadal() {
                $("#refTable").bootstrapTable({
                    columns: [{
                        title: '编码',
                        field: 'C_CODE',
                    },{
                        title: '名称',
                        field: 'C_NAME',
                    }],
                    toolbar:'#ref_toolbar',
                    pagination: true,                   //是否显示分页（*）
                    pageNumber: 1,                       //初始化加载第一页，默认第一页
                    pageSize: 10,                       //每页的记录行数（*）
                    pageList: [10, 25, 50, 100],        //可供选择的每页的行数（*）
                    search: true,                       //是否显示表格搜索，此搜索是客户端搜索，不会进服务端，所以，个人感觉意义不大
                    singleSelect:true,
                    onClickRow:onRefTalbeRowClick
                }) ;
            }
        }
        function onRefTalbeRowClick(row,ele,field) {
            refRowData = row ;
        }
        function setBtnPower(btnPower) {
            for(var key in btnPower){
                if(key == "is_add"){
                    if(btnPower[key] == "Y"){
                        $("#btn_add").removeAttr("disabled") ;
                    }
                }
                if(key == "is_query"){
                    if(btnPower[key] == "Y"){
                        $("#btn_query").removeAttr("disabled") ;
                    }
                }
                if(key == "is_delete"){
                    if(btnPower[key] == "Y"){
                        $("#btn_delete").removeAttr("disabled") ;
                    }
                }
            }
        }
        function errorWhenGenerateDocTemp(errorMsg) {
            alert(errorMsg) ;
            window.location.hash = "docList" ;
        }

        function getQryParam(columns) {
            var param = {} ;
            param["doctypecode"] = docType ;
            param["username"] = userName ;
            param["condition"] = [] ;
            for(var i = 0 ; i < columns.length ; i++){
                var paramValue = columns[i]["value"] ;
                if(paramValue !== ''){
                    param["condition"].push({
                        "fieldcode" : columns[i]["id"] ,
                        "fieldvalue" : paramValue
                    }) ;
                }
            }

            return JSON.stringify(param) ;
        }
        function getSaveParam(paramType) {
            var columns  ;
            if(paramType == "edit"){
                columns = $("#edit_modal_form input") ;
            }else{
                columns = $("#add_modal_form input") ;
            }
            var param = {} ;
            param["doctypecode"] = docType ;
            param["username"] = userName ;
            var data = {};
            for(var i = 0 ; i < columns.length ; i++){
                var paramValue = columns[i]["value"] ;

                var fieldCode = columns[i]["id"] ;
                if(paramValue){
                    data[fieldCode] = paramValue ;
                }else{
                    data[fieldCode] = "" ;
                }

            }
            param["data"] = data ;

            return JSON.stringify(param) ;
        }
        function getDeleteParam (sel) {
            var param = {} ;
            param["doctypecode"] = docType ;
            param["username"] = userName ;
            param["data"] = [] ;
            var  idField = getIdField() ;
            for(var i = 0 ; i < sel.length ; i++){
                var paramValue = sel[i][idField] ;
                param["data"].push({
                    "docid" : paramValue
                }) ;
            }
            return JSON.stringify(param) ;
        }
        function getIdField() {
            for(var i = 0 ; i < templateData.length ; i++){
                if(templateData[i]["ispk"] == "Y" ){
                    return templateData[i]["fieldcode"] ;
                }
            }
            // var idTemp = templateData.find(function (temp) {
            //     return temp["ispk"] == "Y" ;
            // }) ;

            // return idTemp["fieldcode"] ;
        }

        $("#docPage button").unbind("click") ;
        $("#i_back").unbind("click") ;
        $("#i_qryback").unbind("click") ;
        $("#i_addback").unbind("click") ;
        $("#i_editback").unbind("click") ;
        $("#i_refback").unbind("click") ;
        $("#i_back").click(function () {
            window.location.hash = "#docList" ;
        }) ;

        $("#i_qryback").click(function () {
            $('#qryModal').modal('hide');
        }) ;
        $("#i_addback").click(function () {
            $('#addModal').modal('hide');
        }) ;
        $("#i_editback").click(function () {
            $('#editModal').modal('hide');
        }) ;
        $("#i_refback").click(function () {
            $('#refModal').modal('hide');
        }) ;
        $("#btn_add_save").click(function () {
            var saveParam = getSaveParam("add") ;
            $.ajax({
                type: "post",
                url:getServerUrl("docSave")+saveParam,
                success: function (demand, status) {
                    if (demand["success"] == "Y") {
                        $('#doc_table').bootstrapTable("prepend",JSON.parse(saveParam)["data"]) ;
                        $("#add_modal_form input").val('');
                    }else{
                        alert(demand["msg"]) ;
                    }
                },
                error: function () {
                    alert('Error');
                }
            })
        });
        $("#btn_add_clear").click(function () {
            $("#add_modal_form input").val('');
        });
        $("#qry_confirm").click(function () {
            $.ajax({
                type: "post",
                url:getServerUrl("docQuery")+getQryParam($("#qry_modal_form input")),
                success: function (demand, status) {
                    if (demand["success"] == "Y") {
                        $('#doc_table').bootstrapTable("load",demand.result) ;
                        $('#qryModal').modal('toggle');
                    }else{
                        alert(demand["msg"]) ;
                    }
                },
                error: function () {
                    alert('Error');
                }
            }) ;
        });
        $("#qry_clear").click(function () {
            $("#qry_modal_form input").val('');
        });
        $("#btn_add").click(function () {
            $("#add_modal_form input").val('');
            $("#addModal").modal({show:true});
        });
        $("#btn_query").click(function () {
            $("#qryModal").modal({show:true});
        });
        $("#btn_delete").click(function () {
            var arrSelections = $("#doc_table").bootstrapTable('getSelections');
            if (arrSelections.length <= 0) {
                alert('请选择有效数据');
                return;
            }
            for(var i = 0 ; i < arrSelections.length ; i++){
                var p_Status = arrSelections[i]['P_STATUS'] ;
                if(p_Status=='1'){
                    alert('第'+(i+1)+'条数据已审批不能删除');
                    return;
                }
            }

            if (confirm("确认要删除选择的数据吗？") == true) {
                $.ajax({
                    type: "post",
                    url:getServerUrl("docDelete")+getDeleteParam(arrSelections),
                    success: function (data, status) {
                        if (data["success"] == "Y") {
                            var idField = getIdField() ;
                            for(var i = 0 ; i < arrSelections.length ; i++){
                                var paramValue = arrSelections[i][idField] ;
                                $("#doc_table").bootstrapTable('removeByUniqueId',paramValue);
                            }
                        }else{
                            alert(demand["msg"]) ;
                        }
                    },
                    error: function () {
                        alert('Error');
                    }
                });
            }
            else {
                return false;
            }
        });
        $("#btn_edit_save").click(function () {
            var editParam = getSaveParam("edit") ;
            $.ajax({
                type: "post",
                url:getServerUrl("docUpdate")+editParam,
                success: function (demand, status) {
                    var currRowData = JSON.parse(editParam)["data"] ;
                    var params = {};
                    if (demand["success"] == "Y") {
                        params["id"] = currRowData[getIdField()] ;
                        params["row"] = currRowData ;
                        $('#doc_table').bootstrapTable("updateByUniqueId",params) ;
                        $("#editModal").modal("toggle") ;
                    }else{
                        alert(demand["msg"]) ;
                    }
                },
                error: function () {
                    alert('Error');
                }
            })
        });
        $("#btn_edit_clear").click(function () {
            $("#edit_modal_form input").val('');
        });
        $("#ref_confirm").click(function () {
            if (refRowData == undefined) {
                alert('请选择有效数据');
                return;
            }
            var c_code = refRowData["C_CODE"] ;
            var c_name = refRowData["C_NAME"] ;

            $('#'+$("#refModalCode").val()+' #'+$('#refFieldCode').val()).val(c_code) ;
            $('#'+$("#refModalCode").val()+' #'+currRefName).val(c_name) ;

            $('#refModal').modal('toggle');
        });
        $("#ref_qry").click(function () {
            var fieldCode = currRefFieldCode ;
            var seachText = $("#refModal").find(".search input").val() ;
            refreshRefData(fieldCode,seachText) ;
        }) ;
    }
    function getServerUrl(requestType) {
        var netType = $('.login-form input:radio:checked').attr("id") ;
        return 'http://'+ipMap[netType]+"/"+servletMap[requestType]+"?data=" ;
    }
    function refreshRefData(fieldcode,searchText) {
        var param = {} ;
        param["doctypecode"] = docType ;
        param["username"] = userName ;
        param["fieldcode"] = fieldcode ;
        param["searchtext"] = searchText != undefined ? searchText : "" ;
        $.ajax({
            type: "post",
            url:getServerUrl("docRef")+JSON.stringify(param) ,
            success: function (demand, status) {
                if (demand["success"] == "Y") {
                    currRefName = demand["name"] ;
                    // $('#refTable').bootstrapTable('resetSearch');

                    $('#refTable').bootstrapTable("load",demand.data) ;
                    // if(refSeachMap[fieldcode]){
                    //     $('#refTable').bootstrapTable("resetSearch",refSeachMap[fieldcode]) ;
                    // }else{
                    //     $('#refTable').bootstrapTable('resetSearch') ;
                    // }
                    $('#refTable').bootstrapTable('resetSearch',searchText) ;

                }
            },
            error: function () {
                alert('Error');
            }
        });
    }
    function modaleSet() {
        var zIndex = 1040 + (10 * $('.modal:visible').length);
        $(this).css('z-index', zIndex);
        setTimeout(function() {
            $('.modal-backdrop').not('.modal-stack').css('z-index', zIndex - 1).addClass('modal-stack');
        }, 0);
        $('#refModal').on('shown.bs.modal',function (event) {
            if(this.id == "refModal"){
                var fieldCode = $(event.relatedTarget).closest('.input-group').children('input').attr("id") ;
                var fieldName = $(event.relatedTarget).parent().parent().parent().children('label').text() ;
                var currRefModalCode = $(event.relatedTarget).parents(".modal").attr("id") ;
                $(this).find("#refFieldCode").val(fieldCode) ;
                $(this).find("#refModalCode").val(currRefModalCode) ;

                refRowData = undefined ;
                $("#refModal h3").html(fieldName) ;
                refreshRefData(fieldCode,refSeachMap[fieldCode]) ;
                currRefFieldCode = fieldCode ;
            }
        })
        $('#refModal').on('hide.bs.modal',function (event) {
            var seachText = $(this).find(".search input").val() ;
            refSeachMap[currRefFieldCode] = seachText ;
        })
        $('.modal').on('shown.bs.modal',function (event) {
            if(this.id == "refModal"){
                return ;
            }
            if(this.id == "qryModal"){
                $(this).find("span a").removeAttr("disabled") ;
                $(this).find("input").removeAttr("readonly") ;
            }else if(this.id == "editModal"){
                var pStatus = $(this).find("#P_STATUS").val() ;
                if(pStatus != '0' && pStatus!='' && pStatus!=undefined){
                    $(this).find("input").attr("readonly","readonly") ;
                    $(this).find("#btn_edit_save").attr("disabled","disabled") ;
                    $(this).find("#btn_edit_clear").attr("disabled","disabled");
                    $(this).find("span a").attr('disabled','disabled');
                }else{
                    $(this).find("#btn_edit_save").removeAttr("disabled") ;
                    $(this).find("#btn_edit_clear").removeAttr("disabled");
                    for(var i = 0 ;i < templateData.length ; i++){
                        if(templateData[i]["is_editfield"] == "Y"){
                            $(this).find("#"+templateData[i]["fieldcode"]).removeAttr("readonly") ;
                            if(templateData[i]["fieldtype"] == "ref"){
                                $(this).find("#"+templateData[i]["fieldcode"]).parent().find("span a").removeAttr("disabled") ;
                            }
                        }else{
                            $(this).find("#"+templateData[i]["fieldcode"]).attr("readonly","readonly") ;
                            if(templateData[i]["fieldtype"] == "ref"){
                                $(this).find("#"+templateData[i]["fieldcode"]).parent().find("span a").attr('disabled','disabled');
                            }
                        }
                    }
                }
            }
        })
    }

    $(window).trigger("hashchange") ;
})

function validateFloatKeyPress(el,digits) {
    var v = parseFloat(el.value);
    el.value = (isNaN(v)) ? '' : v.toFixed(digits);
}