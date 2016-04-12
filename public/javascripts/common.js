/**
	Please add following html into you html
	
	<div id="waitingbg" style="display:none;z-index:1000;position:absolute;left:0;top:0;width:100%;height:100%;">
		<center>			
			<img src="/images/wait3.gif" style="width:50px;margin-top:230px;"/>
		</center>
	</div>
	
*/
function showWaiting(show){
	if (show)
		$("#waitingbg").css("display", "block");
	else
		$("#waitingbg").css("display", "none");	
}





/**
	Please add following html into you html
	
	<div id="popup" class="round_border_b" style="display:none;opacity:0.3;background-color:black;color:white;text-align:center;padding:28px;position:absolute;left:500px;top:180px;z-index:800;width:300px;height:168px;font-size:13pt;min-height:57px;max-height:300px;overflow:auto;word-wrap: break-word;word-break: normal;border:0px red solid;" onclick="close_popup();">
		<div id="popup_c" style="margin:10px;top:50%; transform: translateY(-50%);position:relative;border:0px solid red;">	
		</div>
	</div>
	
*/
// if not pos, will centrize the popup
function popup(msg, size, pos){
	$("#popup_c").html(msg);
	show_popup(size, pos);

}
function close_popup(){
	$("#popup").css("display", "none");
	$("#popup_c").html("");
}
function show_popup(size, pos, csses){
	pos = pos || null;
	size = size || null;
	csses = csses || null;
	
	$("#popup").css("display", "block");
	console.log("pos="+pos);
	var w = 300;//$("#popup").width();
	var h = 168;//$("#popup").height(); 
	if (size !=null) {
		w = size.width;
		h = size.height;
	}
	console.log("w="+w);
	$("#popup").width(w);
	$("#popup").height(h);
		// $("#popup").css("line-height", h);
	var x;
	var y;
	if (pos == null){
		// centerize
		x = ($(window).width() - w)/2;
		y = ($(window).height() - h)/2;

	}else{
		x = pos.x;
		y = pos.y;

	}
	if (x < 100)
		x = 100;
	if (y < 100)
		y = 100;
	$("#popup").css("left", x+"px");
	$("#popup").css("top", y+"px");
	
	// default css
	$("#popup").css("text-align", "center");
	
	if (csses){
		for (key in csses)
			k = key.replace(/_/g, "-");
			$("#popup").css(k, csses[key]);
	}
}

function appendToPopup(msg){
	// show_popup(size, pos);
	h = $("#popup_c").html();
	// alert(h);
	$("#popup_c").html(h+"<div>"+msg+"</div>");
	h = $("#popup").prop('scrollHeight');
	t = $("#popup").prop("scrollTop");
	$("#popup").prop("scrollTop", h);
}
function appendToOutput(msg){
	h = $("#pane3").html();
	// alert(h);
	$("#pane3").html(h+"<div>"+msg+"</div>");
	h = $("#pane3").prop('scrollHeight');
	t = $("#pane3").prop("scrollTop");
	$("#pane3").prop("scrollTop", h);
}



