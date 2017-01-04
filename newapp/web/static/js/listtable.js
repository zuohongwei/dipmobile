$(function () {
    initDocList()  ;
    $("#listtable").css("display","none") ;
});

var pageToggle = function () {
    if(doctype == undefined || doctype == ''){
        initDocList()  ;
        $("#doclist").css("display","block") ;
        $("#listtable").css("display","none") ;
    }else{
        $("#doclist").css("display","none") ;
        $("#listtable").css("display","block") ;
        $("h3").html(docname) ;
        listTableInit() ;
    }
}

var listTableInit = function () {
    //1.初始化Table
    var oPageInit = new PageInit();

    oPageInit.Init();

    //2.初始化Button的点击事件
    var oButtonInit = new ButtonInit();
    oButtonInit.Init();

    initRefMadal() ;
    modaleSet() ;
}

var doctype ;
var docname ;
var expandIndex ;
var curr_temp ;
var ip = "http://127.0.0.1:80" ;


var initDocList = function () {
    var url = ip+"/DocListServlet?data=" ;

    $.ajax({
        type: "post",
        url: url+JSON.stringify( {"username":sessionStorage.getItem("username")}),
        success: function (data, status) {
            if (data["success"] == "Y") {
                var menuData = [] ;
                var itemMenu ;
                $.each(data["result"], function(k,v) {
                    itemMenu = menuData.find(function (menu) {
                        return menu.name === v.docsupername ;
                    })

                    if(itemMenu == undefined){
                        itemMenu = {
                            "name":v.docsupername,
                            "detail":[{
                                "doctypecode":v.doctypecode ,
                                "doctypename":v.doctypename
                            }]
                        }
                        menuData.push(itemMenu) ;
                    }else{
                        itemMenu.detail.push({
                            "doctypecode":v.doctypecode ,
                            "doctypename":v.doctypename
                        }) ;
                    }
                });
                var html = '' ;
                $.each(menuData, function(k,v) {
                    html += '<li><a href="#">'+v["name"]+'</a><ul class="nav">' ;
                    $.each(v["detail"],function (k,itemv) {
                        html+="<li><a href='#' id='"+itemv.doctypecode+"'>"+ itemv.doctypename+"<span class='fa fa-angle-right'></span></a></li>";
                    })
                    html += '</ul></li>' ;
                });
                $("#doclistmenu").empty() ;
                $("#doclistmenu").html(html);
                $("#doclistmenu a").click(function (event) {
                    doctype = event.currentTarget["id"] ;
                    docname = event.currentTarget["text"] ;
                    pageToggle() ;
                }) ;
            }
        },
        error: function () {
            alert('Error');
        },
        complete: function () {

        }
    });
}

var PageInit = function () {
    var init = new Object() ;

    init.Init = function () {
        $.ajax({
            type: "post",
            url:ip+"/DocTemplateServlet?data="+JSON.stringify({"doctypecode":doctype,"username":sessionStorage.getItem("username")}) ,
            success: function (demand, status) {
                if (demand["success"] == "Y") {
                    curr_temp = demand.result;
                    // curr_data = obj.data;

                    if(curr_temp.length == 0){
                        return ;
                    }
                    initTable() ;
                    initModal() ;
                    btnPower(demand["button"]) ;
                }
            },
            error: function () {
                alert('Error');
            },
            complete: function () {

            }
        });
    }



    var initModal  = function () {
        $("#add_modal_form").empty() ;
        $("#qry_modal_form").empty() ;
        $("#edit_modal_form").empty() ;
        $("#add_modal_form").append(getModalHtml("is_addtemp")) ;
        $("#qry_modal_form").append(getModalHtml("is_qrytemp")) ;
        $("#edit_modal_form").append(getModalHtml("is_edittemp")) ;
        initDatePicker() ;
    }

    var btnPower = function (btnPower) {
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
            if(key == "is_edit"){
                if(btnPower[key] != "Y"){
                    // $("#btn_e").attr("disabled","disabled") ;
                }
            }
            if(key == "is_delete"){
                if(btnPower[key] == "Y"){
                    $("#btn_delete").removeAttr("disabled") ;
                }
            }
        }
    }


    var initTable = function () {
        $('#tb_departments').bootstrapTable({
            method: 'get',                      //请求方式（*）
            toolbar: '#toolbar',                //工具按钮用哪个容器
            striped: true,                      //是否显示行间隔色
            cache: false,                       //是否使用缓存，默认为true，所以一般情况下需要设置一下这个属性（*）
            pagination: true,                   //是否显示分页（*）
            sortable: false,                     //是否启用排序
            sortOrder: "asc",                   //排序方式
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

        // $('#tb_departments').bootstrapTable("hideColumn",0,false,true) ;
    };

    //根据模板数据获取表格列
    var getTableColumns = function () {
        var columns = [] ;
        columns.push({"checkbox": true}) ;
        for (var i = 0 ; i < curr_temp.length ; i++){
            if(curr_temp[i]["is_single_listtemp"] != "Y" ) {
                continue ;
            }
            var column = {
                "field":curr_temp[i]["fieldcode"] ,
                "title":curr_temp[i]["fieldname"] ,
            } ;
            if(curr_temp[i]["showflag"] == "N"){
                column["visible"] = false ;
            }
            columns.push(column) ;
        }

        columns.push({
            field: 'operate',
            title: '',
            align: 'center',
            events: operateEvents,
            formatter: operateFormatter
        })

        return columns ;
    }
    function operateFormatter(value, row, index) {
        return [
            '<a class="roweidt" href="#">',
            '<i class="glyphicon glyphicon-chevron-right"></i>',
            '</a> '
        ].join('');
    }
    window.operateEvents = {
        'click .roweidt': function (e, value, row, index) {
            for(var value in row){
                $("#editModal #"+value).val(row[value]) ;
            }
            $("#editModal").modal() ;
        }
    };

    var listTableDetail = function (index, row) {
        var html = [];


        for(var i = 0 ; i < curr_temp.length ; i++){
            if(curr_temp[i]["is_listtemp"] == "Y" && curr_temp[i]["showflag"] == "Y"){
                html.push('<p><b>'+curr_temp[i]["fieldname"]+':</b> '+row[curr_temp[i]["fieldcode"]]+'</p>');
            }
        }

        return html.join('');
    }

    var onTableRowClick = function (row,ele,field) {
        if(expandIndex == undefined){
            $('#tb_departments').bootstrapTable("expandRow",ele.data("index")) ;
            expandIndex = ele.data("index") ;
        }else{
            $('#tb_departments').bootstrapTable("collapseAllRows",false) ;
            if(expandIndex != ele.data("index")){
                expandIndex = ele.data("index") ;
                $('#tb_departments').bootstrapTable("expandRow",ele.data("index")) ;
            }else{
                expandIndex = -1 ;
            }
        }

    }

    return init ;
}

var getModalHtml = function (getField) {
    var result = '' ;
    for(var i = 0 ; i < curr_temp.length ; i++){
        var fieldCode = curr_temp[i]["fieldcode"] ;
        var fieldName = curr_temp[i]["fieldname"] ;
        var fieldType = curr_temp[i]["fieldtype"] ;
        var showFlag = curr_temp[i]["showflag"] == 'Y' ? true : false ;
        var html = '' ;

        html += '<div class="form-group">' ;
        if(showFlag){
            html += '<label for="'+fieldCode+'">'+fieldName+'</label>' ;
        }
        if(fieldType == 'ref'){
            html += '<div class="form-group input-group">' ;
            html += '<input ' ;
            html += 'type="'+(fieldType == "number" ? "number":"text") +'" id="'+fieldCode+'" ' ;
            if(curr_temp[i]["maxlength"] != undefined){
                html += 'maxlength='+curr_temp[i]["maxlength"] ;
            }
            html += ' class="form-control '+fieldType+'"' ;
            if(curr_temp[i]["is_editfield"] != undefined && curr_temp[i]["is_editfield"]=='Y'){
                html += " readonly " ;
            }
            if(!showFlag){
                html += ' style="' ;
                html += 'display: none;' ;
            }
            html += '>' ;
            //
            html += '<span class="input-group-btn"><a data-toggle="modal" class="btn btn-default" href="#refModal"><i class="fa fa-search"></i></a></span>' ;
            html += '</div>' ;
        }else{
            html += '<input ' ;
            html += 'type="'+(fieldType == "number" ? "number":"text") +'" id="'+fieldCode+'" ' ;
            if(curr_temp[i]["maxlength"] != undefined){
                html += 'maxlength='+curr_temp[i]["maxlength"] ;
            }

            if(fieldType == "number"){
                html += ' onchange="validateFloatKeyPress(this,'+curr_temp[i]["digits"]+') "' ;
            }
            html += ' class="form-control '+fieldType+'"' ;

            if(curr_temp[i]["is_editfield"] != undefined && curr_temp[i]["is_editfield"]=='Y'){
                html += " readonly " ;
            }
            html += ' style="' ;
            if(!showFlag){
                html += 'display: none;' ;
            }
            // if(fieldType == 'year'){
            //     html += 'z-index:999;' ;
            // }
            html += '"' ;


            html += '>' ;
        }
        html += '</div>' ;

        if(curr_temp[i][getField] == 'Y'){
            result += html ;
        }
    }
    return result ;
}
function validateFloatKeyPress(el,digits) {
    var v = parseFloat(el.value);
    el.value = (isNaN(v)) ? '' : v.toFixed(digits);
}
var getQryParam = function (columns) {
    var param = {} ;
    param["doctypecode"] = doctype ;
    param["username"] = sessionStorage.getItem("username") ;
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
    // return param ;
}
var getSaveParam = function (paramType) {
    var columns  ;
    if(paramType == "edit"){
        columns = $("#edit_modal_form input") ;
    }else{
        columns = $("#add_modal_form input") ;
    }
    var param = {} ;
    param["doctypecode"] = doctype ;
    param["username"] = sessionStorage.getItem("username") ;
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
    // return param ;
}
var getIdField = function () {
    for(var i = 0 ; i < curr_temp.length ; i++){
        if(curr_temp[i]["ispk"] == "Y"){
            return curr_temp[i]["fieldcode"] ;
        }
    }
    throw new Error("找不到模板的ID字段") ;
}

var getDeleteParam = function (sel) {
    var param = {} ;
    param["doctypecode"] = doctype ;
    param["username"] = sessionStorage.getItem("username") ;
    param["data"] = [] ;
    var  idField = getIdField() ;
    for(var i = 0 ; i < sel.length ; i++){
        var paramValue = sel[i][idField] ;
        param["data"].push({
            "docid" : paramValue
        }) ;
    }

    return JSON.stringify(param) ;
    // return param ;
}
var ButtonInit = function () {
    var oInit = new Object();

    oInit.Init = function () {

        $("#btn_add_save").click(function () {
            var saveParam = getSaveParam("add") ;
            $.ajax({
                type: "post",
                // url: "/add?addparam="+getAddParam($("#add_modal_form input")),
                url:ip+"/DocSaveServlet?data="+saveParam,
                success: function (demand, status) {
                    if (demand["success"] == "Y") {
                        $('#tb_departments').bootstrapTable("prepend",JSON.parse(saveParam)["data"]) ;
                        $("#add_modal_form input").val('');
                    }else{
                        alert(demand["msg"]) ;
                    }
                },
                error: function () {
                    alert('Error');
                },
                complete: function () {

                }
            })
        });
        $("#btn_add_clear").click(function () {
            $("#add_modal_form input").val('');
        });
        $("#qry_confirm").click(function () {
            $.ajax({
                type: "post",
                url:ip+"/DocQueryServlet?data="+getQryParam($("#qry_modal_form input")),
                success: function (demand, status) {
                    if (demand["success"] == "Y") {
                        $('#tb_departments').bootstrapTable("load",demand.result) ;
                        $("#qryModal").modal("toggle") ;
                    }else{
                        alert(demand["msg"]) ;
                    }
                },
                error: function () {
                    alert('Error');
                },
                complete: function () {

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
            $("#qryModal").modal();
        });
        $("#btn_delete").click(function () {
            var arrselections = $("#tb_departments").bootstrapTable('getSelections');
            if (arrselections.length <= 0) {
                alert('请选择有效数据');
                return;
            }
            if (confirm("确认要删除选择的数据吗？") == true) {
                $.ajax({
                    type: "post",
                    // url: "/delete?delParam="+JSON.stringify(arrselections)+"&doctype="+sessionStorage.getItem("currdoctype"),
                    url:ip+"/DocDeleteServlet?data="+getDeleteParam(arrselections),
                    // data: {"": JSON.stringify(arrselections)},
                        success: function (data, status) {
                        if (data["success"] == "Y") {
                            var idField = getIdField() ;
                            for(var i = 0 ; i < arrselections.length ; i++){
                                var paramValue = arrselections[i][idField] ;
                                $("#tb_departments").bootstrapTable('removeByUniqueId',paramValue);
                            }
                        }else{
                            alert(demand["msg"]) ;
                        }
                    },
                    error: function () {
                        alert('Error');
                    },
                    complete: function () {

                    }
                });
            }
            else {
                return false;
            }
        });
        $("#i_back").click(function () {
            doctype = '' ;
            pageToggle() ;
        }) ;
        $("#btn_edit_save").click(function () {
            var editParam = getSaveParam("edit") ;
            $.ajax({
                type: "post",
                // url: "/edit?doctypecode="+getDocType()+"&editParam="+getAddParam($("#edit_modal_form input")) ,
                url:ip+"/DocUpdateServlet?data="+editParam,
                success: function (demand, status) {
                    var currRowData = JSON.parse(editParam)["data"] ;
                    var params = {};
                    if (demand["success"] == "Y") {
                        params["id"] = currRowData[getIdField()] ;
                        params["row"] = currRowData ;
                        $('#tb_departments').bootstrapTable("updateByUniqueId",params) ;
                        $("#editModal").modal("toggle") ;
                    }else{
                        alert(demand["msg"]) ;
                    }
                },
                error: function () {
                    alert('Error');
                },
                complete: function () {

                }
            })
        });
        $("#btn_edit_clear").click(function () {
            $("#edit_modal_form input").val('');
        });
        $("#ref_confirm").click(function () {
            var arrselections = $("#refTable").bootstrapTable("getSelections") ;
            if (arrselections.length <= 0) {
                alert('请选择有效数据');
                return;
            }
            var code = arrselections[0]["C_CODE"] ;

            $('#'+$("#refModalCode").val()+' #'+$('#refFieldCode').val()).val(code) ;
            $('#refModal').modal('toggle');
        });
        $("#ref_cancel").click(function () {
            $("#refModal input").val('') ;
            $('#refModal').modal('toggle');
        }) ;
    };

    return oInit;
};

var initDatePicker = function () {
    $('.year').datepicker({
        format:'yyyy',
        language:'zh-CN',
        autoclose:true,
        minViewMode: 2,
        maxViewMode: 2
    });
    $('.month').datepicker({
        format:'yyyy',
        language:'zh-CN',
        autoclose:true,
        minViewMode: 1,
        maxViewMode: 1
    });
    $('.date').datepicker({
        format:'yyyy-mm-dd',
        language:'zh-CN',
        autoclose:true,
        minViewMode: 0,
        maxViewMode: 0
    });
    $('.date_ref').datepicker({
        format:'yyyymmdd',
        language:'zh-CN',
        autoclose:true,
        minViewMode: 0,
        maxViewMode: 0
    });
}
var initRefMadal = function () {
    $("#refTable").bootstrapTable({
        columns: [{
          "checkbox":true
        },{
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
    }) ;
}
var initRefData = function (fieldcode,fieldname) {
    $("#refModal h3").html(fieldname) ;
    $.ajax({
        type: "post",
        url:ip+"/DocRefListServlet?data="+JSON.stringify({"doctypecode":doctype,"username":sessionStorage.getItem("username"),"fieldcode":fieldcode}) ,
        success: function (demand, status) {
            if (demand["success"] == "Y") {
                $('#refTable').bootstrapTable("load",demand.data) ;
            }
        },
        error: function () {
            alert('Error');
        }
    });
}
var modaleSet = function () {
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
            initRefData(fieldCode,fieldName) ;
        }
    })
}