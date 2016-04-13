// ================
// = Log Function =
// ================
var g_startLogline = 0;
var g_lastLogLine = 0;
var g_first_r_log = true;
function openlog(){
	switch_view("log");
	// $("#editor").css("display", "none");	
	// $("#bo_designer").css("display", "none");
	// $("#log").css("display", "block");	
	if (g_first_r_log){
		tail_log(100);
		g_rlog_timer = setInterval("retrieve_log();", 1000);
	}else
		retrieve_log();
	// g_currentView = "log";
}
// function decode_base64(s) {
//     var e={},i,k,v=[],r='',w=String.fromCharCode;
//     var n=[[65,91],[97,123],[48,58],[43,44],[47,48]];
// 
//     for(z in n){for(i=n[z][0];i<n[z][1];i++){v.push(w(i));}}
//     for(i=0;i<64;i++){e[v[i]]=i;}
// 
//     for(i=0;i<s.length;i+=72){
//     var b=0,c,x,l=0,o=s.substring(i,i+72);
//          for(x=0;x<o.length;x++){
//                 c=e[o.charAt(x)];b=(b<<6)+c;l+=6;
//                 while(l>=8){r+=w((b>>>(l-=8))%256);}
//          }
//     }
//     return r;
//     }
// 	function decode_base642(s) {
// 	  var b=l=0, r='', s=s.split(''), i,
// 	  m='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split('');
// 	  for (i in s) {
// 	    b=(b<<6)+m.indexOf(s[i]); l+=6;
// 	    while (l>=8) r+=String.fromCharCode((b>>>(l-=8))&0xff);
// 	  }
	  // return r;
	  // 		}
function tail_log(ln){
		$.ajax({
			type: "get",
			url: "/app/tlog?ln="+ln+"&t="+ new Date().getTime(),
		 	dataType: 'json',
			success: function(data, textStatus){
				// alert( "Data Saved: " + data +","+ textStatus);

				showWaiting(false);
				if (data.error){
					popup(data.error);
				}else{
					// alert(data);
					c = decodeURIComponent(data.c);
					// c = c.replace(/</g, "$lt;").replace(/>/g, "$gt;")
					$("#log_c").append(c);
					g_startLogline = data.start_line;
					g_lastLogLine = data.start_line -1;
					count = c.split("<br/>").length;
					for (var i = 0; i<count; i++){
						g_lastLogLine += 1;
						_num = g_lastLogLine+1;
						$("#log_ln").append(_num+"<br/>");
						
					}
					$("#log").attr("scrollTop",$("#log").attr('scrollHeight'));
				 
					// alert(g_lastLogLine);
					g_first_r_log = false;
					
					
				}
			},
			error: function(xhr, textStatus, errorThrow){
				// alert("error"+errorThrow+","+textStatus+","+xhr.responseText);
				popup("error"+errorThrow+","+textStatus+","+xhr.responseText);

				showWaiting(false);

			}
		}); // $ajax
		// showWaiting(true);
	}

function retrieve_previous_log(){
	
		$.ajax({
			type: "get",
			url: "/app/rlog?ln=-100&sl="+g_startLogline+"&t="+ new Date().getTime(),
			// dataType: 'json',

			// data: {
				// appid:g_appid,
				// 			fname:fname,
				// 			type:type,

				// sid: '<%=@sid%>',
				// authenticity_token:window._token
			// }, 
			success: function(data, textStatus){
				// alert( "Data Saved: " + data +","+ textStatus);

				showWaiting(false);
				if (data == ""){

				}else{
					// alert(data);
					$("#log_c").html(data+$("#log_c").html);
					count = data.split("<br/>").length;
					if (count > 0){
						for (var i = 0; i<count; i++){
							g_startLogline -= 1;
							_num = g_startLogline+1;
							$("#log_ln").html(_num+"<br/>"+$("#log_ln").html());
						}

						$("#log").attr("scrollTop",$("#log").attr('0'));
						
						if (g_startLogline <=0){
							$("#bt_plog").css("display", "none");
						}
					}
					// alert(g_lastLogLine);
				}

			},
			error: function(xhr, textStatus, errorThrow){
				// alert("error"+errorThrow+","+textStatus+","+xhr.responseText);
				popup("error"+errorThrow+","+textStatus+","+xhr.responseText);

				showWaiting(false);

			}
		}); // $ajax
}
function retrieve_log(){

	$.ajax({
		type: "get",
		url: "/app/rlog?sl="+g_lastLogLine+"&t="+ new Date().getTime(),
		// dataType: 'json',

		// data: {
			// appid:g_appid,
			// 			fname:fname,
			// 			type:type,
	
			// sid: '<%=@sid%>',
			// authenticity_token:window._token
		// }, 
		success: function(data, textStatus){
			// alert( "Data Saved: " + data +","+ textStatus);

			showWaiting(false);
			if (data == ""){
				
			}else{
				// alert(data);
				$("#log_c").append(data);
				count = data.split("<br/>").length;
				if (count > 0){
					for (var i = 0; i<count; i++){
						g_lastLogLine += 1;
								_num = g_lastLogLine+1;
								$("#log_ln").append(_num+"<br/>");
					}
					// appendToConsole("last log line "+g_lastLogLine);
					$("#log").attr("scrollTop",$("#log").attr('scrollHeight'));
				}
				// alert(g_lastLogLine);
			}

		},
		error: function(xhr, textStatus, errorThrow){
			// alert("error"+errorThrow+","+textStatus+","+xhr.responseText);
			popup("error"+errorThrow+","+textStatus+","+xhr.responseText);

			showWaiting(false);

		}
	}); // $ajax
}
