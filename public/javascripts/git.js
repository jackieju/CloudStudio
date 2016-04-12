	function commit_file(){
		type = g_selected_node.type;
		// fname = g_selected_node.name;
		fname = getNodePath(g_selected_node);
		// alert(fname);
		// alert(isnew);
		msg = $("#commit-description-textarea").val();
		if (type != 'bo' && type !='code')
			return;
		$.ajax({
			type: "post",
			url: "/app/commit?t="+ new Date().getTime(),
			dataType: 'json',

			data: {
				appid:g_appid,
				fname:fname,
				type:type,
				m:msg
				
				// sid: '<%=@sid%>',
				// authenticity_token:window._token
			}, 
			success: function(data, textStatus){
				// alert( "Data Saved: " + data +","+ textStatus);

				showWaiting(false);
				if (data.error){
					popup(data.error);
				}else{
					// $("#applist").html(data);
					popup('Commit successfully');
					show_editor();
				}

			},
			error: function(xhr, textStatus, errorThrow){
				// alert("error"+errorThrow+","+textStatus+","+xhr.responseText);
				popup("error"+errorThrow+","+textStatus+","+xhr.responseText);

				showWaiting(false);

			}
		}); // $ajax
	showWaiting(true);
	}
	function select_commit(){
		$("#git_commit").css("display", "block");
		$("#diff").css("display", "none");
		$("#push").css("display", "none");
		$("#pull").css("display", "none");
		$("#history").css("display", "none");
							
		$("#btn_tab_commit").addClass("selected");
		$("#btn_tab_diff").removeClass("selected");
		$("#btn_tab_push").removeClass("selected");
		$("#btn_tab_pull").removeClass("selected");
	}
	function select_diff(){
		$("#diff").css("display", "block");
		$("#git_commit").css("display", "none");
		$("#push").css("display", "none");
		$("#pull").css("display", "none");
		$("#history").css("display", "none");
							
		$("#btn_tab_diff").addClass("selected");
		$("#btn_tab_commit").removeClass("selected");
		$("#btn_tab_push").removeClass("selected");
		$("#btn_tab_pull").removeClass("selected");
		
		show_diff();
	}
	function select_hisotry(){
		$("#diff").css("display", "block");
		$("#git_commit").css("display", "none");
		$("#push").css("display", "none");
		$("#pull").css("display", "none");
		$("#history").css("display", "none");
							
		$("#btn_tab_diff").addClass("selected");
		$("#btn_tab_commit").removeClass("selected");
		$("#btn_tab_push").removeClass("selected");
		$("#btn_tab_pull").removeClass("selected");
		
		$.ajax({
			type: "post",
			url: "/app/history?f="+fname+"&t="+ new Date().getTime(),
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
				// 					popup(data.error);
				// 					diff_editor.setValue(data.data);
				// 
				// 				}else{
				// 					// alert(data.data);
				// 					// $("#diff").text(data);
				// 					popup(data.OK);

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
	function select_pull(){
		$("#diff").css("display", "block");
		$("#push").css("display", "none");
		// $("#pull").css("display", "block");
		$("#git_commit").css("display", "none");
		$("#history").css("display", "none");
		
		$("#btn_tab_pull").addClass("selected");
		$("#btn_tab_commit").removeClass("selected");
		$("#btn_tab_push").removeClass("selected");
		$("#btn_tab_diff").removeClass("selected");
		$.ajax({
			type: "post",
			url: "/app/pull?f="+fname+"&t="+ new Date().getTime(),
			dataType: 'json',

			data: {
				appid:g_appid,


				// sid: '<%=@sid%>',
				// authenticity_token:window._token
			}, 
			success: function(data, textStatus){
				// alert( "Data Saved: " + data +","+ textStatus);

				showWaiting(false);
				if (data.error){
					popup(data.error);
					diff_editor.setValue(data.data);
				
				}else{
					// alert(data.data);
					// $("#diff").text(data);
					popup(data.OK);
					
					diff_editor.setValue(data.data);
				}
				
			},
			error: function(xhr, textStatus, errorThrow){
				// alert("error"+errorThrow+","+textStatus+","+xhr.responseText);
				popup("error"+errorThrow+","+textStatus+","+xhr.responseText);

				showWaiting(false);

			}
		}); // $ajax
		showWaiting(true);
	}
	
	function select_push(){
		$("#diff").css("display", "block");
		$("#push").css("display", "none");
		$("#pull").css("display", "none");
		$("#git_commit").css("display", "none");
		$("#history").css("display", "none");
		
		$("#btn_tab_push").addClass("selected");
		$("#btn_tab_commit").removeClass("selected");
		$("#btn_tab_pull").removeClass("selected");
		$("#btn_tab_diff").removeClass("selected");
		$.ajax({
			type: "post",
			url: "/app/push?f="+fname+"&t="+ new Date().getTime(),
			dataType: 'json',

			data: {
				appid:g_appid,


				// sid: '<%=@sid%>',
				// authenticity_token:window._token
			}, 
			success: function(data, textStatus){
				// alert( "Data Saved: " + data +","+ textStatus);

				showWaiting(false);
				if (data.error){
					popup(data.error);
					diff_editor.setValue(data.data);

				}else{
					// alert(data.data);
					// $("#diff").text(data);
					popup(data.OK);

					diff_editor.setValue(data.data);
				}

			},
			error: function(xhr, textStatus, errorThrow){
				// alert("error"+errorThrow+","+textStatus+","+xhr.responseText);
				popup("error"+errorThrow+","+textStatus+","+xhr.responseText);

				showWaiting(false);

			}
		}); // $ajax
		showWaiting(true);
	}