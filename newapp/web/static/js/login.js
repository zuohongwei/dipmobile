/**
 * Created by Administrator on 2016/12/31.
 */
$(function () {
    var userName = '' ;
    function createCode() {
        var code = "";
        var codeLength = 4;//验证码的长
        var random = new Array( 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R',
            'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z' );//随机数
        for (var i = 0; i < codeLength; i++) {//循环操作
            var index = Math.floor( Math.random() * 36 );//取得随机数的索引（0~35）
            code += random[index];//根据索引取得随机数加到code上
        }
        $("#checkCode").val(code);//把code值赋给验证码
    }
    function initValidator() {
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
    }
    createCode() ;
    initValidator() ;
})