// =======
// = git =
// =======				
		function show_diff(){
			var fname="";
			if (g_selected_node && g_selected_node.type == "bo" || g_selected_node.type == "file" ||  g_selected_node.type == "code")
					fname = getNodePath(g_selected_node);
				
				diff_editor.setValue("");
				$.ajax({
					type: "post",
					url: "/app/diff?f="+fname+"&t="+ new Date().getTime(),
					// dataType: 'json',

					data: {
						appid:g_appid,
					

						// sid: '<%=@sid%>',
						// authenticity_token:window._token
					}, 
					success: function(data, textStatus){
						// alert( "Data Saved: " + data +","+ textStatus);

						showWaiting(false);
						// if (data.error){
						// 						popup(data.error);
						// 					}else{
							// alert(data.data);
							// $("#diff").text(data);
							diff_editor.setValue(data);
						// }

					},
					error: function(xhr, textStatus, errorThrow){
						// alert("error"+errorThrow+","+textStatus+","+xhr.responseText);
						popup("error"+errorThrow+","+textStatus+","+xhr.responseText);

						showWaiting(false);

					}
				}); // $ajax
			
			showWaiting(true);
		}
		function show_git(){
			switch_view("git");
			// $("#editor").css("display", "none");	
			// $("#bo_designer").css("display", "none");
			// $("#log").css("display", "none");
			// 
			// $("#git").css("display", "block");
			select_commit();
			
			// g_currentView = "git";
			fname = "";
			diff_editor.setValue("");
			

		}
