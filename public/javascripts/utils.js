function evalJs(data){

	re = /<script[\s\S]*?>([\s\S]*)<\/script>/i; // multi line must use [\s\S]* instead of .*
	s = re.test(data);
	
	if (!s)
		return;
	h = RegExp.$1;

   eval(h);
}

function isElement(object) {
   return !!(object && object.nodeType == 1);
 }

function isArray(object) {
   return object != null && typeof object == "object" &&
     'splice' in object && 'join' in object;
 }

function isHash(object) {
   return object instanceof Hash;
 }

function isFunction(object) {
   return typeof object == "function";
 }

function isString(object) {
   return typeof object == "string";
 }

function isNumber(object) {
   return typeof object == "number";
 }

function isUndefined(object) {
   return typeof object == "undefined";
 }

function isEmpty(obj){
	if (!obj||typeof(obj) == null)
		return true;
	for (var p in obj){
		return false;
	}
	
	return true;
}
function isNullString(s){
	if (s == null || s== undefined || s == "")
		return true;
	return false;
}
function toJSON(object) {

  var type = typeof object;
//	alert("---"+type);
  switch (type) {
    case 'undefined':
    case 'function':
    case 'unknown': return;
    case 'boolean': return object.toString();
	case 'number': return ""+object;
	case 'string': return "\""+object+"\"";
  }

  if (object === null) return 'null';
  if (object.toJSON) return object.toJSON();
  if (isElement(object)) return;

  var results = [];
  for (var property in object) {
//	alert(property+":"+object[property]);
    var value = toJSON(object[property]);
//	alert("---");
    if (!isUndefined(value))
      results.push(toJSON(property) + ': ' + value);

  }
//	alert('{' + results.join(', ') + '}');
  return '{' + results.join(', ') + '}';
}

function AutoImgSize(e, w, h){
	r = e.height/e.width;
	if (e.height>e.width)
	{	
		if (e.height > h){
			e.style.height=h+"px";
			e.style.width=h/r+"px";
//	alert(""+e.style.width+", "+e.style.height);

		}
	}else if(e.width>w){
        e.style.width=w+"px";
		e.style.height=w*r+"px";
	}	
//	alert(""+e.style.width+","+e.style.width);
}
function autoPos(a, b){
//	alert("dd"+b);
//	alert($(a).height()+"-"+b.height);
   var c_h = ($(a).height()-b.height)/2;
   var c_w = ($(a).width()-b.width)/2;
    $(b).css("margin-left", c_w);
    $(b).css("margin-top", c_h);
//	alert(c_w+","+c_h);
}
function inspect(obj) {
    var props = "";

	var type = typeof(obj);
	if (type == "string" || type == "number" || type == "boolean")
		return obj+"["+typeof(obj)+"]";
     
	for(var p in obj){

         if(typeof(obj[p])=="function"){
          // obj[p]();
			// props += "function "+p+"()\n";
         }else{
           	props+="["+typeof(obj[p])+"]" +  p + "=" + obj[p] + "\n";
			// the recursive may cause dead loop
            // if (typeof(obj[p])=="object")
                    // props+="[\n"+inspect(obj[p])+"\n]\n";
         }
     }

    // alert(props);
	return obj+"["+typeof(obj)+"]:\n"+props;
 }

// get query string in url
function getUrlQueryString(name)
{

	//alert(name);

	 // alert("qs="+location.href);
    // 如果链接没有参数，或者链接中不存在我们要获取的参数，直接返回空
    if(location.href.indexOf("?")==-1 || location.href.indexOf(name+'=')==-1)
    {
        return '';
    }
 
    // 获取链接中参数部分
    var queryString = location.href.substring(location.href.indexOf("?")+1);

    // 分离参数对 ?key=value&key2=value2
    var parameters = queryString.split("&");
 
    var pos, paraName, paraValue;
    for(var i=0; i<parameters.length; i++)
    {
        // 获取等号位置
        pos = parameters[i].indexOf('=');
        if(pos == -1) { continue; }
 
        // 获取name 和 value
        paraName = parameters[i].substring(0, pos);
        paraValue = parameters[i].substring(pos + 1);
 
        // 如果查询的name等于当前name，就返回当前值，同时，将链接中的+号还原成空格
        if(paraName == name)
        {
			_paraValue = decodeURIComponent(paraValue);
            return unescape(_paraValue.replace(/\+/g, " "));
        }
    }
    return '';
};

function findHtmlContent(tag, str){
	open_tag = "<"+tag;
	close_tag = "</"+tag+">";
	ret = [];
	deep = 0;
	found = true;
	s = str;
	pi = 0;
	start = 0;
	end = 0;
	temp = "";
	var i,i2;
	while (s.length>0){
		i = i2 = -1;
		 // alert(s);
		i2 = s.toLowerCase().indexOf(close_tag);
		i = s.toLowerCase().indexOf(open_tag);
		// alert("i="+i+" i2="+i2);
		if (i<0 && i2 < 0){
			ret.push(temp+s);
			break;
		}
		if (i>=0 && i2>=0){ 
			
			if (i<i2){ // reach open tag first
				deep++;
								// alert(deep);

				i += open_tag.length;
				temp += s.substring(0, i);
				// alert("temp:"+temp);

				s = s.substring(i);
				// alert("s="+s);
				continue;
			}
			else{// reach </div> first
				// alert(2);
				deep--;
				// alert(deep);
				if (deep < 0)
					break;
				i2 += close_tag.length;
				temp += s.substring(0, i2);
				if (deep == 0){
					ret.push(temp);
					temp = "";
				}
				s = s.substring(i2);
				
				continue;
			}
		}else{
			if (i<0 && i2>=0){
				deep--;
								// alert(deep);

				if (deep < 0)
					break;
				i2 += close_tag.length;
				temp += s.substring(0, i2);
				if (deep == 0){
					ret.push(temp);
					temp = "";
				}
				s = s.substring(i2);
				// alert("s2="+s);
				continue;
			}
			if (i2<0 && deep >= 0){
				ret.push(temp+s);
				break;
			}				
			// if (i>0 && i2<0 && deep >= 0){
			// 			ret.push(temp+s);
			// 		}
		}
		// alert(temp);
	}
	// alert(ret);
	// alert(ret.length);
	
	return ret;
}
var getType = function(object) {
        var _t;
        return ((_t = typeof(object)) == "object" ? object == null && "null" || Object.prototype.toString.call(object).slice(8, -1) : _t).toLowerCase();
    }
function isString(o) {
   return getType(o) == "string";
}
function getTextByteLength(str){
    var len = str.length; 
    var reLen = 0; 
    for (var i = 0; i < len; i++) {        
        if (str.charCodeAt(i) < 27 || str.charCodeAt(i) > 126) { 
            // 全角    
            reLen += 2; 
        } else { 
            reLen++; 
        } 
    } 
    return reLen;     
}

// generate random integer number 0~r (include 0 and r)
function rand(r){
	return Math.floor(Math.random()*(r+1));
}

function rand2(min, max){
	return Math.floor( Math.random()*(max-min+1)+min ); 
}

function get_file_ext(fname){
	ar =  fname.split(".");
	return ar[ar.length-1];
	
}

// =========
// = Array =
// =========
Array.prototype.indexOf=function(obj){
	for(var i =0;i <this.length;i++){ 
		if (obj === this[i])
			 return i;
	}
	return -1;
}

Array.prototype.remove=function(obj){ 
	var i = this.indexOf(obj);
	if (i >=0){
		this.splice(i, 1);
	}
}

// ==========
// = Cookie =
// ==========
 function setCookie(cname, cvalue, exdays) {
	exdays = exdays || 365;
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+d.toGMTString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
}

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1);
        if (c.indexOf(name) != -1) return c.substring(name.length, c.length);
    }
    return "";
}

// function checkCookie() {
//     var user = getCookie("username");
//     if (user != "") {
//         alert("Welcome again " + user);
//     } else {
//         user = prompt("Please enter your name:", "");
//         if (user != "" && user != null) {
//             setCookie("username", user, 365);
//         }
//     }
// }
