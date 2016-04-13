
function show_types(e){
	$("#v_de_dtype_ddl").css("display", "block");
	e.stopPropagation();
}
g_de_typedefs={

   CHAR           : {columnOnly:false, useScale:false, maxLength:2000, min:null, max:null},
   VARCHAR        : {columnOnly:false, useScale:false, maxLength:5000, min:null, max:null},
   NCHAR          : {columnOnly:false, useScale:false, maxLength:2000, min:null, max:null},
   NVARCHAR       : {columnOnly:false, useScale:false, maxLength:5000, min:null, max:null},
   ALPHANUM       : {columnOnly:false, useScale:false, maxLength: 127, min:null, max:null},
   SHORTTEXT      : {columnOnly:true,  useScale:false, maxLength:5000, min:null, max:null}, // max length guessed 
   BOOLEAN        : {columnOnly:false, useScale:false, maxLength:null, min:null, max:null},
   TINYINT        : {columnOnly:false, useScale:false, maxLength:null, min:0,    max:255},
   SMALLINT       : {columnOnly:false, useScale:false, maxLength:null, min:-32768, max:32767},
   INTEGER        : {columnOnly:false, useScale:false, maxLength:null, min:-2147483648, max:2147483647},
   BIGINT         : {columnOnly:false, useScale:false, maxLength:null, min:-9223372036854775808, max:9223372036854775807},
   DECIMAL        : {columnOnly:false, useScale:true,  maxLength:  38, min:null, max:null}, // precision and scale can be omitted
   SMALLDECIMAL   : {columnOnly:true,  useScale:false, maxLength:null, min:null, max:null},
   REAL           : {columnOnly:false, useScale:false, maxLength:null, min:null, max:null},
   DOUBLE         : {columnOnly:false, useScale:false, maxLength:null, min:null, max:null},
   FLOAT          : {columnOnly:false, useScale:false, maxLength:  53, min:null, max:null},
   BINARY         : {columnOnly:false, useScale:false, maxLength:2000, min:null, max:null},
   VARBINARY      : {columnOnly:false, useScale:false, maxLength:5000, min:null, max:null},
   BLOB           : {columnOnly:false, useScale:false, maxLength:null, min:null, max:null},
   CLOB           : {columnOnly:false, useScale:false, maxLength:null, min:null, max:null},
   NCLOB          : {columnOnly:false, useScale:false, maxLength:null, min:null, max:null},
   TEXT           : {columnOnly:true,  useScale:false, maxLength:null, min:null, max:null},
   BINTEXT        : {columnOnly:true,  useScale:false, maxLength:null, min:null, max:null},
   DATE           : {columnOnly:false, useScale:false, maxLength:null, min:null, max:null},
   TIME           : {columnOnly:false, useScale:false, maxLength:null, min:null, max:null},
   SECONDDATE     : {columnOnly:false, useScale:false, maxLength:null, min:null, max:null},
   TIMESTAMP      : {columnOnly:false, useScale:false, maxLength:null, min:null, max:null}
};
