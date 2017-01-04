/**
 * Created by Administrator on 2016/12/26.
 */
var app = new Vue( {
    el: '#loginapp',
    data: {
        apptitle: '档案管理',
        username: sessionStorage.getItem("username"),
        password: '',
        checkcode:'',
        inputcode:''
    },
    methods: {
        login: function () {
            $('#loginform').data("bootstrapValidator").validate() ;
            var flag = $('#loginform').data("bootstrapValidator").isValid() ;
            if(!flag){
                return ;
            }
            var url = "http://127.0.0.1:80/LoginServlet?data=";
            $.ajax( {
                type: "post",
                url: url + JSON.stringify( {"username": app.username, "password": app.password} ),
                success: function (data, status) {
                    if (data["success"] == "Y") {
                        sessionStorage.setItem( "username", $( "#username" ).val() );
                        window.location.href = "/appindex.html";
                    } else {
                        alert( data["msg"] );
                    }
                },
                error: function (arg1, arg2, arg3) {
                    alert( JSON.stringify( {"username": app.username, "password": app.password} ) );
                },
                complete: function () {

                }
            } )
            return false;
        },
        createCode: function createCode() {
            var code = "";
            var codeLength = 4;//验证码的长
            var random = new Array( 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R',
                'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z' );//随机数
            for (var i = 0; i < codeLength; i++) {//循环操作
                var index = Math.floor( Math.random() * 36 );//取得随机数的索引（0~35）
                code += random[index];//根据索引取得随机数加到code上
            }
            this.checkcode = code;//把code值赋给验证码
        },
        validate: function validate() {
            if (this.inputcode.length <= 0) { //若输入的验证码长度为0
                alert( "请输入验证码！" ); //则弹出请输入验证码
            } else if (this.inputcode != this.checkcode) { //若输入的验证码与产生的验证码不一致时
                alert( "验证码输入错误！@_@" ); //则弹出验证码输入错误
                createCode();//刷新验证码
                this.inputcode = '' ;
            } else { //输入正确时
                alert( "合格！^-^" );
            }
        },
        initValidator:function () {
            $('#loginform').bootstrapValidator({
//        live: 'disabled',
                message: 'This value is not valid',
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
                    checkInput:{
                        validators: {
                            notEmpty: {
                                message: '验证码不能为空'
                            },
                            callback: {
                                message: '错误',
                                callback: function(value, validator) {
                                    if (app.inputcode.toLowerCase() != app.checkcode.toLowerCase()) {
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
        }
    }
} )

app.createCode();
app.initValidator() ;
