g_de_typedefs={

   CHAR           : {attrs:{_length:{required:true}, charset:{}, regextPattern:{}, touppercase:{default:"NO"}, removeleadingblank:{}, fixedvalues:{}, uidefaultvalue:{}}, columnOnly:false, useScale:false, maxLength:2000, min:null, max:null},
   VARCHAR        : {attrs:{_length:{required:true}, minLength:{}, charset:{}, regextPattern:{}, touppercase:{default:"NO"}, removeleadingblank:{}, fixedvalues:{}, uidefaultvalue:{}}, columnOnly:false, useScale:false, maxLength:5000, min:null, max:null},
   NCHAR          : {attrs:{_length:{required:true}, charset:{}, regextPattern:{}, touppercase:{default:"NO"}, removeleadingblank:{}, fixedvalues:{}, uidefaultvalue:{}}, columnOnly:false, useScale:false, maxLength:2000, min:null, max:null},
   NVARCHAR       : {attrs:{_length:{required:true}, minLength:{}, charset:{}, regextPattern:{}, touppercase:{default:"NO"}, removeleadingblank:{}, fixedvalues:{}, uidefaultvalue:{}}, columnOnly:false, useScale:false, maxLength:5000, min:null, max:null},

   ALPHANUM       : {attrs:{_length:{required:true}, scale:{}, touppercase:{default:"YES"}, fixedvalues:{}, uidefaultvalue:{}}, columnOnly:false, useScale:false, maxLength: 127, min:null, max:null},
   
   SHORTTEXT      : {attrs:{touppercase:{default:"NO"}}, columnOnly:true,  useScale:false, maxLength:5000, min:null, max:null}, // max length guessed 
    
   BOOLEAN        : {attrs:{}, columnOnly:false, useScale:false, maxLength:null, min:null, max:null},

   TINYINT        : {attrs:{min:{}, max:{}, fixedvalues:{}, uidefaultvalue:{}}, columnOnly:false, useScale:false, maxLength:null, min:0,    max:255},
   SMALLINT       : {attrs:{min:{}, max:{}, fixedvalues:{}, uidefaultvalue:{}}, columnOnly:false, useScale:false, maxLength:null, min:-32768, max:32767},
   INTEGER        : {attrs:{min:{}, max:{}, fixedvalues:{}, uidefaultvalue:{}}, columnOnly:false, useScale:false, maxLength:null, min:-2147483648, max:2147483647},
   BIGINT         : {attrs:{min:{}, max:{}, fixedvalues:{}, uidefaultvalue:{}}, columnOnly:false, useScale:false, maxLength:null, min:-9223372036854775808, max:9223372036854775807},
   DECIMAL        : {attrs:{_length:{}, scale:{}}, columnOnly:false, useScale:true,  maxLength:  38, min:null, max:null}, // precision and scale can be omitted
   SMALLDECIMAL   : {attrs:{}, columnOnly:true,  useScale:false, maxLength:null, min:null, max:null},
   REAL           : {attrs:{}, columnOnly:false, useScale:false, maxLength:null, min:null, max:null},
   DOUBLE         : {attrs:{}, columnOnly:false, useScale:false, maxLength:null, min:null, max:null},
   FLOAT          : {attrs:{}, columnOnly:false, useScale:false, maxLength:  53, min:null, max:null},
   
   BINARY         : {attrs:{_length:{required:true}}, columnOnly:false, useScale:false, maxLength:2000, min:null, max:null},
   VARBINARY      : {attrs:{_length:{required:true}}, columnOnly:false, useScale:false, maxLength:5000, min:null, max:null},
   BLOB           : {attrs:{}, columnOnly:false, useScale:false, maxLength:null, min:null, max:null},
   CLOB           : {attrs:{touppercase:{default:"NO"}}, columnOnly:false, useScale:false, maxLength:null, min:null, max:null},
   NCLOB          : {attrs:{touppercase:{default:"NO"}}, columnOnly:false, useScale:false, maxLength:null, min:null, max:null},
   TEXT           : {attrs:{}, columnOnly:true,  useScale:false, maxLength:null, min:null, max:null},
   BINTEXT        : {attrs:{}, columnOnly:true,  useScale:false, maxLength:null, min:null, max:null},
  
   DATE           : {attrs:{uidefaultvalue:{}}, columnOnly:false, useScale:false, maxLength:null, min:null, max:null},
   TIME           : {attrs:{uidefaultvalue:{}}, columnOnly:false, useScale:false, maxLength:null, min:null, max:null},
   SECONDDATE     : {attrs:{uidefaultvalue:{}}, columnOnly:false, useScale:false, maxLength:null, min:null, max:null},
   TIMESTAMP      : {attrs:{allowPast:{}}, columnOnly:false, useScale:false, maxLength:null, min:null, max:null}
};
g_type_attrs=[
	"_length",
	"scale",
	"minLength",
	"min",
	"max",
	"allowPast",
	"charset",
	"regexpattern",
	"touppercase",
	"removeleadingblank",
	"fixedvalues",
	"uidefaultvalue"	
];
function show_types(e){
	$("#v_de_dtype_ddl").css("display", "block");
	
	move_dropdown_list($("#v_de_dtype"), $("#v_de_dtype_ddl"));
	
	e.stopPropagation();
}

function check_type_attr(typename, attr_name){
	typedesc = g_de_typedefs[typename];
	if (typedesc == null)
		return;

	// console.log("check "+typename+"=>"+attr_name);
	attr_hash = typedesc.attrs[attr_name];
	if (attr_hash ){ // not N/A
		$("#de_dtype_"+ attr_name).css("display", "block");
	//	if (attr_name == "_length")
	//		alert(inspect(attr_hash));
	//	console.log("#de_dtype_"+attr_name + " span:"+$("#de_dtype_"+attr_name + " span").length);
		// add star
		if (attr_hash["required"] == true){
			// alert(inspect($("#de_dtype_"+attr_name + " span")[0]));
			$("#de_dtype_"+attr_name + " span").css("display", "inline");
		}
		else
			$("#de_dtype_"+attr_name + " span").css("display", "none");
		
		// alert(attr_name+"="+attr_hash.default);
		node = $("#v_de_dtype_"+ attr_name);
		// alert("changed="+node.attr("changed"));
		if (node.attr("changed") != "true" && attr_hash.default != null && $("#v_de_dtype_"+ attr_name).val() == ""){
			$("#v_de_dtype_"+ attr_name).val(attr_hash.default);
		}
	}
	else
		$("#de_dtype_"+ attr_name).css("display", "none");


	
}
function add_attr(data, attr_name, typedesc){
	typename = data.dtype.name;	
	if (typename == null)
		return;
	// alert(typename);

	if (typedesc == null)
		typedesc = g_de_typedefs[typename];
		

	v = data.dtype[attr_name]; // get atrr value by attr name
	attr_hash = typedesc.attrs[attr_name];
	if (attr_hash ){ // not N/A
		$("#de_dtype_"+ attr_name).css("display", "block");

		// add star
		if (attr_hash["required"] == true){
			
			$("#de_dtype_"+attr_name + " span").css("display", "inline");
			
		}
		else
			$("#de_dtype_"+attr_name + " span").css("display", "none");
		
		// value for this attr
		if (v != null)
			$("#v_de_dtype_"+ attr_name).val(v);
		else if (attr_hash.default != null){
			$("#v_de_dtype_"+ attr_name).val(attr_hash.default);
		}
		
	}
	else
		$("#de_dtype_"+ attr_name).css("display", "none");
	
}
function load_de(data){
	alert("loadde:"+inspect(data, 1));
	$("#v_de_name").val(data.name);
	$("#v_de_desc").val(data.desc);
	$("#v_de_dbname").val(data.dbname);
	
	// alert(dbnamechanged);
	if (data.dbnamechanged == true)
		dbnamechanged = true;
	else
		dbnamechanged = false;
	
	$("#v_de_dbname").attr('dbnamechanged', dbnamechanged);
	
	if (data.dtype == null){
		data.dtype = {
		};
	}
	
//	typename = data.dtype.name;
//	_type = g_de_typedefs[data.dtype.name];
	alert(JSON.stringify(data));
	$("#v_de_dtype").html(data.dtype.name);
	
	// if (data.dtype.scale){
	// 	$("#v_de_dtype_scale").val(data.dtype.scale);
	// 	if (data.dtype.scale.required == true)
	// 		$("#de__dtype_"+typename + " span").html("*");
	// 	else
	// 		$("#de__dtype_"+typename + " span").html("");
	// }
	// $("#v_de_dtype_length").val(data.dtype._length);
	
	// add_attr(data, "_length");	
	// add_attr(data, "minLength");
	// add_attr(data, "min");
	// add_attr(data, "max");
	// add_attr(data, "allowPast");
	// add_attr(data, "charset");
	// add_attr(data, "regexpattern");
	// add_attr(data, "touppercase");
	// add_attr(data, "removeleadingblank");
	// add_attr(data, "fixedvalues");	
	// add_attr(data, "uidefaultvalue");	
	for (i = 0; i< g_type_attrs.length;i++)
		add_attr(data, g_type_attrs[i]);
	// $("#v_de_dtype_min").val(data.dtype.min);
	// $("#v_de_dtype_max").val(data.dtype.max);
	// $("#v_de_dtype_allowPast").val(data.dtype.allowPast);
	// $("#v_de_dtype_charset").val(data.dtype.charset);
	// $("#v_de_dtype_regexpattern").val(data.dtype.regexpattern);
	// $("#v_de_dtype_touppercase").val(data.dtype.touppercase);
	// $("#v_de_dtype_removeleadingblank").val(data.dtype.removeleadingblank);
	// $("#v_de_dtype_fixedvalues").val(data.dtype.fixedvalues);
	// $("#v_de_dtype_uidefaultvalue").val(data.dtype.uidefaultvalue);

		
}

function onchangedbname(t){
	
	$(t).attr('dbnamechanged', true);
	alert($(t).attr('dbnamechanged'));
}

function check_change_type_name(t){
	// old_value = t.oldvalue;
	// alias = $("#v_de_dbname").val();
	dbnamechanged = $("#v_de_dbname").attr('dbnamechanged');
	
	if (dbnamechanged != "true"){
		value = $(t).val();
	// alert(value);
	
	
	// ar = value.split(/[ABCDEFGHIJKLMNOPQRSTUVWXYZ]/);
	// alert(inspect(ar));
	// v = ar.join("_");
	
	v = value.replace(/([ABCDEFGHIJKLMNOPQRSTUVWXYZ])/g, '_$1');
	v = v.toUpperCase();
	if (v[0]=="_")
		v = v.substring(1);
	$("#v_de_dbname").val(v);
	}
}

function export_de(){
	ret = {};
	ret.name = $("#v_de_name").val();
	ret.desc= $("#v_de_desc").val();
	// ret.dtype.name = $("#v_de_dtype").html();

	ret.dbname = $("#v_de_dbname").val();
	dbnamechanged = $("#v_de_dbname").attr('dbnamechanged');
	// alert(dbnamechanged);
	if (dbnamechanged == "true")
		ret.dbnamechanged = true;
	else
		ret.dbnamechanged = false;
	
	ret.dtype= {};
	
	ret.dtype.name = $("#v_de_dtype").html();
	_type = g_de_typedefs[ret.dtype.name];
	if (_type){
		if (_type.useScale == true)
			ret.dtype.scale = parseInt($("#v_de_dtype_scale").val());
		if (_type.maxLength != null)
			ret.dtype._length = parseInt($("#v_de_dtype_length").val());
	}
	
	for (attr in _type.attrs){
		v = $("#v_de_dtype_"+ attr).val();
		ret.dtype[attr] = v;
	}
	
	
	
	alert(inspect(ret));
	return JSON.stringify(ret);
}


// ==================
// dropdown_list
// ==================
function move_dropdown_list(node, list){
		var pos = node.offset();
		var m_pos = $("#main").offset();
		var x = pos.left - m_pos.left;
		// alert(pos.top + ","+node.height()+ ","+m_pos.top +","+node.css("padding"));
		// alert(node.css("padding-bottom"));
		// alert(node.css("height")+","+node.height()+","+node.outerHeight());

		// alert($("#de_content").prop('scrollHeight')+","+$("#de_content").height()+","+$("#de_content").prop('scrollTop'));
		//alert(pos.top+","+m_pos.top+","+node.outerHeight()+","+node.css("padding-top")+","+node.css("padding-bottom")+","+$("#de_content").scrollTop());
		var y = pos.top - m_pos.top + node.outerHeight();//-$("#de_content").scrollTop();
		// alert(y);
		// alert(inspect(m_pos));
		// alert($("#btn_select_theme").offset().left);
		list.css("left", x);
		list.css("top", y);
}