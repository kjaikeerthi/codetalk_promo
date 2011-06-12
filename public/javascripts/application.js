$(function() {  
    var faye = new Faye.Client('http://localhost:9292/faye');
    var current_copy = "";
    var result = "";
    var dmp = new diff_match_patch();
    var editor = CodeMirror.fromTextArea('code', {
        height:$(this).height() -25,
        parserfile: "parsexml.js",
        stylesheet: "css/xmlcolors.css",
        path: "javascripts/",
        continuousScanning: 500,
        lineNumbers: true
    });

    $(this).everyTime(10000, function() {
        faye.publish("/home/index", editor.getCode());
        current_copy = editor.getCode();
    });

    var compute_result = function(data1, data2){
        var diff = dmp.diff_main(current_copy, data1, true);
        if(diff.length > 2){
            dmp.diff_cleanupSemantic(diff);
        }
        var patch_list = dmp.patch_make(current_copy, data1, diff);
        var patch_text = dmp.patch_toText(patch_list);
        var patches = dmp.patch_fromText(patch_text);
        return dmp.patch_apply(patches, data2);
    }

    faye.subscribe('/home/index', function (data) {
        if(current_copy != data){
            v1 = data;
            v2 = editor.getCode();
            result = compute_result(v1, v2);
            if(!$.inArray(false, result)){
                result = compute_result(v2, v1)
            }

            current_copy = result[0];
            editor.setCode(result[0]);
        }
    });
});  
