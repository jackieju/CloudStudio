/* usage:
	check_session({
		client_id: client_id,
		redirect_uri:redirect_uri,
		oauth_url: "https://oauth.facebook.com/oauth2/authorization",
		ajax: false
	}, function(){
		// do initialzation e.g. initialze page
	});
*/

// default_oauth_url = "https://o.anywhere.cn:8444/sld/oauth2/authorize";
default_oauth_url = "http://127.0.0.1:60185/authorization";

// default_client_id = "4595242446497150-9uLzeLIikSgJgLHAfRfDNDJxeq0zzX7s";

default_client_id = "client1.id";

// check session by aouth client-side flow (JS flow)
function parseParams (params) {
	var ccAuth = Array();
	var authData = params.split("&",4);
	for (i=0; i < authData.length; i++) {
		var paramVal = authData[i].split("=",2);
		ccAuth.push(paramVal[1]);
	}
	return ccAuth;
}
g_atoken = null;
//https://cnpvgvb1ep019.pvgl.sap.corp:29900/sld/oauth2/authorize?
//response_type=token
//&client_id=1052425356556667-5JR86o3fi21mq5L0aeEgUGdAyOFTOKa2
//&scope=ALL
//&redirect_uri=http://localhost:8080/parsecode  
// client_id="4874805429075418-yFNLByquAI63nUMkOxdZUoehmI0c85Um";
// redirect_uri="http://d.anywhere.cn/index.html?appid="+g_appid;
// oauth_url = "https://10.58.118.63:8444/sld/oauth2/authorize";
function check_session(params, callback){
	alert(inspect(params));
	if (window.location.hash.length == 0) {
		// var path = 'https://oauth2.constantcontact.com/oauth2/oauth/siteowner/authorize?';
		// 	var queryParams = ['client_id=' + apiKey,
		//      	'redirect_uri=' + callback_uri,
		//      	'response_type=token'];
		// 	var query = queryParams.join('&');
		// 	var url = path + query;
		// 	window.open(url,"_self");
		
		_token = getCookie("atoken");
		alert(_token);
	} else {
		var rawParams = window.location.hash.substring(1);
		var oAuthData = parseParams(rawParams);
		// setCookie(oAuthData[0]);
		g_atoken = oAuthData[0];
		document.cookie = "atoken" + "=" + g_atoken;
		// for (i=0; i < oAuthData.length; i++) {
		//     document.write(oAuthData[i] + "<br />" );
		// }
	    // return;
	}
	// alert("22222");
	if (g_atoken == null){
		client_id = params.client_id;
		if (isNullString(client_id))
			client_id = default_client_id;
		if (isNullString(params.oauth_url))
			oauth_url = default_oauth_url;
		console.log("oauth_url:"+oauth_url);
		if (!isNullString(params.appid)){
			console.log("set cookie appid="+params.appid);
			// alert("set cookie appid="+params.appid);
			setCookie("appid", params.appid);
		}
		if (params.redirect_uri == null || params.redirect_uri == undefined){
			console.log("use default redirect_uri "+window.location.href);
			params.redirect_uri = window.location.href;
		}
		if (params.ajax == null || params.ajax == undefined){
			console.log("use default redirect_uri "+window.location.href);
			params.ajax = true;
		}
		full_url = oauth_url+"?response_type=token&client_id="+client_id+"&scope=ALL&redirect_uri="+params.redirect_uri;
		if (params.ajax){
			alert("using ajax to oauth");
		$.ajax({
			type: "get",
			url: full_url,
			dataType: 'json',

			// data: {
			// 	appid:g_appid,
			// 	fname:fname,
			// }, 
			success: function(data, textStatus){
				// alert( "Data Saved: " + data +","+ textStatus);
				if (data.redirect){
					window.location.href = data.redirect;
				}
				showWaiting(false);
		


			},
			error: function(xhr, textStatus, errorThrow){
				// alert("error"+errorThrow+","+textStatus+","+xhr.responseText);
				popup("error"+errorThrow+","+textStatus+","+xhr.responseText);

				showWaiting(false);

			}
		}); // $ajax
	}
		else{
			alert("NOT using ajax to oauth, but use url "+full_url);
			
			window.location.href = full_url;
		}
		
	}else
		callback(g_atoken);
}
// check session by aouth sever-side flow
function check_session2(){
	// alert("check_session2");
	$.ajax({
		type: "get",
		url: "/oauth/c?pid="+g_appid+"&t="+ new Date().getTime(),
		dataType: 'json',

		// data: {
		// 	appid:g_appid,
		// 	fname:fname,
		// }, 
		success: function(data, textStatus){
			// alert( "Data Saved: " + data +","+ textStatus);
			if (data.error){
				alert("url:"+ inspect(data));
				window.location.href=data.oauth_url;
			}else{
				load_project(g_appid);
			}
			showWaiting(false);
		},
		error: function(xhr, textStatus, errorThrow){
			// alert("error"+errorThrow+","+textStatus+","+xhr.responseText);
			// popup("error"+errorThrow+","+textStatus+","+xhr.responseText);
	
			showWaiting(false);
		}
	}); // $ajax
	
}